const nodemailer = require("nodemailer");
require("dotenv").config();

console.log("🔍 Testing Gmail SMTP Configuration...\n");

const gmailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
  logger: true
});

console.log("📧 Gmail Configuration:");
console.log(`User: ${process.env.EMAIL_USER}`);
console.log(`Password: ${process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'Not set'}`);
console.log("\n🔄 Testing Gmail connection...");

async function testGmailConnection() {
  try {
    await gmailTransporter.verify();
    console.log("✅ Gmail connection successful!");

    // Test sending email
    console.log("\n📤 Testing Gmail email send...");
    const info = await gmailTransporter.sendMail({
      from: `"MediPredict Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: "Gmail SMTP Test - MediPredict",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Gmail SMTP Test</h2>
          <p>This is a test email to verify Gmail SMTP configuration is working.</p>
          <p>If you receive this email, your Gmail SMTP is configured correctly!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">MediPredict SMTP Test</p>
        </div>
      `
    });

    console.log("✅ Gmail test email sent successfully!");
    console.log("Message ID:", info.messageId);

  } catch (error) {
    console.error("❌ Gmail Error:", error.message);
    console.error("Error code:", error.code);

    if (error.code === 'EAUTH') {
      console.log("\n🔧 Gmail Authentication failed. Possible solutions:");
      console.log("1. Enable 2FA on your Gmail account");
      console.log("2. Generate an App Password: https://support.google.com/accounts/answer/185833");
      console.log("3. Use the App Password (16 characters) instead of your regular password");
      console.log("4. Make sure 'Less secure app access' is enabled or use App Password");
    } else if (error.code === 'ECONNECTION') {
      console.log("\n🔧 Connection failed. Check your internet connection and firewall settings.");
    }
  }
}

testGmailConnection();