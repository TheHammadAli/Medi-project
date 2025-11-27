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
       <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
         <div style="max-width: 500px; width: 100%; margin: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden;">
           <!-- Header Section -->
           <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
             <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Verify Your Email</h1>
             <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">MediPredict</p>
           </div>

           <!-- Content Section -->
           <div style="padding: 30px 20px;">
             <div style="text-align: center; margin-bottom: 20px;">
               <p style="color: #555; font-size: 16px; margin: 0;">Your verification code is:</p>
             </div>

             <div style="text-align: center; margin: 30px 0;">
               <div style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); padding: 15px 30px; border-radius: 8px;">
                 <span style="font-size: 28px; font-weight: 700; color: white; letter-spacing: 6px;">${otp}</span>
               </div>
             </div>

             <div style="text-align: center; margin-top: 20px;">
               <p style="color: #777; font-size: 14px; margin: 0;">Code expires in 2 minutes</p>
             </div>
           </div>

           <!-- Footer Section -->
           <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
             <p style="color: #888; font-size: 12px; margin: 0;">© 2024 MediPredict. All rights reserved.</p>
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
