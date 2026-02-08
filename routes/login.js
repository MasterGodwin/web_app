const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const pool = await poolPromise;
    const request = pool.request();

    request.input("username", sql.VarChar, username);

    const result = await request.query(`
      SELECT log.id, log.username, log.password, r.role_name
      FROM login log
      JOIN role r ON log.role = r.id
      WHERE log.username = @username AND log.deleted_at = 0
    `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const user = result.recordset[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token: token,
      role: user.role_name
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "An error occurred during login"
    });
  }
});

module.exports = router;
