const Testimonial = require("../Model/Testimonial");

// ✅ Fetch All Testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    console.error("❌ Error fetching testimonials:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Add New Testimonial
exports.addTestimonial = async (req, res) => {
  try {
    const { name, status, comment } = req.body;

    if (!name || !status || !comment) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const newTestimonial = new Testimonial({ name, status, comment });
    await newTestimonial.save();

    res.status(201).json({ msg: "Testimonial added successfully", testimonial: newTestimonial });
  } catch (error) {
    console.error("❌ Error adding testimonial:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
