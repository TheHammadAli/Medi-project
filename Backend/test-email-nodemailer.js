const { sendOTPEmail } = require('./Utils/Email');

console.log("🔍 Testing Nodemailer Email Implementation...\n");

async function testSendOTP() {
  try {
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    const testOTP = '123456';

    console.log(`📧 Sending test OTP to: ${testEmail}`);

    const result = await sendOTPEmail(testEmail, testOTP);

    if (result) {
      console.log("✅ Test email sent successfully!");
    } else {
      console.log("❌ Test email failed!");
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testSendOTP();