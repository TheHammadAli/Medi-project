const AuditService = require("../Services/AuditService");

// Prescription-specific error handling middleware
const prescriptionErrorHandler = (error, req, res, next) => {
  console.error("Prescription Error:", error);

  // Log error for audit if user is available
  if (req.user) {
    try {
      AuditService.logError(error, req.user.id, req.userType, {
        endpoint: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
      });
    } catch (auditError) {
      console.error("Failed to log error to audit:", auditError);
    }
  }

  // Handle different types of errors
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Prescription validation failed',
        details: validationErrors
      }
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid prescription ID format',
        details: { field: error.path, value: error.value }
      }
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `Prescription with this ${field} already exists`,
        details: { field, value: error.keyValue[field] }
      }
    });
  }

  // Custom prescription errors
  if (error.code === 'PRESCRIPTION_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PRESCRIPTION_NOT_FOUND',
        message: 'The requested prescription could not be found',
        details: { prescriptionId: error.prescriptionId }
      }
    });
  }

  if (error.code === 'PRESCRIPTION_ALREADY_DISPENSED') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'PRESCRIPTION_ALREADY_DISPENSED',
        message: 'This prescription has already been dispensed and cannot be modified',
        details: { prescriptionId: error.prescriptionId }
      }
    });
  }

  if (error.code === 'UNAUTHORIZED_PRESCRIPTION_ACCESS') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_PRESCRIPTION_ACCESS',
        message: 'You are not authorized to access this prescription',
        details: { prescriptionId: error.prescriptionId }
      }
    });
  }

  if (error.code === 'PATIENT_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PATIENT_NOT_FOUND',
        message: 'The specified patient could not be found',
        details: { patientId: error.patientId }
      }
    });
  }

  if (error.code === 'MEDICINE_ALREADY_DISPENSED') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'MEDICINE_ALREADY_DISPENSED',
        message: 'This medicine has already been dispensed',
        details: { 
          prescriptionId: error.prescriptionId,
          medicineIndex: error.medicineIndex 
        }
      }
    });
  }

  // PDF generation errors
  if (error.code === 'PDF_GENERATION_FAILED') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PDF_GENERATION_FAILED',
        message: 'Failed to generate prescription PDF',
        details: { prescriptionId: error.prescriptionId }
      }
    });
  }

  // Rate limiting errors
  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: { retryAfter: error.retryAfter }
      }
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred while processing your request',
      details: {
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    }
  });
};

// Custom error classes for prescription operations
class PrescriptionError extends Error {
  constructor(code, message, prescriptionId = null, statusCode = 400) {
    super(message);
    this.name = 'PrescriptionError';
    this.code = code;
    this.prescriptionId = prescriptionId;
    this.statusCode = statusCode;
  }
}

class PrescriptionNotFoundError extends PrescriptionError {
  constructor(prescriptionId) {
    super('PRESCRIPTION_NOT_FOUND', 'Prescription not found', prescriptionId, 404);
  }
}

class UnauthorizedPrescriptionAccessError extends PrescriptionError {
  constructor(prescriptionId) {
    super('UNAUTHORIZED_PRESCRIPTION_ACCESS', 'Unauthorized prescription access', prescriptionId, 403);
  }
}

class PrescriptionAlreadyDispensedError extends PrescriptionError {
  constructor(prescriptionId) {
    super('PRESCRIPTION_ALREADY_DISPENSED', 'Prescription already dispensed', prescriptionId, 422);
  }
}

class PatientNotFoundError extends PrescriptionError {
  constructor(patientId) {
    super('PATIENT_NOT_FOUND', 'Patient not found', null, 404);
    this.patientId = patientId;
  }
}

class MedicineAlreadyDispensedError extends PrescriptionError {
  constructor(prescriptionId, medicineIndex) {
    super('MEDICINE_ALREADY_DISPENSED', 'Medicine already dispensed', prescriptionId, 422);
    this.medicineIndex = medicineIndex;
  }
}

module.exports = {
  prescriptionErrorHandler,
  PrescriptionError,
  PrescriptionNotFoundError,
  UnauthorizedPrescriptionAccessError,
  PrescriptionAlreadyDispensedError,
  PatientNotFoundError,
  MedicineAlreadyDispensedError
};