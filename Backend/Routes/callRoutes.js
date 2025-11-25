const express = require("express");
const {
  saveCall,
  getCallHistory,
} = require("../Controllers/callController");

const router = express.Router();

// POST: Save a new call
router.post("/save", saveCall);

// GET: Get call history for a user
router.get("/history/:userId/:userModel", getCallHistory);

module.exports = router;