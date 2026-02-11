const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const checkinRoutes = require("./routes/checkins.routes");
const diaryRoutes = require("./routes/diary.routes");
const supportRoutes = require("./routes/support.routes");
const employeeRoutes = require("./routes/employees.routes");

const app = express();

// Configurar CORS para permitir solicitudes desde el frontend (dev)
// Durante desarrollo reflejamos el origin para aceptar el puerto que Angular use
app.use(
  cors({
    /*
    origin: true,
    */
    origin: "https://salud-mental-front.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/employees", employeeRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API Salud Mental funcionando correctamente");
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

/*
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
  console.log(` CORS habilitado para http://localhost:4200`);
});
*/

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
