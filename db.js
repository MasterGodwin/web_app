const sql = require('mssql');
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME, 
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
const pool = new sql.ConnectionPool(config);

const poolPromise = sql.connect(config)
  .then(pool => {
    console.log("SUCCESS");
    return pool;
  }).catch(err => {
    console.log("Fail", err);
  })

module.exports = {sql, poolPromise}