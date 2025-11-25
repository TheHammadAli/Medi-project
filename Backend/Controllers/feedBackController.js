const Patient = require("../Model/Patient");
const Feedback = require("../Model/Feedback");

const createFeedback = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id; // Comes from authMiddleware

  if (!message) {
    return res.status(400).json({ msg: "Message is required" });
  }

  try {
    // 🔍 Fetch patient's username from DB
    const patient = await Patient.findById(userId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // 💾 Save feedback with the username
    const newMessage = new Feedback({
      message,
      username: patient.username,
    });

    await newMessage.save();
    res.status(201).json({ msg: "Feedback posted", data: newMessage });
  } catch (err) {
    console.error("❌ Error posting feedback:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Get all feedback messages
const getAllFeedback = async (req, res) => {
  try {
    const messages = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch feedback messages" });
  }
};

// 📌 Delete a feedback message
const deleteFeedback = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ msg: "Message not found" });
    }
    res.status(200).json({ msg: "Feedback message deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  createFeedback,
  getAllFeedback,
  deleteFeedback,
};
