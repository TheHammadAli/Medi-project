const express = require("express");
const router = express.Router();
const {
  registerDoctor,
  loginDoctor,
  DoctorResendOTP,
  DoctorVerifyOTP,
  countDoctor,
  getAllDoctors,
} = require("../Controllers/DoctorController");
const protect = require("../Middleware/authMiddleware");

// /api/doctors
router.post("/register", registerDoctor);
router.post("/login", loginDoctor);
router.post("/resend-otp", DoctorResendOTP);
router.post("/verify-otp", DoctorVerifyOTP);
router.get("/count", countDoctor);
router.get("/all", getAllDoctors);

module.exports = router;
