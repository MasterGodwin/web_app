const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");
const bcrypt = require("bcrypt");

router.post("/create", async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body   ;
    console.log("recive",email)
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({
        message: "name, email, password and role_id are required"
      });
    }

    const pool = await sql.connect(config);

    const emailCheck = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
    SELECT email FROM Admin WHERE email = @email
    UNION
    SELECT email FROM Subscriber WHERE email = @email
    UNION
    SELECT email FROM Users5 WHERE email = @email
  `);

    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({
        message: "Email already exists in system"
      });
    }


    const request = pool.request();

    // role check
    request.input("role_id", sql.Int, role_id);
    const roleCheck = await request.query(
      "SELECT id FROM Role WHERE id = @role_id"
    );

    if (roleCheck.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    request.input("username", sql.VarChar, name);
    request.input("email",sql.VarChar,email);
    request.input("password", sql.VarChar, hashedPassword);

    await request.query(`
      INSERT INTO Admin (username,email,password, role_id)
      VALUES (@username,@email, @password, @role_id)
    `);

    res.status(201).json({ message: "Admin created successfully" });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({
      message: "Admin creation failed",
      error: err.message
    });
  }
});

module.exports = router;
