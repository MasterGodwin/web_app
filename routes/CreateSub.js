const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");

router.post("/create", auth, async (req, res) => {
  const {
    Company_name,
    Gst_number,
    Pan_number,
    Sub_name,
    role_id,
    Mob_number,
    City,
    State,
    user_name,
    password 
  } = req.body;

  const pool = await sql.connect(config);
  const hash = await bcrypt.hash(password, 10);

    const insertRequest = pool.request();

    insertRequest.input("Company_name", sql.VarChar, Company_name);
    insertRequest.input("Gst_number", sql.VarChar, Gst_number);
    insertRequest.input("Pan_number", sql.VarChar, Pan_number);
    insertRequest.input("Sub_name", sql.VarChar, Sub_name);
    insertRequest.input("role_id", sql.Int, role_id);
    insertRequest.input("Mob_number", sql.Int, Mob_number);
    insertRequest.input("City", sql.VarChar, City);
    insertRequest.input("State", sql.VarChar, State);
    insertRequest.input("user_name", sql.VarChar, user_name);
    insertRequest.input("password", sql.VarChar, hash);

    await insertRequest.query(`
      INSERT INTO subscriber
      (Company_name, Gst_number, Pan_number, Sub_name, role_id,
       Mob_number, City, State, user_name, password)
      VALUES
      (@Company_name, @Gst_number, @Pan_number, @Sub_name, @role_id,
       @Mob_number, @City, @State, @user_name, @password)
    `);
  res.status(201).json({ message: "Subscriber created" });
});

module.exports = router;

