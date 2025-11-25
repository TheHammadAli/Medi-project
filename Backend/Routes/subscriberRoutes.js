const express = require("express");
const router = express.Router();
const {
  subscribeUser,
  unsubscribeUser,
  getAllSubscribers,
  countSubscriber,
} = require("../Controllers/subscriberController");

router.post("/subscribe", subscribeUser);
router.post("/unsubscribe", unsubscribeUser);

router.get("/all", getAllSubscribers);
router.get("/subscribers/count", countSubscriber);

module.exports = router;
