// ----------------------- server.js -----------------------
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- SQL Server Config ----------
const config = {
  user: 'sa',
  password: '12345678',
  server: 'localhost', // or your local IP
  database: 'SafeKaFernandino',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  instanceName: 'SQLEXPRESS'
};

// ---------- Create Connection Pool ----------
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

poolConnect
  .then(() => console.log("✅ Connected to SQL Server"))
  .catch(err => console.error("❌ SQL Connection Error:", err));

// ---------------- 🧪 TEST ROUTE ----------------
app.get('/test', (req, res) => {
  res.send({ success: true, message: "API is running!" });
});

// ---------------- 🧍‍♀️ USER SIGNUP ----------------
app.post('/users/signup', async (req, res) => {
  const { name, email, password, type, gender, mobile, language, birthdate, address } = req.body;

  try {
    await poolConnect;

    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');

    if (existing.recordset.length > 0) {
      return res.status(400).send({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('type', sql.VarChar, type)
      .input('gender', sql.VarChar, gender)
      .input('mobile', sql.VarChar, mobile)
      .input('language', sql.VarChar, language)
      .input('birthdate', sql.Date, birthdate)
      .input('address', sql.VarChar, address)
      .query(`
        INSERT INTO Users (Name, Email, PasswordHash, Type, Gender, Mobile, Language, Birthdate, Address)
        VALUES (@name, @email, @password, @type, @gender, @mobile, @language, @birthdate, @address)
      `);

    res.send({ success: true, message: "User registered successfully!" });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 🧍‍♂️ RESCUER SIGNUP ----------------
app.post('/rescuers/signup', async (req, res) => {
  const {
    name, email, password, type, gender, mobile, language, birthdate,
    address, stationLocation, latitude, longitude, contact
  } = req.body;

  try {
    await poolConnect;

    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Rescuers WHERE Email = @email');

    if (existing.recordset.length > 0) {
      return res.status(400).send({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('type', sql.VarChar, type)
      .input('gender', sql.VarChar, gender)
      .input('mobile', sql.VarChar, mobile)
      .input('language', sql.VarChar, language)
      .input('birthdate', sql.Date, birthdate)
      .input('address', sql.VarChar, address)
      .input('stationLocation', sql.VarChar, stationLocation)
      .input('latitude', sql.Float, latitude)
      .input('longitude', sql.Float, longitude)
      .input('contact', sql.VarChar, contact)
      .query(`
        INSERT INTO Rescuers
        (Name, Email, PasswordHash, Type, Gender, Mobile, Language, Birthdate, Address, StationLocation, Latitude, Longitude, Contact, CreatedAt)
        VALUES
        (@name, @email, @password, @type, @gender, @mobile, @language, @birthdate, @address, @stationLocation, @latitude, @longitude, @contact, GETDATE())
      `);

    res.send({ success: true, message: "Rescuer registered successfully!" });
  } catch (err) {
    console.error("❌ Rescuer Signup Error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 📍 FETCH ALL STATIONS ----------------
app.get('/stations', async (req, res) => {
  try {
    await poolConnect;

    // Fetch all rescuers/stations
    const result = await pool.request()
      .query(`
        SELECT 
          Id, Name, Type, StationLocation, Latitude, Longitude, Contact
        FROM Rescuers
        ORDER BY Name
      `);

    res.send({ success: true, stations: result.recordset });
  } catch (err) {
    console.error("❌ Fetch Stations Error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});



// ---------------- 📄 FETCH INCIDENTS ----------------
app.get('/incidents', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT * FROM Incidents ORDER BY CreatedAt DESC');
    res.send({ success: true, incidents: result.recordset });
  } catch (err) {
    console.error("❌ Fetch Incidents Error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- ⚡ UPDATE INCIDENT STATUS ----------------
app.put('/incidents/:id/status', async (req, res) => {
  const incidentId = req.params.id;
  const { status } = req.body;

  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, incidentId)
      .input('status', sql.VarChar, status)
      .query('UPDATE Incidents SET Status = @status WHERE Id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).send({ success: false, message: 'Incident not found.' });
    }

    res.send({ success: true, message: 'Incident status updated!' });
  } catch (err) {
    console.error('❌ Update Incident Status Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 🔑 USER LOGIN ----------------
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    await poolConnect;

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');

    const user = result.recordset[0];
    if (!user) return res.status(400).send({ success: false, message: "User not found." });

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.status(400).send({ success: false, message: "Incorrect password." });

    res.send({ success: true, user });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 🔑 RESCUER LOGIN ----------------
app.post('/rescuers/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    await poolConnect;

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Rescuers WHERE Email = @email');

    const rescuer = result.recordset[0];
    if (!rescuer) return res.status(400).send({ success: false, message: "Rescuer not found." });

    const match = await bcrypt.compare(password, rescuer.PasswordHash);
    if (!match) return res.status(400).send({ success: false, message: "Incorrect password." });

    res.send({ success: true, rescuer });
  } catch (err) {
    console.error("❌ Rescuer Login Error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- ⚙️ START SERVER ----------------
app.listen(3000, () => console.log('🚀 Server running on port 3000'));
