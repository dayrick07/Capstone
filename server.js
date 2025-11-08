// ----------------------- server.js -----------------------
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const path = require('path');



const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- SQL Server Config ----------
const config = {
  user: 'app_user',
  password: '123',
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

    if (!name || !email || !password || !type || !gender || !language || !birthdate || !address) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const pool = await sql.connect(config);
        await pool.request()
            .input('Name', sql.NVarChar, name)
            .input('Email', sql.NVarChar, email)
            .input('PasswordHash', sql.NVarChar, hashedPassword)
            .input('Type', sql.NVarChar, type)
            .input('Gender', sql.NVarChar, gender)
            .input('Mobile', sql.NVarChar, mobile)
            .input('Language', sql.NVarChar, language)
            .input('Birthdate', sql.Date, birthdate)
            .input('Address', sql.NVarChar, address)
            .query(`
                INSERT INTO Users (Name, Email, PasswordHash, Type, Gender, Mobile, Language, Birthdate, Address)
                VALUES (@Name, @Email, @PasswordHash, @Type, @Gender, @Mobile, @Language, @Birthdate, @Address)
            `);

        res.json({ success: true, message: 'User registered successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
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
// ---------------- 🧍‍♂️ Admins SIGNUP ----------------
app.post('/admins/signup', async (req, res) => {
    const { name, email, password, gender, mobile, language, birthdate, address } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const pool = await getPool();

        await pool.request()
            .input('Name', sql.NVarChar, name)
            .input('Email', sql.NVarChar, email)
            .input('PasswordHash', sql.NVarChar, hashedPassword)
            .input('Gender', sql.NVarChar, gender)
            .input('Mobile', sql.NVarChar, mobile)
            .input('Language', sql.NVarChar, language)
            .input('Birthdate', sql.Date, birthdate)
            .input('Address', sql.NVarChar, address)
            .query(`
                INSERT INTO Admins 
                (Name, Email, PasswordHash, Gender, Mobile, Language, Birthdate, Address)
                VALUES 
                (@Name, @Email, @PasswordHash, @Gender, @Mobile, @Language, @Birthdate, @Address)
            `);

        res.json({ success: true, message: 'Admin registered successfully!' });
    } catch (err) {
        console.error(err);
        if(err.number === 2627){ // duplicate email
            res.status(400).json({ success: false, message: 'Email already exists!' });
        } else {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
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
// ---------------- 🟢 UPDATE RESCUER ACTIVE STATUS ----------------
app.put('/rescuers/:id/status', async (req, res) => {
    const rescuerId = parseInt(req.params.id);
    const { isActive } = req.body; // Expects true (active) or false (offline)

    if (isNaN(rescuerId) || typeof isActive !== 'boolean') {
        return res.status(400).send({ success: false, message: 'Invalid Rescuer ID or status value (must be boolean).' });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Id', sql.Int, rescuerId)
            .input('IsActive', sql.Bit, isActive) // SQL Bit type maps to boolean
            .query(`
                UPDATE Rescuers
                SET IsActive = @IsActive
                WHERE Id = @Id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send({ success: false, message: 'Rescuer not found.' });
        }

        res.send({ success: true, message: `Rescuer status updated to ${isActive ? 'Active' : 'Offline'}!` });
    } catch (err) {
        console.error('❌ Update Rescuer Status Error:', err);
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
// ---------------- ⚡ Admin Login ----------------
app.post('/admins/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Admins WHERE Email = @Email AND IsActive = 1');

        const admin = result.recordset[0];
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found or inactive.' });

        const validPassword = await bcrypt.compare(password, admin.PasswordHash);
        if (!validPassword) return res.status(401).json({ success: false, message: 'Incorrect password.' });

        res.json({ success: true, message: 'Login successful!', admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});
// ---------------- fetch ADMIN PROFILE ----------------
app.get('/admins/:id', async (req, res) => {
    const adminId = parseInt(req.params.id);
    if (isNaN(adminId)) return res.status(400).json({ success: false, message: "Invalid admin ID" });

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Id', sql.Int, adminId)
            .query('SELECT Id, Name, Email, Gender, Mobile, Language, Birthdate, Address FROM Admins WHERE Id = @Id AND IsActive = 1');

        const admin = result.recordset[0];
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found or inactive" });

        res.json({ success: true, admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
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
  const { Type, Location, Latitude, Longitude, Status, UserId } = req.body;

  if (!UserId) {
    return res.status(400).send({ success: false, message: "UserId is required" });
  }

  try {
    const pool = await getPool();

    await pool.request()
      .input('Type', sql.VarChar, Type)
      .input('Location', sql.VarChar, Location)
      .input('Latitude', sql.Float, Latitude || null)
      .input('Longitude', sql.Float, Longitude || null)
      .input('Status', sql.VarChar, Status || 'Pending')
      .input('UserId', sql.Int, UserId)
      .query(`
        INSERT INTO Incidents (Type, Location, Latitude, Longitude, Status, UserId, CreatedAt)
        VALUES (@Type, @Location, @Latitude, @Longitude, @Status, @UserId, GETDATE())
      `);

    res.send({ success: true, message: "Incident reported successfully!" });
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
// ---------------- ⚡ UPDATE INCIDENT STATUS (FIXED) ----------------
app.put('/incidents/:id/status', async (req, res) => {
  const incidentId = parseInt(req.params.id);
  const { status, rescuerId: rawRescuerId } = req.body; 

  // FIX: Ensure the ID is a clean integer
  const cleanRescuerId = parseInt(rawRescuerId); 
  
  if (isNaN(cleanRescuerId) || cleanRescuerId < 1) {
      console.error(`Server received invalid rescuerId for incident ${incidentId}: ${rawRescuerId}`);
      return res.status(400).json({ success: false, message: "rescuerId is required and must be a valid number (e.g., > 0)." });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, incidentId)
      .input('status', sql.VarChar, status)
      .input('rescuerId', sql.Int, cleanRescuerId) // Use the cleaned integer ID
      .query(`
        UPDATE Incidents
        SET Status = @status,
            RescuerId = @rescuerId
        WHERE Id = @id
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ success: false, message: "Incident not found." });

    res.json({ success: true, message: "Incident updated successfully!" });
  } catch (err) {
    console.error('❌ Update Incident Status SQL Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ---------------- 📄 FETCH RESCUER HISTORY (New Feature) ----------------
app.get('/rescuers/:id/history', async (req, res) => {
  const rescuerId = parseInt(req.params.id);

  if (isNaN(rescuerId) || rescuerId < 1) {
    return res.status(400).send({ success: false, message: 'Invalid Rescuer ID.' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('rescuerId', sql.Int, rescuerId)
      .query(`
        SELECT *         FROM Incidents 
        WHERE RescuerId = @rescuerId AND Status = 'Done'
        ORDER BY UpdatedAt DESC
      `);

    res.send({ success: true, incidents: result.recordset });
  } catch (err) {
    console.error('❌ Fetch Rescuer History Error:', err);
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
// ---------------- 👧 UPDATE CHILD RECORD ----------------
app.put('/children/:id', async (req, res) => {
    const childId = parseInt(req.params.id);
    const { 
        Name, 
        Age, 
        School, 
        Allergies, 
        SpecialNeeds, 
        UserId // The Parent's ID is required for security/verification
    } = req.body;

    if (!childId || !Name || !UserId) {
        return res.status(400).send({ success: false, message: 'Child ID, Name, and Parent UserId are required for update.' });
    }

    // Convert Age to a number, ensuring it's null if not provided or invalid
    const finalAge = Age ? parseInt(Age) : null;
    if (Age && (isNaN(finalAge) || finalAge <= 0)) {
        return res.status(400).send({ success: false, message: "Invalid Age provided." });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Id', sql.Int, childId)
            .input('Name', sql.NVarChar, Name)
            .input('Age', sql.Int, finalAge)
            .input('School', sql.NVarChar, School || null)
            .input('Allergies', sql.NVarChar, Allergies || null)
            .input('SpecialNeeds', sql.NVarChar, SpecialNeeds || null)
            .input('UserId', sql.Int, UserId)
            .query(`
                UPDATE Children
                SET Name = @Name,
                    Age = @Age,
                    School = @School,
                    Allergies = @Allergies,
                    SpecialNeeds = @SpecialNeeds,
                    UpdatedAt = GETDATE()
                WHERE Id = @Id AND UserId = @UserId 
                -- Use UserId in WHERE clause to ensure only the owner can update the record
            `);

        if (result.rowsAffected[0] === 0) {
            // This happens if the ID is wrong, or the UserId doesn't match the record
            return res.status(404).send({ success: false, message: 'Child record not found or unauthorized to update.' });
        }

        res.send({ success: true, message: 'Child details updated successfully!' });
    } catch (err) {
        console.error('❌ Update Child Record Error:', err);
        res.status(500).send({ success: false, error: err.message });
    }
});
// ---------------- 👧 FETCH CHILDREN BY USER ID ----------------
app.get('/children/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId) || userId < 1) {
        return res.status(400).send({ success: false, message: 'Invalid User ID.' });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT Id, Name, Age, School, Allergies, SpecialNeeds, CreatedAt 
                FROM Children 
                WHERE UserId = @UserId 
                ORDER BY Name
            `);

        // Check for the existence of the Children table and the UserId column in your database.
        res.send({ success: true, children: result.recordset });
    } catch (err) {
        console.error('❌ Fetch Children Error:', err);
        // If you see a SQL error here, it likely means the Children table doesn't exist.
        res.status(500).send({ success: false, error: err.message });
    }
});
// ---------------- ACTIVE RESCUERS ----------------
app.get('/rescuer/active', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Rescuers WHERE IsActive = 1');

    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error fetching active rescuers:', error);
    res.status(500).json({ message: 'Error fetching active rescuers' });
  }
});

// ---------- GET All Incidents ----------
app.get('/incidents', async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM Incidents`;
    res.send({
      success: true,
      incidents: result.recordset
    });
  } catch (err) {
    console.error('Error fetching incidents:', err);
    res.status(500).send({ success: false, message: 'Database error' });
  }
});
// ---------------- 🟢 ROUTES FOR WEB PAGES ----------------
app.use(express.static(path.join(__dirname, 'public')));
// Admin login/signup page
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login-signup.html'));
});

// Dashboard page
app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});
// Optional: redirect root to admin login
app.get('/', (req, res) => {
  res.redirect('/admin-login');
});

// ---------------- ⚙️ START SERVER ----------------
app.listen(3000, () => console.log('🚀 Server running on port 3000'));