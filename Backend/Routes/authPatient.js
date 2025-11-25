const express = require("express");
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  changePassword,
  contactUs,
  getProfile,
  countPatient,
} = require("../Controllers/authController");
const authMiddleware = require("../Middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/change-password", changePassword);
router.post("/contact", contactUs);
router.post("/login", login);
router.get("/patients/count", countPatient);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
