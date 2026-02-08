require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

const create_role = require("./routes/create_role"); 
 
app.use("/api/roles", create_role); 

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});