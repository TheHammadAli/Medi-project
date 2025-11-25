const Announcement = require("../Model/Announcement");

// Create announcement (admin)
const createAnnouncement = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ msg: "Message is required" });

  try {
    const newAnnouncement = await Announcement.create({ message });
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Get latest announcement (public)
const getLatestAnnouncement = async (req, res) => {
  try {
    const latest = await Announcement.findOne().sort({ createdAt: -1 });
    res.status(200).json(latest);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
const getAllAnnouncement = async (req, res) => {
  try {
    const all = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(all);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch announcements" });
  }
};

// 📌 Delete announcement by ID
const deleteAnnouncement = async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ msg: "Announcement not found" });
    }
    res.status(200).json({ msg: "Announcement deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  createAnnouncement,
  getLatestAnnouncement,
  getAllAnnouncement,
  deleteAnnouncement,
};
