const db = require("../src/config/db");
const bcrypt = require("bcrypt");

(async () => {
  try {
    console.log("Creando backup users -> users_backup_all (si no existe)...");
    await db.query("CREATE TABLE IF NOT EXISTS users_backup_all LIKE users");
    await db.query("INSERT INTO users_backup_all SELECT * FROM users");

    const [rows] = await db.query("SELECT id, email, password FROM users");
    console.log(`Encontrados ${rows.length} usuarios. Procesando...`);

    let updated = 0;
    for (const r of rows) {
      const { id, email, password } = r;
      if (typeof password === "string" && password.startsWith("$2")) {
        console.log(`Usuario ${email} (${id}) ya tiene hash, saltando.`);
        continue;
      }
      // conservar el valor actual como plaintext y hashearlo
      const hashed = await bcrypt.hash(String(password), 10);
      await db.query("UPDATE users SET password = ? WHERE id = ?", [
        hashed,
        id,
      ]);
      console.log(`Usuario ${email} (${id}): contraseña hasheada.`);
      updated++;
    }

    console.log(`Proceso completado. Contraseñas actualizadas: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error("Error en hashAllPasswords:", err.message);
    process.exit(1);
  }
})();
