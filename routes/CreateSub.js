const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const role = require("../middleware/role")

// Create Subscriber
router.post("/create",  auth, async (req, res) => {
  const {
    Company_name,
    Gst_number,
    Pan_number,
    Sub_name,
    Mob_number,
    City,
    State,
    user_name,
    password,
    email
  } = req.body;

  const pool = await sql.connect(config);
  // check existing user_name
  const check = await pool.request()
    .input("email", sql.VarChar, email)
    .query(`
    SELECT email FROM Admin WHERE email = @email
    UNION
    SELECT email FROM Subscriber WHERE email = @email
    UNION
    SELECT email FROM Users WHERE email = @email
  `);

  if (check.recordset.length > 0) {
    return res.status(400).json({ message: "User name already exists" });
  }


  const hash = await bcrypt.hash(password, 10);

    const insertRequest = pool.request();

    insertRequest.input("Company_name", sql.VarChar, Company_name);
    insertRequest.input("Gst_number", sql.VarChar, Gst_number);
    insertRequest.input("Pan_number", sql.VarChar, Pan_number);
    insertRequest.input("Sub_name", sql.VarChar, Sub_name);
    insertRequest.input("role_id", sql.Int, 2);
    insertRequest.input("Mob_number", sql.Int, Mob_number);
    insertRequest.input("City", sql.VarChar, City);
    insertRequest.input("State", sql.VarChar, State);
    insertRequest.input("user_name", sql.VarChar, user_name);
    insertRequest.input("password", sql.VarChar, hash);
    insertRequest.input("email", sql.VarChar, email);

    await insertRequest.query(`
      INSERT INTO subscriber
      (Company_name, Gst_number, Pan_number, Sub_name, role_id,
       Mob_number, City, State, user_name, password,email)
      VALUES
      (@Company_name, @Gst_number, @Pan_number, @Sub_name, @role_id,
       @Mob_number, @City, @State, @user_name, @password,@email)
    `);
  res.status(201).json({ message: "Subscriber created" });
});

// Read data
router.get("/view",auth,async(req,res)=>{
  const pool= await sql.connect(config);
  const result = await pool.request()
    .query("select * from Subscriber")
  res.json(result.recordset);
});

// Update Date
router.put("/update/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const {
      user_name,
      password,
      Mob_number,
      State,
      City,
      Sub_name,
      Pan_number,
      Gst_number,
      Company_name,
      email
    } = req.body;

    const pool = await sql.connect(config);
    const request = pool.request();
    // check duplicate (exclude current id)
    const check = await pool.request()
      .input("email", sql.VarChar, email)
      .input("id", sql.Int, id)
      .query(`
    SELECT email FROM Admin WHERE email = @email
    UNION
    SELECT email FROM Subscriber WHERE email = @email and  id <> @id
    UNION
    SELECT email FROM Users5 WHERE email = @email
  `);

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: "User name already exists" });
    }


    let updateFields = [];

    request.input("id", sql.Int, id);

    if (user_name !== undefined) {
      request.input("user_name", sql.VarChar, user_name);
      updateFields.push("user_name = @user_name");
    }

    if (password) {   // ✅ only hash if password exists
      const hash = await bcrypt.hash(password, 10);
      request.input("password", sql.VarChar, hash);
      updateFields.push("password = @password");
    }

    if (email !== undefined) {
      request.input("email", sql.VarChar, email);
      updateFields.push("email = @email");
    }

    if (Mob_number !== undefined) {
      request.input("Mob_number", sql.Int, Mob_number);
      updateFields.push("Mob_number = @Mob_number");
    }

    if (State !== undefined) {
      request.input("State", sql.VarChar, State);
      updateFields.push("State = @State");
    }

    if (City !== undefined) {
      request.input("City", sql.VarChar, City);
      updateFields.push("City = @City");
    }

    if (Sub_name !== undefined) {
      request.input("Sub_name", sql.VarChar, Sub_name);
      updateFields.push("Sub_name = @Sub_name");
    }

    if (Pan_number !== undefined) {
      request.input("Pan_number", sql.VarChar, Pan_number);
      updateFields.push("Pan_number = @Pan_number");
    }

    if (Gst_number !== undefined) {
      request.input("Gst_number", sql.VarChar, Gst_number);
      updateFields.push("Gst_number = @Gst_number");
    }

    if (Company_name !== undefined) {
      request.input("Company_name", sql.VarChar, Company_name);
      updateFields.push("Company_name = @Company_name");
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `
      UPDATE Subscriber
      SET ${updateFields.join(", ")}
      WHERE id = @id
    `;

    await request.query(query);

    res.json({ message: "Subscriber updated successfully" });

  } catch (err) {
  console.error("FULL ERROR:", err);
  res.status(500).json({ error: err.message });   // 👈 change this
}

});



//Delete data

router.delete("/delete/:id",auth,async(req,res)=>{
  const id=req.params.id;

  const pool = await sql.connect(config)

  await pool.request()
    .input("id",sql.Int,id)
    .query("delete from Subscriber where id=@id")
  res.json({message:"Data Deleted successfully"})
})

module.exports = router;

