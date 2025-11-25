const express = require("express");
const router = express.Router();
const {
  createAnnouncement,
  getLatestAnnouncement,
  getAllAnnouncement,
  deleteAnnouncement,
} = require("../Controllers/announcementController");

router.post("/create", createAnnouncement);

router.get("/latest", getLatestAnnouncement);
router.get("/all", getAllAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;
