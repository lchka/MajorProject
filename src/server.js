import express from "express";
import pool from "./db.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running inside Docker 🚀");
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
