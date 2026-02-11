const jwt = require("jsonwebtoken");

const SECRET_KEY =
  process.env.JWT_SECRET || "tu_clave_secreta_super_segura_aqui";

exports.verifyToken = (req, res, next) => {
  // Obtener el token del header Authorization: "Bearer token"
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ error: "Token requerido" });
  }

  // Extraer el token del formato "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId;
    req.userRole = decoded.role || decoded.userRole;
    next();
  } catch (err) {
    console.error("Error en verificación de token:", err.message);
    return res.status(401).json({
      error: "Token inválido o expirado",
      details: err.message,
    });
  }
};
