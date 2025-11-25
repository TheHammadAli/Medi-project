const express = require("express");
const router = express.Router();
const {
  addDoctor,
  getAllDoctorProfiles,
  getDoctorProfileByEmail,
  updateDoctorProfile,
  deleteProfile,
} = require("../Controllers/DocProfileController");

const { uploadProfileImage } = require("../Middleware/Multer");
const multer = require("multer");

// Create a more flexible middleware for updates that can handle optional images
const uploadOptionalImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, jpeg, png, gif)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB for profile images
}).single("image");

router.post("/add", uploadProfileImage.single("image"), addDoctor);
router.get("/all", getAllDoctorProfiles);
router.get("/:email", getDoctorProfileByEmail);
router.put("/update/:email", uploadOptionalImage, updateDoctorProfile);
router.delete("/:id", deleteProfile);

module.exports = router;
