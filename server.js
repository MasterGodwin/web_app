require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

const create_role = require("./routes/create_role"); 
const create_admin = require("./routes/create_admin");
const create_Sub = require("./routes/create_sub")
const create_login = require("./routes/login");
 
app.use("/api/roles", create_role); 
app.use("/api/admin", create_admin);
app.use("/api/" , create_Sub);
app.use("/api/", create_login);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});