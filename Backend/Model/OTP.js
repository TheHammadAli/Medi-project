const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 2 * 60 * 1000),
  },
  tempUser: {
    username: { type: String },
    password: { type: String }, // ✅ match controller
    role: { type: String },
    userType: { type: String }, // For password reset
    userId: { type: mongoose.Schema.Types.ObjectId }, // For password reset
  },
});

module.exports = mongoose.model("OTP", OTPSchema);
