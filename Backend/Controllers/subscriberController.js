const Subscriber = require("../Model/NewSubscriber");

// Subscribe user
const subscribeUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(200).json({ message: "You're already subscribed!" });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();
    res.status(201).json({ message: "Subscribed successfully!" });
  } catch (error) {
    console.error("❌ Subscription error:", error.message);
    res.status(500).json({ message: "Failed to subscribe." });
  }
};
// Unsubscribe user
const unsubscribeUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required to unsubscribe." });
  }

  try {
    const deleted = await Subscriber.findOneAndDelete({ email });
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Email not found in subscribers list." });
    }

    res.status(200).json({ message: "You have been unsubscribed." });
  } catch (error) {
    console.error("❌ Unsubscription error:", error.message);
    res.status(500).json({ message: "Failed to unsubscribe." });
  }
};

// Get all subscribers (admin only - optional)
const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
};
const countSubscriber = async (req, res) => {
  try {
    const count = await Subscriber.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  subscribeUser,
  unsubscribeUser,
  getAllSubscribers,
  countSubscriber,
};
