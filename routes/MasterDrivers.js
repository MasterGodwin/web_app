const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const auth = require("../middleware/auth");
const { pool } = require("mssql");

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

router.put("/update/:id",auth,async(req,res)=>{
    try{
        const {id}=req.params;

        console.log("check Body:",req.body);
        
        const{
            drivername,
            drivernumber,
            licensenumber,
            licenseexpiry,
            address
        }=req.body

        const data=await poolPromise;

        const result=await data.request()
            .input("id",sql.Int,id)
            .input("drivername",sql.VarChar,drivername)
            .input("drivernumber",sql.VarChar,drivernumber)
            .input("licensenumber",sql.VarChar,licensenumber)
            .input("licenseexpiry",sql.VarChar,licenseexpiry)
            .input("address",sql.VarChar,address)
            .query(`
                Update MastersDriver
                    set drivername=@drivername,
                        drivernumber=@drivernumber,
                        licensenumber=@licensenumber,
                        licenseexpiry=@licenseexpiry,
                        address=@address
                        where id=@id
            `);
        if (result.rowsaffected[0]===0){
            return res.status(404).json({message:"Driver not found"})
        }
        res.json({Message:"Driver Info Updated Successfully"})
    }
    catch (err){
        console.error("Update:",err);
        res.status(500).json({Error:err.message})
    }
});

module.exports=router;
