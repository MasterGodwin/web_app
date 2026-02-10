// const express = require("express");
// const router = express.Router();
// const { sql, poolPromise } = require("../db");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// router.post("/", async (req, res) => {
//   try {
//     const { name, password } = req.body;

//     if (!name || !password) {
//       return res.status(400).json({
//         message: "name and password are required"
//       });
//     }

//     const pool = await poolPromise;
//     const request = pool.request();

//     request.input("username", sql.VarChar, name);

//     const result = await request.query(`
//       SELECT log.id, log.username, log.password, r.Role
//       FROM Admin log
//       JOIN Role r ON log.role_id = r.id
//       WHERE log.username = @username 
//     `);

//     if (result.recordset.length === 0) {
//       return res.status(401).json({
//         message: "Invalid username or password"
//       });
//     }

//     const user = result.recordset[0];

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({
//         message: "Invalid username or password"
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         role: user.Role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token: token,
//       role: user.Role
//     });

//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({
//       message: "An error occurred during login"
//     });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        message: "Username and password required"
      });
    }

    const pool = await poolPromise;

    // 1️⃣ Check Admin table
    let result = await pool.request()
      .input("name", sql.VarChar, name)
      .query(`
        SELECT id, username, password, 'admin' AS role
        FROM Admin
        WHERE username = @name
      `);

    let user = result.recordset[0];

    // 2️⃣ If not admin → check Subscriber
    if (!user) {
      result = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
          SELECT id, user_name, password, 'subscriber' AS role
          FROM Subscriber
          WHERE user_name = @name
        `);

      user = result.recordset[0];
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid login" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid login" });
    }

    // 3️⃣ Single token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login success",
      token,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
});

module.exports = router;

