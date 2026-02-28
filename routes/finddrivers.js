const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// FIND DRIVER BY VEHICLE NUMBER
router.get("/find/:vehiclenumber", async (req, res) => {
    try {

        const vehiclenumber = req.params.vehiclenumber;

        if (!vehiclenumber) {
            return res.status(400).json({
                message: "Vehicle number required"
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("vehiclenumber", sql.VarChar, vehiclenumber)
            .query(`
                SELECT drivername, drivernumber, vehiclenumber 
                FROM MastersDriver 
                WHERE vehiclenumber = @vehiclenumber
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Driver not found"
            });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error("FIND DRIVER ERROR:", error);
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;