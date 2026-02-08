const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");

router.post("/create_role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        message: "Role is required"
      });
    }

    const pool = await sql.connect(config);
    const request = pool.request();

    request.input("role", sql.VarChar, role);

    const checkRole = await request.query(`
      SELECT id FROM role WHERE role = @role
    `);

    if (checkRole.recordset.length > 0) {
      return res.status(400).json({
        message: "Role already exists"
      });
    }

    await request.query(`
      INSERT INTO role (role)
      VALUES (@role)
    `);

    res.status(201).json({
      message: "Role created successfully"
    });

  } catch (err) {
    console.error("CREATE ROLE ERROR", err);
    res.status(500).json({
      message: "Role creation failed",
      error: err.message
    });
  }
});

module.exports = router;