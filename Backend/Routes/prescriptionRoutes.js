const express = require("express");
const router = express.Router();

const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  verifyPrescription,
  dispenseMedicine,
  getPrescriptionAudit,
  generatePrescriptionPDF
} = require("../Controllers/prescriptionController");

const {
  authenticate,
  requireDoctor,
  requirePatient,
  requirePharmacist,
  requireDoctorOrPatient,
  requireDoctorOrPharmacist
} = require("../Middleware/roleAuth");

const {
  validatePrescriptionCreate,
  validatePrescriptionUpdate,
  validatePrescriptionId,
  validateDispensing
} = require("../Middleware/prescriptionValidation");

const { prescriptionErrorHandler } = require("../Middleware/prescriptionErrorHandler");

// Health check endpoint
router.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "🟢 Prescription API is active",
    timestamp: new Date().toISOString()
  });
});

// Create prescription (doctors only)
router.post("/", 
  requireDoctor, 
  validatePrescriptionCreate, 
  createPrescription
);

// Get prescriptions (role-based access)
router.get("/list",
  authenticate,
  getPrescriptions
);

// Get prescriptions for a specific patient (patients only)
router.get("/list/:patientId",
  requirePatient,
  getPrescriptions
);

// Verify prescription by prescription number (pharmacists only)
router.post("/verify", 
  requirePharmacist, 
  verifyPrescription
);

// Get specific prescription by ID (doctors, patients, pharmacists)
router.get("/:id", 
  authenticate, 
  validatePrescriptionId, 
  getPrescriptionById
);

// Update prescription (doctors only, their own prescriptions)
router.put("/:id", 
  requireDoctor, 
  validatePrescriptionId, 
  validatePrescriptionUpdate, 
  updatePrescription
);

// Delete prescription (doctors only, their own prescriptions)
router.delete("/:id", 
  requireDoctor, 
  validatePrescriptionId, 
  deletePrescription
);

// Verify specific prescription by ID (pharmacists only)
router.post("/:id/verify", 
  requirePharmacist, 
  validatePrescriptionId, 
  verifyPrescription
);

// Dispense medicine (pharmacists only)
router.post("/:id/dispense", 
  requirePharmacist, 
  validatePrescriptionId, 
  validateDispensing, 
  dispenseMedicine
);

// Get audit trail for prescription (authorized users only)
router.get("/:id/audit",
  authenticate,
  validatePrescriptionId,
  getPrescriptionAudit
);

// Generate PDF for prescription (authorized users only)
router.get("/:id/pdf",
  authenticate,
  validatePrescriptionId,
  generatePrescriptionPDF
);

// Apply prescription-specific error handling
router.use(prescriptionErrorHandler);

module.exports = router;