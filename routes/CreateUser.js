const express = require("express");
const router = express.Router();
const { sql,poolPromise,config } = require("../db");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const mssql=require("mssql")


// Create User
router.post("/create", auth, async (req, res) => {

  const {
            Sub_id,	
            Pan_number,	
            role_id,	
            Name,	
            Mob_number,	
            City,	
            State,	
            user_name,	
            password
        } = req.body;
  const sub_id = req.user.id; // JWT la irunthu

  const pool = await sql.connect(config);

  const exists = await pool.request()
    .input("user_name", sql.VarChar, user_name)
    .input("Sub_id", sql.Int, sub_id)
    .query(`
      SELECT id FROM Users5
      WHERE user_name=@user_name AND Sub_id=@Sub_id
    `);

  if (exists.recordset.length) {
    return res.status(400).json({ message: "User exists" });
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.request()
    .input("role_id", sql.Int, role_id)
    .input("Sub_id", sql.Int, Sub_id)
    .input("Name", sql.VarChar, Name)
    .input("Mob_number", sql.VarChar, Mob_number)
    .input("Pan_number", sql.VarChar, Pan_number)
    .input("City", sql.VarChar, City)
    .input("State", sql.VarChar, State)
    .input("user_name", sql.VarChar, user_name)
    .input("password", sql.VarChar, hash)
    .query(`
        INSERT INTO users5
        (role_id, Sub_id, Name, Mob_number, Pan_number,
         City, State, user_name, password)
        VALUES
        (@role_id, @Sub_id, @Name, @Mob_number, @Pan_number,
         @City, @State, @user_name, @password)
      `);
  res.status(201).json({ message: "User created" });
});

//Read User
router.get("/view",auth,async(req,res)=>{
    const sub_id=req.user.sub_id
    const pool=await sql.connect(config);
    const result=await pool.request()
        .input("Sub_id",sql.Int,sub_id)
        .query(`select * from Users5 `)
    
    res.json(result.recordset);
});

//Upate User
router.put("/update/:id", auth, async (req, res) => {
  try {
    
    const userId = parseInt(req.params.id);
    const sub_id = req.user.sub_id;
    console.log("TOKEN SUB_ID 👉", sub_id);
console.log("USER ID 👉", userId);
    console.log("check:" ,req.body)
    const {
      Pan_number,
      role_id,
      Name,
      Mob_number,
      City,
      State,
      user_name,
      password
    } = req.body;

    const pool = await sql.connect(config);

    // Check ownership
    const check = await pool.request()
      .input("id", sql.Int, userId)
      .input("Sub_id", sql.Int, sub_id)
      .query(`
        SELECT id FROM Users5
        WHERE id=@id 
      `);

    if (!check.recordset.length) {
      return res.status(403).json({
        message: "You are not allowed to update this user"
      });
    }

    // If password exists hash it
    let query = `
      UPDATE Users5 SET
        Name=@Name,
        Pan_number=@Pan_number,
        Mob_number=@Mob_number,
        City=@City,
        State=@State,
        user_name=@user_name,
        role_id=@role_id
    `;

    const request = pool.request()
      .input("id", sql.Int, userId)
      .input("Sub_id", sql.Int, sub_id)
      .input("role_id", sql.Int, role_id)
      .input("Name", sql.VarChar, Name)
      .input("Mob_number", sql.VarChar, Mob_number)
      .input("Pan_number", sql.VarChar, Pan_number)
      .input("City", sql.VarChar, City)
      .input("State", sql.VarChar, State)
      .input("user_name", sql.VarChar, user_name);

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password=@password`;
      request.input("password", sql.VarChar, hashedPassword);
    }

    query += ` WHERE id=@id AND Sub_id=@Sub_id`;

    await request.query(query);

    res.json({ message: "User updated successfully " });

  } catch (err) {
    console.error("UPDATE ERROR 👉", err.message);
    res.status(500).json({ error: err.message });
  }
});


// Delete User
router.delete("/delete/:id",auth,async (req, res) => {
    const userId = req.params.id;

    const check = await sql.query`
      SELECT id FROM Users5
      WHERE id = ${userId} 
    `;

    if (!check.recordset.length) {
      return res.status(403).json({
        message: "You can delete only your users"
      });
    }

    await sql.query`
      DELETE FROM Users5 WHERE id = ${userId}
    `;

    res.json({ message: "User deleted" });
  }
);

// Product Add
router.post("/product/add", auth, async (req, res) => {
  try {
    console.log("TOKEN USER:", req.user);

    const { product_name, price, qty } = req.body;
    console.log("BODY:", product_name, price, qty);

    if (!product_name || !price || !qty) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user_id = req.user.user_id;
    const sub_id = req.user.sub_id;

    if (!user_id || !sub_id) {
      return res.status(400).json({ message: "Invalid token data" });
    }
    const pool = await poolPromise;

    await pool.request()
      .input("product_name", sql.VarChar(100), product_name)
      .input("price", sql.Int, Number(price))
      .input("qty", sql.Int, Number(qty))
      .input("user_id", sql.Int, user_id)
      .input("sub_id", sql.Int, sub_id)
      .query(`
        INSERT INTO Products (product_name, price, qty, user_id, sub_id)
        VALUES (@product_name, @price, @qty, @user_id, @sub_id)
      `);

    res.json({ message: "Product added successfully ✅" });

  } catch (err) {
  console.log("SQL FULL ERROR 👉", err);
  res.status(500).json({
    message: err.message,
    sqlError: err
  });
}
});


module.exports = router;

 