const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authMiddleware");

const {
  bookAppointment,
  getAppointmentsForDoctor,
  getBookedSlots,
  getAppointmentsForPatient,
  cancelAppointment,
  getDoctorsForPatientChat,
} = require("../Controllers/appointmentController");

// ✅ Add this for direct browser access (GET /api/appointments)
router.get("/", (req, res) => {
  res.send("🟢 Appointments API is active");
});

router.post("/book", authMiddleware, bookAppointment);
router.get("/doctor/:doctorId", getAppointmentsForDoctor);
router.get("/patient/:patientId", authMiddleware, getAppointmentsForPatient);
router.get("/booked/:doctorId", getBookedSlots);
router.put("/cancel/:id", cancelAppointment);
router.get("/chat-doctors/:patientId", getDoctorsForPatientChat);

module.exports = router;
