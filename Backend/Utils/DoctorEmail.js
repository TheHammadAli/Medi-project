const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 📩 Send OTP via Email
 */
const sendOTPEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: "MediPredict <onboarding@resend.dev>",
      to: [email],
      subject: "Your OTP Code - MediPredict",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
          <p>Thank you for signing up with MediPredict!</p>
          <p>Your OTP code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #007bff; padding: 10px 20px; border: 2px solid #007bff; border-radius: 5px;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 2 minutes for security reasons.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">MediPredict - Your Health Companion</p>
        </div>
      `,
    });

    console.log(`✅ OTP sent via Email to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP via Email:", error);
    return false;
  }
};

module.exports = { sendOTPEmail };
