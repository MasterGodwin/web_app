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

// Read data
router.get("/view",auth,async(req,res)=>{
  const pool= await sql.connect(config);
  const result = await pool.request()
    .query("select * from Subscriber")
  res.json(result.recordset);
});

// Update Date
router.put("/Update/:id",auth,async(req,res)=>{
  const id = req.params.id;
  const { Company_name, City, State } = req.body;

  const pool = await sql.connect(config);

  await pool.request()
    .input("id", sql.Int, id)
    .input("Company_name", sql.VarChar, Company_name)
    .input("City", sql.VarChar, City)
    .input("State", sql.VarChar, State)
    .query(`
      UPDATE Subscriber SET 
        Company_name  =@Company_name,
        City          =@City,
        State         =@State
      WHERE id=@id
    `);

  res.json({ message: "Subscriber updated" });
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

