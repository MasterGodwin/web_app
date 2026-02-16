
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const pool = await poolPromise;

    let user, role;

    // 1️⃣ ADMIN
    let result = await pool.request()
      .input("username", sql.VarChar, username)
      .query(`SELECT id, username, password FROM Admin WHERE username=@username`);

    if (result.recordset.length) {
      user = result.recordset[0];
      role = "admin";
    }

    // 2️⃣ SUBSCRIBER
    if (!user) {
      result = await pool.request()
        .input("user_name", sql.VarChar, username)
        .query(`SELECT id, user_name, password FROM Subscriber WHERE user_name=@user_name`);

      if (result.recordset.length) {
        user = result.recordset[0];
        role = "subscriber";
      }
    }

    // 3️⃣ USER
    if (!user) {
      result = await pool.request()
        .input("user_name", sql.VarChar, username)
        .query(`
          SELECT id, user_name, password
          FROM Users5
          WHERE user_name=@user_name
        `);

      if (result.recordset.length) {
        user = result.recordset[0];
        role = "user";
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        user_id: user.id,
        sub_id: user.Sub_id || null,
        role: role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;
