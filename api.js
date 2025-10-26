const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const config = {
  user: 'YOUR_DB_USER',
  password: 'YOUR_DB_PASSWORD',
  server: 'YOUR_SERVER_NAME',
  database: 'SafeKaFernandino',
  options: { encrypt: false }
};

// Connect to SQL Server
sql.connect(config).then(() => console.log("Connected to SQL Server")).catch(err => console.log(err));

/* ---------------- User Signup ---------------- */
app.post('/users/signup', async (req, res) => {
  const { name, email, password, type } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sql.query`
      INSERT INTO Users (Name, Email, PasswordHash, Type)
      VALUES (${name}, ${email}, ${hashedPassword}, ${type})
    `;
    res.send({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, error: err.message });
  }
});

/* ---------------- User Login ---------------- */
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await sql.query`SELECT * FROM Users WHERE Email = ${email}`;
    const user = result.recordset[0];
    if (!user) return res.status(400).send({ success: false, message: "User not found" });
    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.status(400).send({ success: false, message: "Wrong password" });
    res.send({ success: true, user });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, error: err.message });
  }
});

/* ---------------- Save Voice Command ---------------- */
app.post('/voice', async (req, res) => {
  const { userId, uri, emergencyType } = req.body;
  try {
    await sql.query`
      INSERT INTO VoiceCommands (UserId, Uri, EmergencyType)
      VALUES (${userId}, ${uri}, ${emergencyType})
    `;
    res.send({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, error: err.message });
  }
});

/* ---------------- Save Gesture ---------------- */
app.post('/gesture', async (req, res) => {
  const { userId, gesture, emergencyType } = req.body;
  try {
    await sql.query`
      INSERT INTO Gestures (UserId, Gesture, EmergencyType)
      VALUES (${userId}, ${gesture}, ${emergencyType})
    `;
    res.send({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, error: err.message });
  }
});

/* ---------------- Emergency Contacts ---------------- */
app.post('/emergency', async (req, res) => {
  const { userId, type, number } = req.body;
  try {
    await sql.query`
      INSERT INTO EmergencyContacts (UserId, Type, Number)
      VALUES (${userId}, ${type}, ${number})
    `;
    res.send({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
