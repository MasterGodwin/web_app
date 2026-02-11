// const express = require("express");
// const router = express.Router();
// const { sql, poolPromise } = require("../db");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
 
// router.post("/login", async (req, res) => {
//   try {
//     const { username, password, subscriber_id } = req.body;
 
//     if (!username || !password) {
//       return res.status(400).json({ message: "Username and password required" });
//     }
 
//     const pool = await poolPromise;
 
//     let result, userType;
 
//     result = await pool.request()
//       .input("username", sql.VarChar, username)
//       .query(`
//         SELECT ad.id, ad.user_name, ad.password, r.Role
//         FROM Admin ad
//         JOIN Role r ON ad.role_id = r.id
//         WHERE ad.username = @username 
//       `);
 
//     if (result.recordset.length > 0) {
//       userType = "admin";
//     }
   
//     else {
//       result = await pool.request()
//         .input("username", sql.VarChar, username)
//         .query(`
//           SELECT s.id, s.user_name, s.password, r.Role
//           FROM Subscriber s
//           JOIN Role r ON s.role_id = r.id
//           WHERE s.username = @username 
//         `);
 
//       if (result.recordset.length > 0) {
//         userType = "subscriber";
//       }
//     }
 
//     if (!result || result.recordset.length === 0) {
//       if (!subscriber_id) {
//         return res.status(400).json({
//           message: "subscriber_id required for user login"
//         });
//       }
 
//       result = await pool.request()
//         .input("username", sql.VarChar, username)
//         .input("subscriber_id", sql.Int, subscriber_id)
//         .query(`
//           SELECT
//             u.id,
//             u.user_name,
//             u.password,
//             u.role_id,
//             u.Sub_id,
//             u.Name,
//             u.Mob_number,
//             u.Pan_number,
//             u.City,
//             u.State
//           FROM Users5 u
//           WHERE u.user_name = @user_name
//           AND u.Sub_id = @Sub_id
//         `);
 
//       userType = "user";
//     }
 
//     if (result.recordset.length === 0) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
 
//     const user = result.recordset[0];
 
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
 
//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         role: user.role || user.role_id,
//         subscriber_id: user.subscriber_id || null,
//         type: userType,
 
//         name: user.name,
//         city: user.city,
//         mobile_number: user.mobile_number
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
 
//     res.json({
//       message: "Login successful",
//       token,
//       usertype: userType
//     });
 
//   } catch (err) {
//     console.error("LOGIN ERROR", err);
//     res.status(500).json({ message: "Login failed" });
//   }
// });
 
// module.exports = router;
 
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
      user_id: user.id,     // 🔥 CHANGE HERE
    sub_id: user.Sub_id,
    role: 'user' 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, role });
});

module.exports = router;
