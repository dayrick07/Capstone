const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const path = require('path');
const { generateOTP } = require('./generate_otp'); 
const axios = require('axios');
const app = express();
const fs = require('fs');
const multer = require('multer');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// ---------- SQL Server Config ----------
const config = {
  user: 'app_user',
  password: '123',
  server: '192.168.0.111', // change to your local IP if testing on mobile
  database: 'SafeKaFernandino',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};
// ---------- GENERAL USER ID STORAGE ----------
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = `C:/Users/CapstoneProject/uploads/ids/users`;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let name = req.body.name || 'user';
    name = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${name}-${timestamp}${ext}`);
  }
});

// ---------- RESCUER ID STORAGE ----------
const rescuerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = `C:/Users/CapstoneProject/uploads/ids/rescuers`;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let name = req.body.name || 'rescuer';
    name = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${name}-${timestamp}${ext}`);
  }
});
const uploadUserId = multer({ storage: userStorage });
const uploadRescuerId = multer({ storage: rescuerStorage });
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

// ----------------- Serve uploads folder as static ----------------
app.use('/uploads/users', express.static('C:/Users/CapstoneProject/uploads/ids/users'));
app.use('/uploads/rescuers', express.static('C:/Users/CapstoneProject/uploads/ids/rescuers'));

// ---------------- USER SIGNUP ----------------
app.post('/users/signup', uploadUserId.single('validId'), async (req, res) => {
  try {
    const { name, email, password, type, gender, mobile, language, birthdate, address } = req.body || {};

    if (!name || !email || !password || !req.file) {
      return res.status(400).send({ success: false, error: 'Fill all fields and upload valid ID' });
    }

    const validIdPath = req.file.path; // store uploaded file path
    const hashedPassword = await bcrypt.hash(password, 10);

    const pool = await getPool();
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
      .input('validIdPath', sql.VarChar, validIdPath)
      .input('isIdVerified', sql.Bit, 0) // default not verified
      .query(`
        INSERT INTO Users
        (Name, Email, PasswordHash, Type, Gender, Mobile, Language, Birthdate, Address, ValidIdPath, IsIdVerified, CreatedAt)
        VALUES
        (@name,@email,@password,@type,@gender,@mobile,@language,@birthdate,@address,@validIdPath,@isIdVerified,GETDATE())
      `);

    res.send({ success: true, message: 'User registered! ID pending verification.' });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});
// ---------------- ADMIN PENDING USERS ----------------
app.get('/admin/pending-users', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT Id, Name, Email, Mobile, ValidIdPath AS validId FROM Users WHERE IsIdVerified = 0`);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching pending users:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- ADMIN APPROVE ----------------
app.post('/admin/approve/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE Users SET IsIdVerified = 1 WHERE Id = @id`);
    res.send({ success: true });
  } catch (err) {
    console.error("Error approving user:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- ADMIN REJECT ----------------
app.post('/admin/reject/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE Users SET IsIdVerified = -1 WHERE Id = @id`);
    res.send({ success: true });
  } catch (err) {
    console.error("Error rejecting user:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 🧒 CHILD SIGNUP ----------------
app.post('/children/signup', async (req, res) => {
  const { parentId, name, email, password, gender, birthdate } = req.body;

  if (!parentId || !name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await getPool();

    await pool.request()
      .input('ParentId', sql.Int, parentId)
      .input('Name', sql.NVarChar, name)
      .input('Email', sql.NVarChar, email)
      .input('PasswordHash', sql.NVarChar, hashedPassword)
      .input('Gender', sql.NVarChar, gender || null)
      .input('Birthdate', sql.Date, birthdate || null)
      .query(`
        INSERT INTO Children (ParentId, Name, Email, PasswordHash, Gender, Birthdate, CreatedAt)
        VALUES (@ParentId, @Name, @Email, @PasswordHash, @Gender, @Birthdate, GETDATE())
      `);

    res.json({ success: true, message: 'Child account created successfully.' });
  } catch (err) {
    console.error('❌ Child Signup Error:', err);
    res.status(500).json({ success: false, message: 'Server error during child signup.' });
  }
});


// ---------------- RESCUER SIGNUP ----------------
app.post('/rescuers/signup', uploadRescuerId.single('validIdPath'), async (req, res) => {
  try {
    const { name, email, password, type, gender, mobile, language, birthdate, address, stationLocation, latitude, longitude, contact } = req.body;

    if (!name || !email || !password || !req.file) {
      return res.status(400).send({ success: false, message: 'Fill all fields and upload valid ID' });
    }

    const validIdPath = req.file.path; // multer stores the path
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await getPool();

    // Check for duplicate email
    const existing = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Rescuers WHERE Email = @email');
    if (existing.recordset.length > 0)
      return res.status(400).send({ success: false, message: 'Email already registered.' });

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
      .input('validIdPath', sql.VarChar, validIdPath)
      .input('isIdVerified', sql.Bit, 0)
      .query(`
        INSERT INTO Rescuers
        (Name, Email, PasswordHash, Type, Gender, Mobile, Language, Birthdate, Address, StationLocation, Latitude, Longitude, Contact, ValidIdPath, IsIdVerified, CreatedAt)
        VALUES
        (@name,@email,@password,@type,@gender,@mobile,@language,@birthdate,@address,@stationLocation,@latitude,@longitude,@contact,@validIdPath,@isIdVerified,GETDATE())
      `);

    res.send({ success: true, message: 'Rescuer registered! ID pending verification.' });

  } catch (err) {
    console.error('Rescuer Signup Error:', err);
    res.status(500).send({ success: false, message: err.message });
  }
});

// Get pending rescuers
app.get('/admin/pending-rescuers', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT Id, Name, Email, Mobile, ValidIdPath FROM Rescuers WHERE IsIdVerified = 0`);
    res.json(result.recordset);
  } catch (err) {
    console.error('Pending rescuers error:', err);
    res.status(500).send({ success: false, message: err.message });
  }
});


// Approve rescuer ID
app.post('/admin/rescuers/approve/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`UPDATE Rescuers SET IsIdVerified = 1 WHERE Id = @id`);
    res.send({ success: true, message: 'Rescuer approved.' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).send({ success: false, message: err.message });
  }
});

// Reject rescuer ID
app.post('/admin/rescuers/reject/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`UPDATE Rescuers SET IsIdVerified = -1 WHERE Id = @id`);
    res.send({ success: true, message: 'Rescuer rejected.' });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).send({ success: false, message: err.message });
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
// ---------------- ✉️ SEND OTP ----------------
app.post('/otp/send', async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) {
        return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    // 1. Generate OTP and Expiry Time
    const otpCode = generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
        const pool = await getPool();

        // 2. Optional: check if user exists
        const userCheck = await pool.request()
            .input('Mobile', sql.NVarChar, mobile)
            .query('SELECT Id FROM Users WHERE Mobile = @Mobile');

        // 3. Store/Update OTP in the database (upsert)
        const updateResult = await pool.request()
            .input('Mobile', sql.NVarChar, mobile)
            .input('OTP', sql.NVarChar, otpCode)
            .input('ExpiresAt', sql.DateTime, expiryTime)
            .query(`
                UPDATE OtpStorage 
                SET OTP = @OTP, ExpiresAt = @ExpiresAt
                WHERE Mobile = @Mobile;
            `);

        if (updateResult.rowsAffected[0] === 0) {
            await pool.request()
                .input('Mobile', sql.NVarChar, mobile)
                .input('OTP', sql.NVarChar, otpCode)
                .input('ExpiresAt', sql.DateTime, expiryTime)
                .query(`
                    INSERT INTO OtpStorage (Mobile, OTP, ExpiresAt)
                    VALUES (@Mobile, @OTP, @ExpiresAt);
                `);
        }

        // 4. Send OTP via iProgTech SMS API
        const apiToken = 'sd53783f0bbfd7010b6d873dcde2a0e34b3a824d7';
        const message = `Fernandino, Your OTP code is: ${otpCode}`;

        const smsResponse = await axios.post(
            'https://sms.iprogtech.com/api/v1/sms_messages',
            {
                api_token: apiToken,
                phone_number: mobile,
                message: message
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log(`[OTP DEBUG] Sent OTP ${otpCode} to ${mobile}`);
        console.log('SMS API Response:', smsResponse.data);

        res.json({ success: true, message: 'OTP sent successfully.' });
    } catch (err) {
        console.error('❌ Send OTP Error:', err.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Server error during OTP sending.' });
    }
});

// ---------------- ✅ VERIFY OTP ----------------
app.post('/otp/verify', async (req, res) => {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
        return res.status(400).json({ success: false, message: 'Mobile and OTP are required.' });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Mobile', sql.NVarChar, mobile)
            .input('OTP', sql.NVarChar, otp)
            .input('CurrentTime', sql.DateTime, new Date())
            .query(`
                SELECT * FROM OtpStorage 
                WHERE Mobile = @Mobile AND OTP = @OTP AND ExpiresAt > @CurrentTime;
            `);

        const storedOtp = result.recordset[0];

        if (!storedOtp) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // OTP is valid and not expired. Delete it for security.
        await pool.request()
            .input('Mobile', sql.NVarChar, mobile)
            .query('DELETE FROM OtpStorage WHERE Mobile = @Mobile');

        res.json({ success: true, message: 'Mobile verified.' });
    } catch (err) {
        console.error('❌ Verify OTP Error:', err);
        res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
    }
});
// ---------------- 🔑 USER LOGIN ----------------
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT Id, Name, Email, PasswordHash, mobile
        FROM Users
        WHERE Email = @email
      `);

    const user = result.recordset[0];
    if (!user) return res.status(400).send({ success: false, message: 'User not found.' });

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.status(400).send({ success: false, message: 'Incorrect password.' });

   res.send({
  success: true,
  user: {
    Id: user.Id,
    Name: user.Name,
    Email: user.Email,
    mobile: user.mobile
  }
});


  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- 👶 CHILD LOGIN ----------------
app.post('/children/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT * FROM Children WHERE Email = @Email');

    const child = result.recordset[0];
    if (!child)
      return res.status(404).json({ success: false, message: 'Child not found.' });

    const valid = await bcrypt.compare(password, child.PasswordHash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Incorrect password.' });

    res.json({ success: true, message: 'Login successful!', child });
  } catch (err) {
    console.error('❌ Child Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
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
//-------Gesture Save-------
app.post("/gestures/save", async (req, res) => {
  const { userId, gesture } = req.body;
  if (!userId || !gesture) return res.json({ success: false, message: "Missing data" });

  try {
    // Example: store gesture JSON in your database
    const result = await sql.query`
      UPDATE Users SET GestureData = ${JSON.stringify(gesture)} WHERE Id = ${userId}
    `;
    res.json({ success: true });
  } catch (err) {
    console.error("Save gesture error:", err);
    res.json({ success: false, message: "Database error" });
  }
});


// ---------------- 📄 GET CHILDREN BY PARENT ----------------
app.get('/children/by-parent/:parentId', async (req, res) => {
  const parentId = parseInt(req.params.parentId);

  if (!parentId) return res.status(400).json({ success: false, message: 'Invalid parentId' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('ParentId', sql.Int, parentId)
      .query('SELECT Id, Name, Email, Gender, Birthdate FROM Children WHERE ParentId = @ParentId');

    res.json({ success: true, children: result.recordset });
  } catch (err) {
    console.error('❌ Fetch Children Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// ---------------- 📍 CHILD LOCATION TRACKING ----------------
app.post('/child/report-location', async (req, res) => {
    const { childId, parentId, latitude, longitude } = req.body;

    // 1. Basic validation
    // The use of 'typeof ... === 'undefined'' is robust for checking null/undefined values
    if (!childId || !parentId || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
        return res.status(400).json({ success: false, message: 'Missing required location data.' });
    }

    try {
        const pool = await getPool();

        // 2. Update the Child's current location in the Children table
        const result = await pool.request()
            .input('ChildId', sql.Int, childId)
            .input('ParentId', sql.Int, parentId)
            .input('Latitude', sql.Float, latitude)
            .input('Longitude', sql.Float, longitude)
            // Use server time as the LastReportedAt timestamp
            .input('LastReportedAt', sql.DateTime, new Date()) 
            .query(`
                UPDATE Children
                SET CurrentLatitude = @Latitude,
                    CurrentLongitude = @Longitude,
                    LastReportedAt = @LastReportedAt
                WHERE Id = @ChildId AND ParentId = @ParentId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Child not found or Parent ID mismatch. (Check database records)' 
            });
        }

        // 3. Send success response
        return res.json({ 
            success: true, 
            message: 'Child location updated successfully and parent will be notified.' 
        });

    } catch (err) {
        console.error('❌ Error reporting child location:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'An internal server error occurred while reporting location.' 
        });
    }
});
// ---------------- 📍 FETCH CHILD LOCATION BY ID ----------------
app.get('/child/location/:childId', async (req, res) => {
    const { childId } = req.params;

    if (!childId) {
        // Fix: Changed .send to .json
        return res.status(400).json({ success: false, message: "ChildId is required." }); 
    }

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('ChildId', sql.Int, childId)
            .query(`
                SELECT 
                    [CurrentLatitude],
                    [CurrentLongitude],
                    [LastReportedAt]
                FROM 
                    [Children]
                WHERE 
                    [Id] = @ChildId;
            `);

        if (result.recordset.length > 0) {
            const locationData = result.recordset[0];
            
            // Fix: Changed .send to .json
            res.json({ 
                success: true, 
                message: "Child location retrieved successfully.",
                location: locationData 
            });
        } else {
            // Fix: Changed .send to .json
            res.status(404).json({ success: false, message: "Child not found." }); 
        }

    } catch (err) {
        console.error('❌ Fetch Child Location Error:', err);
        // Fix: Changed .send to .json
        res.status(500).json({ success: false, error: "Database error or server fault." }); 
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
// ---------------- 🚨 CREATE INCIDENT WITH BACKGROUND SMS ----------------
app.post('/incidents', async (req, res) => {
    const { Type, Location, Latitude, Longitude, Status, UserId, ChildId, UserMobile, UserName } = req.body;

    if (!UserId && !ChildId) {
        return res.status(400).send({ success: false, message: "UserId or ChildId is required" });
    }

    try {
        const pool = await getPool();

        // 1️⃣ Insert the incident into the database
        await pool.request()
            .input('Type', sql.VarChar, Type)
            .input('Location', sql.VarChar, Location)
            .input('Latitude', sql.Float, Latitude || null)
            .input('Longitude', sql.Float, Longitude || null)
            .input('Status', sql.VarChar, Status || 'Pending')
            .input('UserId', sql.Int, UserId || null)
            .input('ChildId', sql.Int, ChildId || null)
            .query(`
                INSERT INTO Incidents (Type, Location, Latitude, Longitude, Status, UserId, ChildId, CreatedAt)
                VALUES (@Type, @Location, @Latitude, @Longitude, @Status, @UserId, @ChildId, GETDATE())
            `);

        // 2️⃣ Respond immediately so client is not blocked
        res.send({ success: true, message: "Incident reported! Admin is being notified." });

        // 3️⃣ Send SMS in background
        const adminMobile = '+639752726146';
        const apiToken = 'd53783f0bbfd7010b6d873dcde2a0e34b3a824d7';
        const message = ` DISTRESS ALERT 
Type: ${Type}
Location: ${Location}
Reported by: ${UserName || UserId || ChildId}
User Phone: ${UserMobile || 'N/A'}`;

        // Send via iProgSMS API (same pattern as OTP)
        const smsResponse = await axios.post(
            'https://sms.iprogtech.com/api/v1/sms_messages',
            {
                api_token: apiToken,
                phone_number: adminMobile,
                message: message
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log(`[DISTRESS ALERT] Sent to ${adminMobile}`);
        console.log('SMS API Response:', smsResponse.data);

    } catch (err) {
        console.error('❌ Create Incident Error:', err.response?.data || err.message);
    }
});



// ---------------- 📄 FETCH INCIDENTS (Updated to include SenderContact) ----------------
app.get('/incidents', async (req, res) => {
  try {
    const pool = await getPool();
    
    // SQL Query: JOIN Incidents (I) with Users (U) to retrieve the sender's mobile number.
    const incidentQuery = `
        SELECT TOP (1000)
            I.*,
            U.mobile AS SenderContact 
        FROM 
            Incidents I
        INNER JOIN 
            Users U ON I.UserId = U.Id -- Assuming Incidents.UserId links to Users.Id
        ORDER BY 
            I.CreatedAt DESC
    `;
    
    const result = await pool.request().query(incidentQuery);
    res.send({ success: true, incidents: result.recordset });
  } catch (err) {
    console.error('❌ Fetch Incidents Error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ---------------- ⚡ UPDATE INCIDENT STATUS ----------------
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
//-------------- Update an existing contact--------
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
//---------------- Delete a contact----------------
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

// ----------Dashboard page
app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});
// ----------Optional: redirect root to admin login
app.get('/', (req, res) => {
  res.redirect('/admin-login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
