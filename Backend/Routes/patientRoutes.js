const express = require("express");
const { getAllPatients, deletePatient } = require("../Controllers/patientController");
const adminAuth = require("../Middleware/adminAuth");

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Get all patients
router.get("/all", getAllPatients);

// Delete a patient by ID
router.delete("/:id", deletePatient);

module.exports = router;