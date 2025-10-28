const nodemailer = require('nodemailer');

// Configure transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your.email@gmail.com',       // Replace with your Gmail
    pass: 'your-app-password',          // Gmail App Password, NOT your normal password
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: '"SafeKaFernandino" <your.email@gmail.com>',
      to,
      subject,
      text,
    });
    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    return false;
  }
};

module.exports = sendEmail;
