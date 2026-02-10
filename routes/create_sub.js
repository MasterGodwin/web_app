const { sql, config } = require("../db");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

router.post("/subscriber/create", async (req, res) => {
  try {
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

    // validation
    if (!user_name || !password || !role_id) {
      return res.status(400).json({
        message: "Sub_name, password and role_id are required"
      });
    }

    const pool = await sql.connect(config);

    // ROLE CHECK (separate request)
    const roleRequest = pool.request();
    roleRequest.input("role_id", sql.Int, role_id);

    const roleCheck = await roleRequest.query(
      "SELECT id FROM Role WHERE id = @role_id"
    );

    if (roleCheck.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    //  hash password (ONLY ONCE)
    const hash = await bcrypt.hash(password, 10);

    //  INSERT subscriber (new request)
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

    res.status(201).json({
      message: "Subscriber created successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
