require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json()); // ✅ THIS IS REQUIRED
app.use(express.urlencoded({ extended: true })); // optional but safe

const cors = require("cors");
app.use(cors());

const create_role = require("./routes/CreateRole"); 
const create_admin = require("./routes/CreateAdmin");
const create_Sub = require("./routes/CreateSub")
const create_user = require("./routes/CreateUser")
const create_login = require("./routes/login");
 
app.use("/api/roles", create_role); 
app.use("/api/admin", create_admin);
app.use("/api/subscriber" , create_Sub);
app.use("/api/users",create_user);
app.use("/api/", create_login);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});