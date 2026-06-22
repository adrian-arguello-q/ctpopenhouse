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
  const [rows] = await conn.execute("SELECT * FROM estudiantes ORDER BY id DESC");
  await conn.end();
  res.render("index", { estudiantes: rows });
});

app.post("/crear", async (req, res) => {
  const { nombre, correo, estado } = req.body;
  const conn = await getConnection();
  await conn.execute(
    "INSERT INTO estudiantes (nombre, correo, estado) VALUES (?, ?, ?)",
    [nombre, correo, estado]
  );
  await conn.end();
  res.redirect("/");
});

app.get("/editar/:id", async (req, res) => {
  const conn = await getConnection();
  const [rows] = await conn.execute("SELECT * FROM estudiantes WHERE id = ?", [req.params.id]);
  await conn.end();
  res.render("edit", { estudiante: rows[0] });
});

app.post("/actualizar/:id", async (req, res) => {
  const { nombre, correo, estado } = req.body;
  const conn = await getConnection();
  await conn.execute(
    "UPDATE estudiantes SET nombre = ?, correo = ?, estado = ? WHERE id = ?",
    [nombre, correo, estado, req.params.id]
  );
  await conn.end();
  res.redirect("/");
});

app.post("/eliminar/:id", async (req, res) => {
  const conn = await getConnection();
  await conn.execute("DELETE FROM estudiantes WHERE id = ?", [req.params.id]);
  await conn.end();
  res.redirect("/");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App running on port ${port}`));