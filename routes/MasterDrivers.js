const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const auth = require("../middleware/auth");

// Create Driver
router.post("/create",auth,async (req, res) => {
    try{
        console.log("Datas:",req.body);

        const{
            drivername,
            drivernumber,
            licensenumber,
            licenseexpiry,
            address
        }=req.body;

        if (!drivername || !drivernumber || !licensenumber || !licenseexpiry || !address){
            return res.status(400).json({message:"All fields are Required"});
        }

        const data= await poolPromise;

        const result= await data.request()
        .input("drivername",sql.VarChar,drivername)
        .input("drivernumber",sql.VarChar,drivernumber)
        .input("licensenumber",sql.VarChar,licensenumber)
        .input("licenseexpiry",sql.VarChar,licenseexpiry)
        .input("address",sql.VarChar,address)
        .query(` 
            insert into MastersDriver(drivername,drivernumber,licensenumber,licenseexpiry,address)
            output inserted.*
            values(@drivername,@drivernumber,@licensenumber,@licenseexpiry,@address)
        `)

        res.status(201).json({
            Message:"Driver Info Add Successfully",
            });
    }
    catch (err){
        console.error("Error:",err)
        res.status(500).json({Error:err.message})
    }
});

// view Driver
router.get("/view",auth,async(req,res)=>{
    try{
        const data= await poolPromise;

        const result= await data.request()
            .query(`Select * from MastersDriver`)    
        
        res.json(result.recordset);     
    }
    catch(err){
        res.status(500).json({Error:err.message});
        
    }
});

router.put("/update/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        console.log("check Body:", req.body);

        // Safe body handling
        const body = req.body || {};

        const drivername = body.drivername || null;
        const drivernumber = body.drivernumber || null;
        const licensenumber = body.licensenumber || null;
        const licenseexpiry = body.licenseexpiry || null;
        const address = body.address || null;

        const data = await poolPromise;

        const result = await data.request()
            .input("id", sql.Int, id)
            .input("drivername", sql.VarChar, drivername)
            .input("drivernumber", sql.VarChar, drivernumber)
            .input("licensenumber", sql.VarChar, licensenumber)
            .input("licenseexpiry", sql.VarChar, licenseexpiry)
            .input("address", sql.VarChar, address)
            .query(`
                UPDATE MastersDriver
                SET drivername = @drivername,
                    drivernumber = @drivernumber,
                    licensenumber = @licensenumber,
                    licenseexpiry = @licenseexpiry,
                    address = @address
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.status(200).json({
            message: "Driver Info Updated Successfully"
        });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({
            message: "Server Error",
            error: err.message
        });
    }
});

router.delete("/delete/:id",auth,async(req,res)=>{
    try{
        const {id}=req.params;

        const data = await poolPromise;

        await data.request()
            .input ("id",sql.Int,id)
            .query(`
                delete from MastersDriver where id=@id
            `);
                res.json({message:"Driver Deleted Successfully"});

    }
    catch(err){
        res.status(500).json({Message:err.message})
    }
    
});


module.exports=router;
