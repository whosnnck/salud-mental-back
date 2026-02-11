const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET_KEY =
  process.env.JWT_SECRET || "tu_clave_secreta_super_segura_aqui";

exports.register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Validar que todos los campos estén presentes
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        message: "Por favor proporciona todos los campos requeridos",
      });
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
      [full_name, email, hashedPassword, role],
    );

    // Crear token
    const token = jwt.sign({ id: result.insertId, role: role }, SECRET_KEY, {
      expiresIn: "8h",
    });

    res.status(201).json({
      message: "Cuenta creada correctamente",
      token: token,
      user: {
        id: result.insertId,
        email: email,
        full_name: full_name,
        role: role,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      message: "Error al registrar usuario",
      details: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que email y password estén presentes
    if (!email || !password) {
      return res.status(400).json({
        message: "Por favor proporciona email y contraseña",
      });
    }

    // Buscar usuario
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = users[0];

    // Comparar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Crear token JWT
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "8h",
    });

    res.json({
      message: "Login exitoso",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      message: "Error al iniciar sesión",
      details: error.message,
    });
  }
};

exports.logout = (req, res) => {
  // En un sistema con tokens JWT, el logout ocurre en el cliente
  // Elimina el token del localStorage
  res.json({ message: "Sesión cerrada correctamente" });
};
