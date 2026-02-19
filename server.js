require("dotenv").config();
const express = require("express");
const create_role = require("./routes/CreateRole"); 
const create_admin = require("./routes/CreateAdmin");
const create_Sub = require("./routes/CreateSub")
const create_user = require("./routes/CreateUser")
const Parking = require("./routes/Parking");
const Driver = require("./routes/MasterDrivers");
const create_login = require("./routes/login");

const app = express();
app.use(express.json()); 

const cors = require("cors");
app.use(cors());

app.use("/api/uploads", express.static("uploads")); // Serve uploaded files
app.use("/api/roles", create_role); 
app.use("/api/admin", create_admin);
app.use("/api/subscriber" , create_Sub);
app.use("/api/users",create_user);
app.use("/api/parking", Parking);
app.use("/api/driver",Driver)
app.use("/api", create_login);

const path = require("path");

app.use("/uploads",express.static(path.join(__dirname, "uploads")));


const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});