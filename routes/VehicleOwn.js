const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const auth = require("../middleware/auth");

// Create Owner 
router.post("/vehicle-own",auth,async(req,res)=>{
    const {OwnName,
        V_Num,
        Mob_Num
    }=req.body
    
})