const express = require("express");
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadMedicalReport,
  getMedicalReports,
  deleteMedicalReport,
  getMedicalReport,
  getPatientProfileById
} = require("../Controllers/patientProfileController");
const authMiddleware = require("../Middleware/authMiddleware");
const { uploadProfileImage: uploadImage, uploadMedicalReport: uploadDoc } = require("../Middleware/Multer");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Profile management routes
router.get("/", getProfile);
router.put("/", updateProfile);

// Profile image upload
router.post("/upload-image", uploadImage.single("profileImage"), uploadProfileImage);

// Medical reports routes (must come before dynamic :patientId route)
router.post("/upload-report", uploadDoc.single("report"), uploadMedicalReport);
router.get("/reports", getMedicalReports);
router.get("/reports/:reportId", getMedicalReport);
router.delete("/reports/:reportId", deleteMedicalReport);

// Dynamic patient ID route (must come after specific routes)
router.get("/:patientId", getPatientProfileById);

module.exports = router;