const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const auth = require("../middleware/auth");


// Create Vehicle
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

//Update Vehicle
router.put("/update/:id", auth, async (req, res) => {
  try {

    const { id } = req.params;
    const { driverName, driverNumber, vehicleNumber, vehicleId } = req.body;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Id", sql.Int, id)
      .input("DriverName", sql.VarChar, driverName)
      .input("DriverNumber", sql.VarChar, driverNumber)
      .input("VehicleNumber", sql.VarChar, vehicleNumber)
      .input("VehicleId", sql.VarChar, vehicleId)
      .query(`
        UPDATE Parking2
        SET DriverName=@DriverName,
            DriverNumber=@DriverNumber,
            VehicleNumber=@VehicleNumber,
            VehicleId=@VehicleId
        WHERE Id=@Id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle Updated Successfully" });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete Vehicle
router.delete("/delete/:id",auth, async (req, res) => {
  try {

    const { id } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        DELETE FROM Parking2
        WHERE Id=@Id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle Deleted Successfully" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});



module.exports = router;
