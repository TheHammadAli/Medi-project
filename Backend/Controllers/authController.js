const Patient = require("../Model/Patient");
const Doctor = require("../Model/Doctor");
const OTP = require("../Model/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../Utils/Email");
const sendEmail = require("../Utils/ContactEmail");
const crypto = require("crypto");

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// 📌 Register (send OTP)
const register = async (req, res) => {
  try {
    let { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    email = email.trim().toLowerCase();

    const existingDoctor = await Doctor.findOne({ email });
    const existingPatient = await Patient.findOne({ email });

    if (existingDoctor || existingPatient) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const tempUser = {
      username,
      password: hashedPassword,
      role,
    };

    // ✅ Ensure only one OTP per email
    await OTP.deleteMany({ email });

    // Save OTP to database first (before attempting to send email)
    await OTP.create({
      email,
      otp,
      expiresAt: otpExpires,
      tempUser,
    });

    // Attempt to send email (don't fail registration if email fails)
    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({ msg: "OTP created and sent to email. Please verify." });
    } catch (emailError) {
      console.error("❌ Email sending failed, but OTP saved:", emailError);
      // Still return success since OTP is saved in DB
      res.status(200).json({
        msg: "OTP created successfully. Please check your email (may be delayed).",
        note: "Email sending failed but registration can proceed"
      });
    }
  } catch (error) {
    console.error("❌ Error in Register API:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Verify OTP and finalize registration
const verifyOTP = async (req, res) => {
  let { email, otp } = req.body;
  email = email?.trim().toLowerCase();

  try {
    console.log("📩 Verifying OTP for:", email, otp);

    const otpRecord = await OTP.findOne({ email });
    console.log("📥 Found OTP record:", otpRecord);

    if (!otpRecord) {
      console.log("❌ No OTP record found");
      return res
        .status(400)
        .json({ msg: "No OTP found for this email. Try signing up again." });
    }

    if (otpRecord.otp.toString().trim() !== otp.toString().trim()) {
      console.log("❌ OTP mismatch", otpRecord.otp, otp);
      return res.status(400).json({ msg: "Invalid OTP. Please try again." });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ msg: "OTP expired. Request a new one." });
    }

    if (!otpRecord.tempUser) {
      return res
        .status(400)
        .json({ msg: "Temp user data missing in OTP record." });
    }

    const { username, password, role } = otpRecord.tempUser;

    // Create user based on role
    let newUser;
    if (role === "doctor") {
      newUser = await Doctor.create({
        username,
        email,
        password,
        role: role || "doctor",
        isVerified: true,
      });
    } else {
      newUser = await Patient.create({
        username,
        email,
        password,
        role: role || "patient",
        isVerified: true,
      });
    }

    await OTP.deleteOne({ email });

    const token = jwt.sign({ id: newUser._id, userType: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Include profile data if it exists (though it shouldn't for new users)
    let userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    };

    res.status(200).json({
      msg: "OTP verified. Registration complete.",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ OTP Verification Error:", error);
    res.status(500).json({ msg: "OTP verification failed. Please try again." });
  }
};

// 📌 Resend OTP
const resendOTP = async (req, res) => {
  try {
    let { email } = req.body;
    email = email.trim().toLowerCase();

    const existingOTP = await OTP.findOne({ email });
    if (!existingOTP || !existingOTP.tempUser) {
      return res
        .status(400)
        .json({ msg: "No pending registration. Please sign up again." });
    }

    await OTP.deleteMany({ email });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.create({
      email,
      otp,
      expiresAt: otpExpires,
      tempUser: existingOTP.tempUser,
    });

    // Attempt to send email (don't fail if email fails)
    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({ msg: "OTP resent to your email." });
    } catch (emailError) {
      console.error("❌ Email resend failed, but OTP updated:", emailError);
      // Still return success since OTP is updated in DB
      res.status(200).json({
        msg: "OTP updated successfully. Please check your email (may be delayed).",
        note: "Email sending failed but you can use the new OTP"
      });
    }
  } catch (err) {
    console.error("❌ Resend OTP Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Normalize email: trim and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    console.log("🔄 Login attempt for email:", normalizedEmail);

    // First try to find user as Patient
    let user = await Patient.findOne({ email: normalizedEmail });
    let userType = "patient";
    console.log("🔍 Patient lookup result:", user ? "found" : "not found");

    // If not found as Patient, try Doctor
    if (!user) {
      user = await Doctor.findOne({ email: normalizedEmail });
      userType = "doctor";
      console.log("🔍 Doctor lookup result:", user ? "found" : "not found");
    }

    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(401).json({ msg: "Invalid email or password" });
    }


    // Check password based on user type
    let isMatch = false;
    if (userType === "patient") {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (userType === "doctor") {
      isMatch = await bcrypt.compare(password, user.password);
    }

    console.log("🔐 Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch for user:", email);
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    console.log("✅ Password correct, generating token...");

    const token = jwt.sign({ id: user._id, userType: user.role || userType }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Include profile data in the response
    let userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || userType,
    };

    // If user is a patient and has a profile, include profile data
    if (userType === "patient" && user.profile) {
      const PatientProfile = require("../Model/PatientProfile");
      const profile = await PatientProfile.findOne({ patientId: user._id });

      if (profile) {
        userResponse = {
          ...userResponse,
          ...profile.toObject(),
          patientId: undefined
        };
      }
    }

    // If user is a doctor, include specialization
    if (userType === "doctor") {
      userResponse.specialization = user.specialization;
    }

    const response = {
      token,
      user: userResponse,
    };


    res.status(200).json(response);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = email.trim().toLowerCase();

    // Check if user exists in Patient or Doctor
    let user = await Patient.findOne({ email: emailLower });
    let userType = "patient";
    if (!user) {
      user = await Doctor.findOne({ email: emailLower });
      userType = "doctor";
    }

    if (!user) {
      return res.status(404).json({ msg: "No account found with this email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token in OTP collection (reuse for simplicity)
    await OTP.deleteMany({ email: emailLower }); // Clean up any existing
    await OTP.create({
      email: emailLower,
      otp: resetToken, // Using otp field for token
      expiresAt: resetTokenExpires,
      tempUser: { userType, userId: user._id }, // Store user info
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/change-password?token=${resetToken}&email=${emailLower}`;

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailLower,
        subject: "Password Reset Request - MediPredict",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p>You requested a password reset for your MediPredict account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes for security reasons.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">MediPredict - Your Health Companion</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("❌ Error sending reset email:", emailError);
      return res.status(500).json({ msg: "Failed to send reset email" });
    }

    res.status(200).json({ msg: "Password reset link sent to your email" });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Change Password
const changePassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;
    const emailLower = email.trim().toLowerCase();

    // Find the reset token
    const resetRecord = await OTP.findOne({
      email: emailLower,
      otp: token,
    });

    if (!resetRecord) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    if (resetRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: resetRecord._id });
      return res.status(400).json({ msg: "Reset token has expired" });
    }

    if (!resetRecord.tempUser || !resetRecord.tempUser.userType || !resetRecord.tempUser.userId) {
      return res.status(400).json({ msg: "Invalid reset token data" });
    }

    const { userType, userId } = resetRecord.tempUser;

    // Find and update the user
    let UserModel;
    if (userType === "patient") {
      UserModel = Patient;
    } else if (userType === "doctor") {
      UserModel = Doctor;
    } else {
      return res.status(400).json({ msg: "Invalid user type" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete the reset token
    await OTP.deleteOne({ _id: resetRecord._id });

    res.status(200).json({ msg: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Change Password Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Contact Us
const contactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const response = await sendEmail({ name, email, message });

    if (!response.success) {
      return res
        .status(500)
        .json({ msg: "Failed to send message. Try again." });
    }

    res.status(200).json({ msg: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error in Contact Form API:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Get Logged-in Profile (Doctor or Patient)
const getProfile = async (req, res) => {
  try {
    let user = await Patient.findById(req.user.id).select("-password");
    let userType = "patient";

    if (!user) {
      user = await Doctor.findById(req.user.id).select("-password");
      userType = "doctor";
    }

    if (!user) return res.status(404).json({ msg: "User not found" });

    // If user is a patient, include profile data
    if (user.role === "patient" && user.profile) {
      const PatientProfile = require("../Model/PatientProfile");
      const profile = await PatientProfile.findOne({ patientId: user._id });

      if (profile) {
        // Combine user and profile data
        const combinedData = {
          ...user.toObject(),
          ...profile.toObject(),
          // Ensure we don't duplicate patientId
          patientId: undefined
        };
        return res.status(200).json(combinedData);
      }
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Get Profile Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Count Patients
const countPatient = async (req, res) => {
  try {
    const count = await Patient.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error("Error getting patient count:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  resendOTP,
  forgotPassword,
  changePassword,
  contactUs,
  getProfile,
  countPatient,
};
