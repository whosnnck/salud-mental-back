const db = require("../src/config/db");
const bcrypt = require("bcrypt");

const email = process.argv[2] || "juan@example.com";
const newPassword = process.argv[3] || "password123";

(async () => {
  try {
    console.log("Creando backup de users -> users_backup (si no existe)...");
    await db.query("CREATE TABLE IF NOT EXISTS users_backup LIKE users");
    await db.query("INSERT INTO users_backup SELECT * FROM users");

    console.log(`Generando hash bcrypt para ${email}...`);
    const hash = await bcrypt.hash(newPassword, 10);

    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hash, email],
    );
    console.log(`Filas afectadas: ${result.affectedRows}`);

    const [rows] = await db.query(
      "SELECT id, email, password FROM users WHERE email = ?",
      [email],
    );
    console.log("Registro actualizado:", rows[0]);

    process.exit(0);
  } catch (err) {
    console.error("Error actualizando contraseña:", err.message);
    process.exit(1);
  }
})();
