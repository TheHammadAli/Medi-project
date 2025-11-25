const express = require("express");
const router = express.Router();
const { uploadProfileImage } = require("../Middleware/Multer");
const protect = require("../Middleware/authDoctor");
const {
  uploadBlog,
  getAllBlogs,
  getBlogsByDoctor,
  getBlogById,
  deleteBlog,
} = require("../Controllers/blogController");

// Protected: Upload and delete
router.post("/upload", protect, uploadProfileImage.single("bannerImage"), uploadBlog);
router.delete("/:blogId", protect, deleteBlog);

// Public
router.get("/", getAllBlogs);
router.get("/doctor/:doctorId", getBlogsByDoctor);
router.get("/:blogId", getBlogById);

module.exports = router;
