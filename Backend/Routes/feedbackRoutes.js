const express = require("express");
const router = express.Router();
const {
  createFeedback,
  getAllFeedback,
  deleteFeedback,
} = require("../Controllers/feedBackController");

const authMiddleware = require("../Middleware/authMiddleware");

router.post("/create", authMiddleware, createFeedback);

// Public route to fetch all messages
router.get("/all", getAllFeedback);

// Admin deletes a message
router.delete("/:id", deleteFeedback);

module.exports = router;
