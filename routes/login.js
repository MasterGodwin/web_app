
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { username, password, subscriber_id } = req.body;
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
    if (!subscriber_id) {
      return res.status(400).json({ message: "subscriber_id required" });
    }

    result = await pool.request()
      .input("user_name", sql.VarChar, username)
      .input("Sub_id", sql.Int, subscriber_id)
      .query(`
        SELECT id, user_name, password, Sub_id
        FROM Users5
        WHERE user_name=@user_name AND Sub_id=@sub_id
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
      user_id: user.id,     //  CHANGE HERE
      sub_id: user.Sub_id || null,
      role: role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, role });
});

module.exports = router;
