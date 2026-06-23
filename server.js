const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: { rejectUnauthorized: false }
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

app.get("/", async (req, res) => {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT e.*, es.nomespecialidad AS especialidad_nombre FROM estudiantes e LEFT JOIN especialidades es ON e.especialidad = es.idespecialidades ORDER BY e.id DESC"
  );
  const [especialidades] = await conn.execute(
    "SELECT idespecialidades, nomespecialidad FROM especialidades"
  );
  await conn.end();
  res.render("index", { estudiantes: rows, especialidades, error: null, form: {} });
});

app.post("/crear", async (req, res) => {
  const { nombre, colegio, correo, interes, examen, estado, especialidad } = req.body;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const allowedExamen = ["SI", "NO"];
  const allowedEstado = ["ACT", "INA"];
  const form = { nombre, colegio, correo, interes, examen, estado, especialidad };

  const renderWithError = async (message) => {
    try {
      const conn = await getConnection();
      const [rows] = await conn.execute("SELECT * FROM estudiantes ORDER BY id DESC");
      const [especialidades] = await conn.execute(
        "SELECT idespecialidades, nomespecialidad FROM especialidades"
      );
      await conn.end();
      res.render("index", { estudiantes: rows, especialidades, error: message, form });
    } catch (renderError) {
      console.error("Error renderizando formulario de creación:", renderError);
      res.status(500).send("Ocurrió un error interno al mostrar el formulario.");
    }
  };

  try {
    if (!nombre || !nombre.trim()) {
      return await renderWithError("Nombre es obligatorio.");
    }

    if (!colegio || !colegio.trim()) {
      return await renderWithError("Colegio es obligatorio.");
    }

    if (!correo || !emailPattern.test(correo)) {
      return await renderWithError("Correo inválido.");
    }

    if (!/^[0-9]+$/.test(interes)) {
      return await renderWithError("Interes debe ser un número entero.");
    }

    if (!allowedExamen.includes(examen)) {
      return await renderWithError("Opción de examen inválida.");
    }

    if (!allowedEstado.includes(estado)) {
      return await renderWithError("Estado inválido.");
    }

    if (!/^[0-9]+$/.test(especialidad)) {
      return await renderWithError("Especialidad inválida.");
    }

    const fecha = new Date();
    const conn = await getConnection();
    await conn.execute(
      "INSERT INTO estudiantes (nombre, colegio, correo, interes, examen, estado, especialidad, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre.trim(), colegio.trim(), correo.trim(), interes, examen, estado, 2, fecha]
    );
    await conn.end();
    res.redirect("/");
  } catch (error) {
    console.error("Error en POST /crear:", error);
    return await renderWithError("Ocurrió un problema al guardar el registro. Intenta de nuevo.");
  }
});

app.get("/editar/:id", async (req, res) => {
  const conn = await getConnection();
  const [rows] = await conn.execute("SELECT * FROM estudiantes WHERE id = ?", [req.params.id]);
  const [especialidades] = await conn.execute(
    "SELECT idespecialidades, nomespecialidad FROM especialidades"
  );
  await conn.end();
  res.render("edit", { estudiante: rows[0], especialidades, error: null });
});

app.post("/actualizar/:id", async (req, res) => {
  const { nombre, colegio, correo, interes, examen, estado, especialidad } = req.body;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const allowedExamen = ["SI", "NO"];
  const allowedEstado = ["ACT", "INA"];
  const estudiante = { id: req.params.id, nombre, colegio, correo, interes, examen, estado, especialidad };

  const renderWithError = async (message) => {
    try {
      const conn = await getConnection();
      const [especialidades] = await conn.execute(
        "SELECT idespecialidades, nomespecialidad FROM especialidades"
      );
      await conn.end();
      res.render("edit", { estudiante, especialidades, error: message });
    } catch (renderError) {
      console.error("Error renderizando formulario de edición:", renderError);
      res.status(500).send("Ocurrió un error interno al mostrar el formulario.");
    }
  };

  try {
    if (!nombre || !nombre.trim()) {
      return await renderWithError("Nombre es obligatorio.");
    }

    if (!colegio || !colegio.trim()) {
      return await renderWithError("Colegio es obligatorio.");
    }

    if (!correo || !emailPattern.test(correo)) {
      return await renderWithError("Correo inválido.");
    }

    if (!/^[0-9]+$/.test(interes)) {
      return await renderWithError("Interes debe ser un número entero.");
    }

    if (!allowedExamen.includes(examen)) {
      return await renderWithError("Opción de examen inválida.");
    }

    if (!allowedEstado.includes(estado)) {
      return await renderWithError("Estado inválido.");
    }

    if (!/^[0-9]+$/.test(especialidad)) {
      return await renderWithError("Especialidad inválida.");
    }

    const conn = await getConnection();
    await conn.execute(
      "UPDATE estudiantes SET nombre = ?, colegio = ?, correo = ?, interes = ?, examen = ?, estado = ?, especialidad = ? WHERE id = ?",
      [nombre.trim(), colegio.trim(), correo.trim(), interes, examen, estado, especialidad, req.params.id]
    );
    await conn.end();
    res.redirect("/");
  } catch (error) {
    console.error("Error en POST /actualizar/", req.params.id, error);
    return await renderWithError("Ocurrió un problema al actualizar el registro. Intenta de nuevo.");
  }
});

app.post("/eliminar/:id", async (req, res) => {
  const conn = await getConnection();
  await conn.execute("DELETE FROM estudiantes WHERE id = ?", [req.params.id]);
  await conn.end();
  res.redirect("/");
});

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).send("Ocurrió un error interno en el servidor.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App running on port ${port}`));