const db = require("../src/config/db");
const bcrypt = require("bcrypt");

const passwordToSet = process.argv[2] || "123456";
const exclude = (process.argv[3] || "juan@example.com").split(",");

(async () => {
  try {
    console.log(`Generando hash para contraseña '${passwordToSet}'...`);
    const hash = await bcrypt.hash(passwordToSet, 10);

    const [rows] = await db.query("SELECT id, email FROM users");
    let updated = 0;
    for (const r of rows) {
      if (exclude.includes(r.email)) {
        console.log(`Saltando ${r.email}`);
        continue;
      }
      await db.query("UPDATE users SET password = ? WHERE id = ?", [
        hash,
        r.id,
      ]);
      console.log(`Actualizada contraseña para ${r.email}`);
      updated++;
    }

    console.log(`Proceso completado. Contraseñas actualizadas: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
