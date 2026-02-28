const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const auth = require("../middleware/auth");

// Create Driver
router.post("/create", auth, async (req, res) => {
    try {
        console.log("Datas:", req.body);

        const {
            drivername,
            drivernumber,
            vehiclenumber
        } = req.body;

        if (!drivername || !drivernumber || !vehiclenumber) {
            return res.status(400).json({ message: "All fields are Required" });
        }

        const data = await poolPromise;

        const result = await data.request()
            .input("drivername", sql.VarChar, drivername)
            .input("drivernumber", sql.VarChar, drivernumber)
            .input("vehiclenumber", sql.VarChar, vehiclenumber)
            .input("createdAt", sql.DateTime, new Date())  // <-- add current date
            .query(`
        INSERT INTO MastersDriver(drivername, drivernumber, vehiclenumber, createdAt)
        OUTPUT inserted.*
        VALUES(@drivername, @drivernumber, @vehiclenumber, @createdAt)
    `);

        res.status(201).json({
            Message: "Driver Info Add Successfully",
        });
    }
    catch (err) {
        console.error("Error:", err)
        res.status(500).json({ Error: err.message })
    }
});

// view Driver
router.get("/view", auth, async (req, res) => {
    try {
        const data = await poolPromise;

        const result = await data.request()
            .query(`Select * from MastersDriver`)

        res.json(result.recordset);
    }
    catch (err) {
        res.status(500).json({ Error: err.message });

    }
});

// routes/driver.js
router.put("/update/:id", auth,async (req, res) => {
    try {
        const { id } = req.params;

        console.log("CONTENT TYPE:", req.headers["content-type"]);
        console.log("BODY:", req.body);

        // safe body fallback
        const body = req.body || {};

        console.log("Body received:", body);

        const { drivername, drivernumber, vehiclenumber } = body;

        const setClauses = [];
        const data = await poolPromise;
        const request = data.request();

        // only add inputs for fields that exist
        if (drivername !== undefined) {
            setClauses.push("drivername = @drivername");
            request.input("drivername", sql.VarChar, drivername);
        }

        if (drivernumber !== undefined) {
            setClauses.push("drivernumber = @drivernumber");
            request.input("drivernumber", sql.VarChar, drivernumber);
        }

        if (vehiclenumber !== undefined) {
            setClauses.push("vehiclenumber = @vehiclenumber");
            request.input("vehiclenumber", sql.VarChar, vehiclenumber);
        }

        // if nothing to update, just return current data
        if (setClauses.length === 0) {
            return res.status(200).json({ message: "Nothing to update" });
        }

        request.input("id", sql.Int, id);

        const query = `
            UPDATE MastersDriver
            SET ${setClauses.join(", ")}
            WHERE id = @id
        `;

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.status(200).json({ message: "Driver info updated successfully" });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// Delete Driver
router.delete("/delete/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const data = await poolPromise;

        await data.request()
            .input("id", sql.Int, id)
            .query(`
                delete from MastersDriver where id=@id
            `);
        res.json({ message: "Driver Deleted Successfully" });

    }
    catch (err) {
        res.status(500).json({ Message: err.message })
    }

});


// router.get("/find/:vehiclenumber", auth, async (req, res) => {
//     try {

//         const vehiclenumber = req.params.vehiclenumber;

//         if (!vehiclenumber) {
//             return res.status(400).json({
//                 message: "Vehicle number required"
//             });
//         }

//         const driver = await MastersDriver.findOne({
//             where: {
//                 vehiclenumber: vehiclenumber
//             }
//         });

//         if (!driver) {
//             return res.status(404).json({
//                 message: "Driver not found"
//             });
//         }

//         return res.status(200).json(driver);

//     } catch (error) {
//         console.error("FIND DRIVER ERROR:", error);
//         return res.status(500).json({
//             message: error.message
//         });
//     }
// });

module.exports = router;

