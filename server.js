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
  server: 'localhost', // change to your local IP if testing on mobile
  database: 'SafeKaFernandino',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

// ---------- Create Connection Pool ----------
let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  console.log('✅ Connected to SQL Server');
  return pool;
}

// ---------------- 🧪 TEST ROUTE ----------------
app.get('/test', (req, res) => {
  res.send({ success: true, message: "API is running!" });
});

// ---------------- 🧍‍♀️ USER SIGNUP ----------------
app.post('/users/signup', async (req, res) => {
  const { name, email, password, type, gender, mobile, language, birthdate, address } = req.body;
  try {
    const pool = await getPool();

    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');

    if (existing.recordset.length > 0)
      return res.status(400).send({ success: false, message: 'Email already registered.' });

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

    res.send({ success: true, message: 'User registered successfully!' });
  } catch (err) {
    console.error('❌ Signup Error:', err);
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
    const pool = await getPool();

    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Rescuers WHERE Email = @email');

    if (existing.recordset.length > 0)
      return res.status(400).send({ success: false, message: 'Email already registered.' });

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

    res.send({ success: true, message: 'Rescuer registered successfully!' });
  } catch (err) {
    console.error('❌ Rescuer Signup Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 🔑 USER LOGIN ----------------
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');

    const user = result.recordset[0];
    if (!user) return res.status(400).send({ success: false, message: 'User not found.' });

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.status(400).send({ success: false, message: 'Incorrect password.' });

    res.send({ success: true, user });
  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});
// ---------------- 🔄 UPDATE USER ----------------
app.put('/users/update/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { Name, mobile, address, gender, language, birthdate } = req.body;

  if (!userId || !Name || !mobile || !address) {
    return res.status(400).send({ success: false, message: "Id, Name, Mobile, and Address are required." });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Id', sql.Int, userId)
      .input('Name', sql.NVarChar, Name)
      .input('Mobile', sql.NVarChar, mobile)
      .input('Address', sql.NVarChar, address)
      .input('Gender', sql.NVarChar, gender || null)
      .input('Language', sql.NVarChar, language || null)
      .input('Birthdate', sql.Date, birthdate || null)
      .query(`
        UPDATE Users
        SET Name = @Name,
            Mobile = @Mobile,
            Address = @Address,
            Gender = @Gender,
            Language = @Language,
            Birthdate = @Birthdate
        WHERE Id = @Id
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).send({ success: false, message: "User not found." });

    res.send({ success: true, message: "User updated successfully!" });
  } catch (err) {
    console.error('❌ Update User Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 🔑 RESCUER LOGIN ----------------
app.post('/rescuers/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Rescuers WHERE Email = @email');

    const rescuer = result.recordset[0];
    if (!rescuer) return res.status(400).send({ success: false, message: 'Rescuer not found.' });

    const match = await bcrypt.compare(password, rescuer.PasswordHash);
    if (!match) return res.status(400).send({ success: false, message: 'Incorrect password.' });

    res.send({ success: true, rescuer });
  } catch (err) {
    console.error('❌ Rescuer Login Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});
// ---------------- ⚡ UPDATE RESCUER PROFILE ----------------
app.put('/rescuers/update/:id', async (req, res) => {
  const rescuerId = parseInt(req.params.id);
  const { Name, Mobile, Type, StationLocation } = req.body;

  if (!rescuerId || !Name || !Mobile || !Type || !StationLocation) {
    return res.status(400).send({ success: false, message: 'All fields are required.' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Id', sql.Int, rescuerId)
      .input('Name', sql.VarChar, Name)
      .input('Mobile', sql.VarChar, Mobile)
      .input('Type', sql.VarChar, Type)
      .input('StationLocation', sql.VarChar, StationLocation)
      .query(`
        UPDATE Rescuers
        SET Name = @Name,
            Mobile = @Mobile,
            Type = @Type,
            StationLocation = @StationLocation
        WHERE Id = @Id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).send({ success: false, message: 'Rescuer not found.' });
    }

    res.send({ success: true, message: 'Rescuer profile updated successfully!' });
  } catch (err) {
    console.error('❌ Update Rescuer Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 📍 FETCH ALL STATIONS ----------------
app.get('/stations', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT Id, Name, Type, StationLocation, Latitude, Longitude, Contact
      FROM Rescuers
      ORDER BY Name
    `);

    res.send({ success: true, stations: result.recordset });
  } catch (err) {
    console.error('❌ Fetch Stations Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 🚨 CREATE INCIDENT ----------------
app.post('/incidents', async (req, res) => {
  const { Type, Location, Latitude, Longitude, Status } = req.body;

  try {
    const pool = await getPool();

    await pool.request()
      .input('Type', sql.VarChar, Type)
      .input('Location', sql.VarChar, Location)
      .input('Latitude', sql.Float, Latitude || null)
      .input('Longitude', sql.Float, Longitude || null)
      .input('Status', sql.VarChar, Status || 'Pending')
      .query(`
        INSERT INTO Incidents (Type, Location, Latitude, Longitude, Status, CreatedAt)
        VALUES (@Type, @Location, @Latitude, @Longitude, @Status, GETDATE())
      `);

    res.send({ success: true, message: 'Incident reported successfully!' });
  } catch (err) {
    console.error('❌ Create Incident Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 📄 FETCH INCIDENTS ----------------
app.get('/incidents', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Incidents ORDER BY CreatedAt DESC');
    res.send({ success: true, incidents: result.recordset });
  } catch (err) {
    console.error('❌ Fetch Incidents Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- ⚡ UPDATE INCIDENT STATUS ----------------
app.put('/incidents/:id/status', async (req, res) => {
  const incidentId = req.params.id;
  const { status } = req.body;

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, incidentId)
      .input('status', sql.VarChar, status)
      .query('UPDATE Incidents SET Status = @status WHERE Id = @id');

    if (result.rowsAffected[0] === 0)
      return res.status(404).send({ success: false, message: 'Incident not found.' });

    res.send({ success: true, message: 'Incident status updated!' });
  } catch (err) {
    console.error('❌ Update Incident Status Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});
// ---------------- 📞 EMERGENCY CONTACTS ----------------

// Create a new contact
app.post('/contacts', async (req, res) => {
  const { Name, Relationship, Phone, UserId } = req.body;
  if (!Name || !Phone || !UserId)
    return res.status(400).send({ success: false, message: "Name, Phone, and UserId are required." });

  try {
    const pool = await getPool();
    await pool.request()
      .input('Name', sql.NVarChar, Name)
      .input('Relationship', sql.NVarChar, Relationship || null)
      .input('Phone', sql.NVarChar, Phone)
      .input('UserId', sql.Int, UserId)
      .query(`
        INSERT INTO EmergencyContacts (Name, Relationship, Phone, UserId, CreatedAt)
        VALUES (@Name, @Relationship, @Phone, @UserId, GETDATE())
      `);

    res.send({ success: true, message: 'Contact saved successfully!' });
  } catch (err) {
    console.error('❌ Save Contact Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// Fetch all contacts for a user
app.get('/contacts/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!userId) return res.status(400).send({ success: false, message: 'Invalid UserId.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`SELECT * FROM EmergencyContacts WHERE UserId = @UserId ORDER BY CreatedAt DESC`);

    res.send({ success: true, contacts: result.recordset });
  } catch (err) {
    console.error('❌ Fetch Contacts Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// Update an existing contact
app.put('/contacts/:id', async (req, res) => {
  const contactId = parseInt(req.params.id);
  const { Name, Relationship, Phone, UserId } = req.body;
  if (!contactId || !Name || !Phone || !UserId)
    return res.status(400).send({ success: false, message: 'Id, Name, Phone, and UserId are required.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Id', sql.Int, contactId)
      .input('Name', sql.NVarChar, Name)
      .input('Relationship', sql.NVarChar, Relationship || null)
      .input('Phone', sql.NVarChar, Phone)
      .input('UserId', sql.Int, UserId)
      .query(`
        UPDATE EmergencyContacts
        SET Name = @Name,
            Relationship = @Relationship,
            Phone = @Phone
        WHERE Id = @Id AND UserId = @UserId
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).send({ success: false, message: 'Contact not found or not authorized.' });

    res.send({ success: true, message: 'Contact updated successfully!' });
  } catch (err) {
    console.error('❌ Update Contact Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// Delete a contact
app.delete('/contacts/:id', async (req, res) => {
  const contactId = parseInt(req.params.id);

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Id', sql.Int, contactId)
      .query('DELETE FROM EmergencyContacts WHERE Id = @Id');

    if (result.rowsAffected[0] === 0)
      return res.status(404).send({ success: false, message: 'Contact not found.' });

    res.send({ success: true, message: 'Contact deleted successfully.' });
  } catch (err) {
    console.error('❌ Delete Contact Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});


// ---------------- ⚙️ START SERVER ----------------
app.listen(3000, () => console.log('🚀 Server running on port 3000'));
