const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const auth = require("../middleware/auth");


// Add Vehicle
router.post("/create", auth,async (req, res) => {
  try {

    console.log("Incoming Data:", req.body);

    const { driverName, driverNumber, vehicleNumber, vehicleId } = req.body;

    if (!driverName || !driverNumber || !vehicleNumber || !vehicleId) {
      return res.status(400).json({ message: "All fields required" });
    }

    const db = await poolPromise;

    const result = await db.request()
      .input("DriverName", sql.VarChar, driverName)
      .input("DriverNumber", sql.VarChar, driverNumber)
      .input("VehicleNumber", sql.VarChar, vehicleNumber)
      .input("VehicleId", sql.VarChar, vehicleId)
      .query(`
        INSERT INTO Parking2 (DriverName, DriverNumber, VehicleNumber, VehicleId)
        OUTPUT INSERTED.*
        VALUES (@DriverName, @DriverNumber, @VehicleNumber, @VehicleId)
      `);
      
    res.status(200).json(result.recordset[0]);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get All Vehicles
router.get("/view", async (req, res) => {
  try {
    const db = await poolPromise;
    const result = await db.request().query("SELECT * FROM Parking2 ORDER BY Id DESC");

    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
