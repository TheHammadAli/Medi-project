const express = require("express");
const { getTestimonials, addTestimonial } = require("../Controllers/testimonialController");

const router = express.Router();

// ✅ GET: Fetch all testimonials
router.get("/", getTestimonials);

// ✅ POST: Add a new testimonial
router.post("/", addTestimonial);

module.exports = router;
