const nodemailer = require("nodemailer");
require("dotenv").config();


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 📩 Send OTP via Email
 */
const sendOTPEmail = async (email, otp) => {
  try {
   

    const info = await transporter.sendMail({
      from: `"MediPredict" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code - MediPredict",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - MediPredict</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
          <div style="max-width: 600px; width: 100%; margin: 20px; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 30px; text-align: center;">
              <div style="display: inline-block; width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="font-size: 24px; color: white;">🔐</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Verify Your Email</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Secure Access to MediPredict</p>
            </div>

            <!-- Content Section -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #555; font-size: 18px; margin: 0 0 10px 0; line-height: 1.6;">Welcome to <strong style="color: #4CAF50;">MediPredict</strong>!</p>
                <p style="color: #777; font-size: 16px; margin: 0; line-height: 1.6;">Your Health Companion</p>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <p style="color: #555; font-size: 16px; margin: 0 0 20px 0;">Your verification code is:</p>
                <div style="display: inline-block; background: linear-gradient(135deg, #4CAF50, #45a049); padding: 20px 40px; border-radius: 12px; box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);">
                  <span style="font-size: 32px; font-weight: 700; color: white; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${otp}</span>
                </div>
              </div>

              <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; border-left: 4px solid #4CAF50; margin: 30px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <span style="font-size: 18px; margin-right: 10px;">⏰</span>
                  <p style="color: #555; font-size: 14px; margin: 0; font-weight: 500;">Code expires in <strong style="color: #e74c3c;">2 minutes</strong></p>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 18px; margin-right: 10px;">🔒</span>
                  <p style="color: #555; font-size: 14px; margin: 0;">For security reasons</p>
                </div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 14px; margin: 0;">Didn't request this code?</p>
                <p style="color: #999; font-size: 14px; margin: 5px 0 0 0;">Simply ignore this email - your account remains secure.</p>
              </div>
            </div>

            <!-- Footer Section -->
            <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef;">
              <div style="text-align: center;">
                <div style="display: inline-flex; align-items: center; margin-bottom: 15px;">
                  <span style="font-size: 20px; margin-right: 8px;">🏥</span>
                  <span style="font-size: 18px; font-weight: 600; color: #4CAF50;">MediPredict</span>
                </div>
                <p style="color: #888; font-size: 12px; margin: 0;">Your trusted health companion</p>
                <p style="color: #ccc; font-size: 11px; margin: 8px 0 0 0;">© 2024 MediPredict. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ OTP sent via Nodemailer (Gmail) to ${email}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP via Nodemailer:", error.message);
    console.error("🔍 Error details:", {
      name: error.name,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return false;
  }
};

module.exports = { sendOTPEmail };
