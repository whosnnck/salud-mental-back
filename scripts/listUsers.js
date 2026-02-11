const db = require("../src/config/db");

(async () => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, full_name, role FROM users LIMIT 10",
    );
    console.log("Usuarios encontrados:", rows.length);
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error("Error consultando usuarios:", err.message);
    process.exit(1);
  }
})();
