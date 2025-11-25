const mongoose = require("mongoose");

// Validation middleware for prescription creation
const validatePrescriptionCreate = (req, res, next) => {
  const { patientId, patient, medicines, diagnosis, notes } = req.body;
  const errors = [];

  // Handle both frontend format (patientId) and direct API format (patient object)
  if (patientId) {
    // Frontend format validation
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      errors.push("Valid patient ID is required");
    }
  } else if (patient) {
    // Direct API format validation
    if (!patient.id || !mongoose.Types.ObjectId.isValid(patient.id)) {
      errors.push("Valid patient ID is required");
    }
    if (!patient.name || typeof patient.name !== 'string' || patient.name.trim().length === 0) {
      errors.push("Patient name is required");
    }
    if (!patient.age || typeof patient.age !== 'number' || patient.age <= 0) {
      errors.push("Valid patient age is required");
    }
    if (!patient.gender || !['Male', 'Female', 'Other'].includes(patient.gender)) {
      errors.push("Valid patient gender is required (Male, Female, Other)");
    }
  } else {
    errors.push("Patient information is required (patientId or patient object)");
  }

  // Validate medicines array
  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    errors.push("At least one medicine is required");
  } else {
    medicines.forEach((medicine, index) => {
      if (!medicine.name || typeof medicine.name !== 'string' || medicine.name.trim().length === 0) {
        errors.push(`Medicine ${index + 1}: Name is required`);
      }
      if (!medicine.dosage || typeof medicine.dosage !== 'string' || medicine.dosage.trim().length === 0) {
        errors.push(`Medicine ${index + 1}: Dosage is required`);
      }
      if (!medicine.frequency || typeof medicine.frequency !== 'string' || medicine.frequency.trim().length === 0) {
        errors.push(`Medicine ${index + 1}: Frequency is required`);
      }
      if (!medicine.duration || typeof medicine.duration !== 'string' || medicine.duration.trim().length === 0) {
        errors.push(`Medicine ${index + 1}: Duration is required`);
      }
    });
  }

  // Validate additional notes (optional but if provided should be string)
  // Handle both frontend format (diagnosis, notes) and direct API format (additionalNotes)
  if (notes && typeof notes !== 'string') {
    errors.push("Additional notes must be a string");
  }
  if (diagnosis && typeof diagnosis !== 'string') {
    errors.push("Diagnosis must be a string");
  }
  if (notes && typeof notes !== 'string') {
    errors.push("Notes must be a string");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Prescription validation failed",
        details: errors
      }
    });
  }

  next();
};

// Validation middleware for prescription updates
const validatePrescriptionUpdate = (req, res, next) => {
  const { medicines, additionalNotes, status } = req.body;
  const errors = [];

  // Validate medicines if provided
  if (medicines) {
    if (!Array.isArray(medicines) || medicines.length === 0) {
      errors.push("Medicines must be a non-empty array");
    } else {
      medicines.forEach((medicine, index) => {
        if (!medicine.name || typeof medicine.name !== 'string' || medicine.name.trim().length === 0) {
          errors.push(`Medicine ${index + 1}: Name is required`);
        }
        if (!medicine.dosage || typeof medicine.dosage !== 'string' || medicine.dosage.trim().length === 0) {
          errors.push(`Medicine ${index + 1}: Dosage is required`);
        }
        if (!medicine.frequency || typeof medicine.frequency !== 'string' || medicine.frequency.trim().length === 0) {
          errors.push(`Medicine ${index + 1}: Frequency is required`);
        }
        if (!medicine.duration || typeof medicine.duration !== 'string' || medicine.duration.trim().length === 0) {
          errors.push(`Medicine ${index + 1}: Duration is required`);
        }
      });
    }
  }

  // Validate status if provided
  if (status && !['active', 'completed', 'dispensed', 'cancelled'].includes(status)) {
    errors.push("Status must be one of: active, completed, dispensed, cancelled");
  }

  // Validate additional notes if provided
  if (additionalNotes && typeof additionalNotes !== 'string') {
    errors.push("Additional notes must be a string");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Prescription update validation failed",
        details: errors
      }
    });
  }

  next();
};

// Validation middleware for prescription ID parameter
const validatePrescriptionId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PRESCRIPTION_ID",
        message: "Valid prescription ID is required"
      }
    });
  }

  next();
};

// Validation middleware for dispensing medicines
const validateDispensing = (req, res, next) => {
  const { medicineIndex, pharmacistNotes } = req.body;
  const errors = [];

  if (typeof medicineIndex !== 'number' || medicineIndex < 0) {
    errors.push("Valid medicine index is required");
  }

  if (pharmacistNotes && typeof pharmacistNotes !== 'string') {
    errors.push("Pharmacist notes must be a string");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dispensing validation failed",
        details: errors
      }
    });
  }

  next();
};

module.exports = {
  validatePrescriptionCreate,
  validatePrescriptionUpdate,
  validatePrescriptionId,
  validateDispensing
};