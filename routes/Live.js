const express = require("express");
const router = express.Router();
const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true },
};

let pool;
const getPool = async () => {
  if (!pool) pool = await sql.connect(dbConfig);
  return pool;
};

// =============================================
// TABLE CREATE - column names correct-a irukku
// =============================================
const createTableIfNotExists = async () => {
  const db = await getPool();
  await db.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='live_tracking' AND xtype='U')
    CREATE TABLE live_tracking (
      id             INT IDENTITY(1,1) PRIMARY KEY,
      friend_id      NVARCHAR(100) NOT NULL,
      driver_name    NVARCHAR(100) NOT NULL,
      vehicle_number NVARCHAR(50)  NOT NULL,
      latitude       FLOAT DEFAULT 0,
      longitude      FLOAT DEFAULT 0,
      speed          FLOAT DEFAULT 0,
      park_status    NVARCHAR(20)  DEFAULT 'moving',
      is_active      BIT           DEFAULT 1,
      started_at     DATETIME      DEFAULT GETDATE(),
      last_updated   DATETIME      DEFAULT GETDATE()
    )
  `);
  console.log("✅ live_tracking table ready");
};

createTableIfNotExists().catch(console.error);

// =============================================
// POST /api/location
// =============================================
router.post("/location", async (req, res) => {
  const { friendId, name, vehicleNo, lat, lng, speed, parkStatus } = req.body;

  if (!friendId || !name || !vehicleNo) {
    return res.status(400).json({ success: false, message: "friendId, name, vehicleNo required" });
  }

  try {
    const db = await getPool();

    const existing = await db
      .request()
      .input("friend_id", sql.NVarChar, friendId)
      .query("SELECT id FROM live_tracking WHERE friend_id = @friend_id AND is_active = 1");

    let driverData;

    if (existing.recordset.length > 0) {
      // UPDATE
      const result = await db
        .request()
        .input("friend_id",   sql.NVarChar, friendId)
        .input("latitude",    sql.Float,    lat || 0)
        .input("longitude",   sql.Float,    lng || 0)
        .input("speed",       sql.Float,    speed || 0)
        .input("park_status", sql.NVarChar, parkStatus || "moving")
        .query(`
          UPDATE live_tracking
          SET latitude     = @latitude,
              longitude    = @longitude,
              speed        = @speed,
              park_status  = @park_status,
              last_updated = GETDATE()
          OUTPUT INSERTED.*
          WHERE friend_id = @friend_id AND is_active = 1
        `);
      driverData = result.recordset[0];
    } else {
      // INSERT
      const result = await db
        .request()
        .input("friend_id",      sql.NVarChar, friendId)
        .input("driver_name",    sql.NVarChar, name)
        .input("vehicle_number", sql.NVarChar, vehicleNo)
        .input("latitude",       sql.Float,    lat || 0)
        .input("longitude",      sql.Float,    lng || 0)
        .input("speed",          sql.Float,    speed || 0)
        .input("park_status",    sql.NVarChar, parkStatus || "moving")
        .query(`
          INSERT INTO live_tracking
            (friend_id, driver_name, vehicle_number, latitude, longitude, speed, park_status, is_active, started_at, last_updated)
          OUTPUT INSERTED.*
          VALUES
            (@friend_id, @driver_name, @vehicle_number, @latitude, @longitude, @speed, @park_status, 1, GETDATE(), GETDATE())
        `);
      driverData = result.recordset[0];

      const io = req.app.get("io");
      if (io) io.emit("new_driver_started", formatDriver(driverData));
    }

    const io = req.app.get("io");
    if (io) io.emit("location_updated", formatDriver(driverData));

    res.json({ success: true, data: formatDriver(driverData) });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// POST /api/location/stop
// =============================================
router.post("/location/stop", async (req, res) => {
  const { friendId } = req.body;
  if (!friendId) return res.status(400).json({ success: false, message: "friendId required" });

  try {
    const db = await getPool();
    const result = await db
      .request()
      .input("friend_id", sql.NVarChar, friendId)
      .query(`
        UPDATE live_tracking
        SET is_active    = 0,
            park_status  = 'parked',
            last_updated = GETDATE()
        OUTPUT INSERTED.*
        WHERE friend_id = @friend_id AND is_active = 1
      `);

    if (result.recordset.length > 0) {
      const io = req.app.get("io");
      if (io) io.emit("driver_stopped", formatDriver(result.recordset[0]));
    }

    res.json({ success: true, message: "Tracking stopped" });
  } catch (err) {
    console.error("Stop error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// GET /api/location/active
// =============================================
router.get("/location/active", async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT * FROM live_tracking
      WHERE is_active = 1
      ORDER BY last_updated DESC
    `);
    res.json({ success: true, data: result.recordset.map(formatDriver) });
  } catch (err) {
    console.error("Get active error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// GET /api/location/all
// =============================================
router.get("/location/all", async (req, res) => {
  try {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT * FROM live_tracking ORDER BY last_updated DESC
    `);
    res.json({ success: true, data: result.recordset.map(formatDriver) });
  } catch (err) {
    console.error("Get all error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// HELPER - DB column names -> frontend format
// last_updated (DB) → updated_at (frontend)
// =============================================
function formatDriver(row) {
  return {
    id:             row.id,
    friend_id:      row.friend_id,
    driver_name:    row.driver_name,
    vehicle_number: row.vehicle_number,
    latitude:       row.latitude,
    longitude:      row.longitude,
    speed:          row.speed || 0,
    status:         row.park_status || "moving",
    is_active:      row.is_active,
    started_at:     row.started_at,
    updated_at:     row.last_updated,   // ✅ DB: last_updated → frontend: updated_at
  };
}

module.exports = router;

// =============================================
// GET /api/park-events
// HistoryScreen call pannum
// Query: ?date=2025-01-28&vehicleNo=TN00AB1234 (optional)
// =============================================
router.get("/park-events", async (req, res) => {
  const { date, vehicleNo } = req.query;

  try {
    const db = await getPool();
    const request = db.request();

    let query = `
      SELECT 
        id,
        friend_id,
        driver_name,
        vehicle_number,
        
        latitude        AS lat,
        longitude       AS lng,
        speed,
        park_status,
        started_at      AS parkedAt,
        started_at      AS parked_at,
        last_updated
      FROM live_tracking
      WHERE 1=1
    `;

    // Date filter
    if (date) {
      request.input("date", sql.NVarChar, date);
      query += ` AND CAST(started_at AS DATE) = @date`;
    }

    // Vehicle filter (optional)
    if (vehicleNo) {
      request.input("vehicleNo", sql.NVarChar, `%${vehicleNo}%`);
      query += ` AND vehicle_number LIKE @vehicleNo`;
    }

    query += ` ORDER BY last_updated DESC`;

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error("park-events error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// GET /api/history
// HistoryScreen location history
// =============================================
router.get("/history", async (req, res) => {
  const { date, vehicleNo } = req.query;

  try {
    const db = await getPool();
    const request = db.request();

    let query = `
      SELECT * FROM live_tracking WHERE 1=1
    `;

    if (date) {
      request.input("date", sql.NVarChar, date);
      query += ` AND CAST(started_at AS DATE) = @date`;
    }

    if (vehicleNo) {
      request.input("vehicleNo", sql.NVarChar, `%${vehicleNo}%`);
      query += ` AND vehicle_number LIKE @vehicleNo`;
    }

    query += ` ORDER BY last_updated DESC`;

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error("history error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});