const nodemailer = require("nodemailer");
require("dotenv").config();

console.log("🔍 Testing Email Configuration...\n");

const testTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.MAILERSEND_USER,
    pass: process.env.MAILERSEND_PASS,
  },
  debug: true, // Enable debug output
  logger: true // Log to console
});

console.log("📧 Configuration:");
console.log(`Host: ${process.env.SMTP_HOST}`);
console.log(`Port: ${process.env.SMTP_PORT}`);
console.log(`Secure: ${process.env.SMTP_SECURE}`);
console.log(`User: ${process.env.MAILERSEND_USER}`);
console.log(`Password: ${process.env.MAILERSEND_PASS ? '***' + process.env.MAILERSEND_PASS.slice(-4) : 'Not set'}`);
console.log("\n🔄 Testing connection...");

async function testConnection() {
  try {
    await testTransporter.verify();
    console.log("✅ Connection successful!");

    // Test sending email
    console.log("\n📤 Testing email send...");
    const info = await testTransporter.sendMail({
      from: '"Test" <test@medipredict.com>',
      to: "test@example.com",
      subject: "Test Email",
      text: "This is a test email to verify SMTP configuration."
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Error code:", error.code);
    console.error("Response:", error.response);

    // Provide specific solutions based on error
    if (error.code === 'EAUTH') {
      console.log("\n🔧 Authentication failed. Possible solutions:");
      console.log("1. Check if your MailerSend API key is valid and not expired");
      console.log("2. Verify your MailerSend account has SMTP enabled");
      console.log("3. Try using a different API key from your MailerSend dashboard");
      console.log("4. Consider using Gmail SMTP as an alternative (see .env backup)");
    }
  }
}

testConnection();