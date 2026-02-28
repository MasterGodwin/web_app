// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// const server = http.createServer(app);

// // SOCKET.IO SETUP
// // ============================================================
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Production la unna frontend URL podu
//     methods: ["GET", "POST"],
//   },
// });

// // io object-a routes la use panna app-la set panrom
// app.set("io", io);


// const create_role = require("./routes/CreateRole"); 
// const create_admin = require("./routes/CreateAdmin");
// const create_Sub = require("./routes/CreateSub")
// const create_user = require("./routes/CreateUser")
// const Parking = require("./routes/Parking");
// const Driver = require("./routes/MasterDrivers");
// const finddrivers = require("./routes/finddrivers");
// const create_login = require("./routes/login");

// const liveRoute = require("./routes/Live");
// app.use("/api/live", liveRoute);

// app.use("/api/uploads", express.static("uploads")); // Serve uploaded files
// app.use("/api/roles", create_role); 
// app.use("/api/admin", create_admin);
// app.use("/api/subscriber" , create_Sub);
// app.use("/api/users",create_user);
// app.use("/api/parking", Parking);
// app.use("/api/driver",Driver);
// app.use("/api/finddrivers", finddrivers);
// app.use("/api", create_login);

// const path = require("path");

// // SOCKET.IO CONNECTION HANDLER
// // ============================================================
// io.on("connection", (socket) => {
//   console.log(`✅ Client connected: ${socket.id}`);

//   socket.on("disconnect", () => {
//     console.log(`❌ Client disconnected: ${socket.id}`);
//   });
// });

// app.use("/uploads",express.static(path.join(__dirname, "uploads")));


// const PORT = process.env.PORT;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`); 
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ✅ HTTP SERVER - Socket.IO ku ithuthan use aagum
// ============================================================
const server = http.createServer(app);

// ============================================================
// ✅ SOCKET.IO - server-la attach panrom (NOT app)
// ============================================================
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`❌ Client disconnected: ${socket.id}`));
});

// ============================================================
// ROUTES
// ============================================================
const liveRoute    = require("./routes/Live");
const create_role  = require("./routes/CreateRole");
const create_admin = require("./routes/CreateAdmin");
const create_Sub   = require("./routes/CreateSub");
const create_user  = require("./routes/CreateUser");
const Parking      = require("./routes/Parking");
const Driver       = require("./routes/MasterDrivers");
const finddrivers  = require("./routes/finddrivers");
const create_login = require("./routes/login");

// ✅ Live route - /api/location POST/GET ellam ithu handle pannum
app.use("/api", liveRoute);

app.use("/api/uploads",     express.static("uploads"));
app.use("/api/roles",       create_role);
app.use("/api/admin",       create_admin);
app.use("/api/subscriber",  create_Sub);
app.use("/api/users",       create_user);
app.use("/api/parking",     Parking);
app.use("/api/driver",      Driver);
app.use("/api/finddrivers", finddrivers);
app.use("/api",             create_login);
app.use("/uploads",         express.static(path.join(__dirname, "uploads")));

// ============================================================
// ✅ server.listen - NOT app.listen
//    app.listen = Socket.IO work AAGAATHU
//    server.listen = Socket.IO work AAGUM
// ============================================================
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});