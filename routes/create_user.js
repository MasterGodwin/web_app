const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password and role are required"
      });
    }

    const pool = await sql.connect(config);
    const request = pool.request();
 
    request.input("role_name", sql.VarChar, role);

    const roleResult = await request.query(`
      SELECT id FROM role WHERE role_name = @role_name
    `);

    if (roleResult.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const roleId = roleResult.recordset[0].id;
 
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const insertRequest = pool.request();
    insertRequest.input("username", sql.VarChar, username);
    insertRequest.input("password", sql.VarChar, hashedPassword);
    insertRequest.input("role_id", sql.Int, roleId);

    await insertRequest.query(`
      INSERT INTO login (username, password, role, created_at, deleted_at)
      VALUES (@username, @password, @role_id, GETDATE(), 0)
    `);

    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    console.error("CREATE USER ERROR", err);
    res.status(500).json({
      message: "Create failed",
      error: err.message
    });
  }
});


router.get("/", async (req, res) => {
  try {
    await sql.connect(config);

    const result = await sql.query(`
      SELECT * FROM login
      WHERE deleted_at = 0 
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await sql.connect(config);

    const result = await sql.query(`
      SELECT * FROM login
      WHERE id = ${req.params.id}
        AND deleted_at = 0
    `);

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

router.put("/", async (req, res) => {
  try {
    const { id, username, password } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const pool = await sql.connect(config);
    const request = pool.request();

    request.input("id", sql.Int, id);
    request.input("username", sql.VarChar, username);

    let query = `
      UPDATE login
      SET username = @username, updated_at = GETDATE()
    `;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      request.input("password", sql.VarChar, hashedPassword);
      query += `, password = @password`;
    }

    query += ` WHERE id = @id AND deleted_at = 0`;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error("UPDATE ERROR", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const pool = await sql.connect(config);
    const request = pool.request();

    request.input("id", sql.Int, id);

    const result = await request.query(`
      UPDATE login
      SET deleted_at = 1
      WHERE id = @id
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});


module.exports = router;