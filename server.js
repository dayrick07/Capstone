const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow React Native to fetch

// SQL Server configuration
const config = {
  user: 'YOUR_DB_USER',
  password: 'YOUR_DB_PASSWORD',
  server: 'YOUR_DB_SERVER', // e.g., localhost or IP
  database: 'EmergencyAppDB',
  options: {
    encrypt: false, // true if using Azure
    trustServerCertificate: true
  }
};

// Endpoint to get all available rescuers
app.get('/rescuer', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query("SELECT * FROM Rescuers WHERE Status = 'Available'");
    res.json(result.recordset); // Send JSON to React Native
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
