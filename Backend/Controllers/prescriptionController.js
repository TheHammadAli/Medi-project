const Prescription = require("../Model/Prescription");
const Patient = require("../Model/Patient");
const PatientProfile = require("../Model/PatientProfile");
const Doctor = require("../Model/Doctor");
const DocProfile = require("../Model/DocProfile");
const Pharmacist = require("../Model/Pharmacist");
const PrescriptionService = require("../Services/PrescriptionService");
const AuditService = require("../Services/AuditService");
const PDFService = require("../Services/PDFService");
const {
  PrescriptionNotFoundError,
  UnauthorizedPrescriptionAccessError,
  PrescriptionAlreadyDispensedError,
  PatientNotFoundError,
  MedicineAlreadyDispensedError
} = require("../Middleware/prescriptionErrorHandler");

// Create a new prescription
const createPrescription = async (req, res, next) => {
  try {
    // Handle both frontend (patientId, diagnosis, notes) and direct API formats
    const { patientId, patient, medicines, diagnosis, notes, additionalNotes, labTests, followUpInstructions } = req.body;
    const doctorId = req.user.id;

    let patientData = patient;

    // If frontend format (patientId provided), fetch patient details
    if (patientId && !patient) {
      const patientRecord = await Patient.findById(patientId);
      if (!patientRecord) {
        throw new PatientNotFoundError(patientId);
      }

      // Get patient profile for additional details if available
      const patientProfile = await PatientProfile.findOne({ patientRefId: patientId });

      patientData = {
        id: patientId,
        name: patientProfile?.name || patientRecord.username || 'Unknown Patient',
        age: patientProfile?.age || 25, // Default age if not available
        gender: patientProfile?.gender || 'Other', // Default gender if not available
        patientId: patientRecord.patientId || patientId,
        appointmentRef: null // Will be set if provided in appointment context
      };
    } else if (patient) {
      // Direct API format - verify patient exists
      const patientRecord = await Patient.findById(patient.id);
      if (!patientRecord) {
        throw new PatientNotFoundError(patient.id);
      }
    }

    // Get doctor profile information
    const doctorProfile = await DocProfile.findOne({ doctorRefId: doctorId });
    const doctorRecord = await Doctor.findById(doctorId);

    // Generate unique prescription number
    const prescriptionService = new PrescriptionService();
    const prescriptionNumber = await prescriptionService.generatePrescriptionNumber();

    // Create prescription data with field mapping
    const prescriptionData = {
      prescriptionNumber,
      doctor: {
        id: doctorId,
        name: doctorProfile?.name || doctorRecord.username,
        specialization: doctorProfile?.speciality || doctorRecord.specialization,
        licenseNumber: doctorRecord.licenseNumber || 'N/A',
        contact: {
          phone: doctorProfile?.phone || '',
          email: doctorRecord.email
        }
      },
      patient: {
        id: patientData.id,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        patientId: patientData.patientId || patientData.id,
        appointmentRef: patientData.appointmentRef || null
      },
      medicines: medicines.map(medicine => ({
        name: medicine.name.trim(),
        dosage: medicine.dosage.trim(),
        frequency: medicine.frequency?.trim() || 'As directed', // Default frequency if not provided
        duration: medicine.duration.trim(),
        instructions: medicine.instructions?.trim() || '',
        dispensed: false
      })),
      additionalNotes: (diagnosis || additionalNotes || '')?.trim() || '',
      labTests: labTests || [],
      followUpInstructions: (notes || followUpInstructions || '')?.trim() || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate prescription data
    const validationResult = prescriptionService.validatePrescriptionData(prescriptionData);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Prescription validation failed',
          details: validationResult.errors
        }
      });
    }

    // Create prescription
    const prescription = await Prescription.create(prescriptionData);

    // Create audit log
    const auditService = new AuditService();
    await auditService.createAuditLog({
      prescriptionId: prescription._id,
      action: 'created',
      userId: doctorId,
      userType: 'doctor',
      userName: doctorRecord.username,
      changes: { created: prescriptionData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Prescription created successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get prescriptions based on user role
const getPrescriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const { patientId } = req.params; // Extract patientId from params
    const userId = req.user.id;
    const userType = req.userType;

    let query = { isDeleted: false };
    let populateOptions = [];

    // Build query based on user role
    switch (userType) {
      case 'doctor':
        query['doctor.id'] = userId;
        populateOptions = [{ path: 'patient.id', select: 'username email' }];
        break;
      case 'patient':
        // Patients can only see their own prescriptions
        query['patient.id'] = userId;
        populateOptions = [{ path: 'doctor.id', select: 'username email specialization' }];
        break;
      case 'pharmacist':
        // Pharmacists can see all prescriptions for verification
        break;
      default:
        throw new UnauthorizedPrescriptionAccessError();
    }

    // Add status filter if provided
    if (status && ['active', 'completed', 'dispensed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: populateOptions
    };

    const prescriptions = await Prescription.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Prescription.countDocuments(query);

    // Note: Audit logging for prescription list views is not required
    // since it doesn't relate to a specific prescription. Individual prescription
    // operations (view, update, delete) are still logged for compliance.

    res.status(200).json({
      success: true,
      data: prescriptions,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalItems: total,
        itemsPerPage: options.limit
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get a specific prescription by ID
const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.userType;

    const prescription = await Prescription.findOne({ 
      _id: id, 
      isDeleted: false 
    });

    if (!prescription) {
      throw new PrescriptionNotFoundError(id);
    }

    // Check authorization based on user role
    const hasAccess = PrescriptionService.checkUserAccess(prescription, userId, userType);
    if (!hasAccess) {
      throw new UnauthorizedPrescriptionAccessError(id);
    }

    // Create audit log
    const auditService = new AuditService();
    await auditService.createAuditLog({
      prescriptionId: id,
      action: 'viewed',
      performedBy: {
        userId: userId,
        userType: userType,
        userName: req.user.username
      },
      changes: { prescriptionId: id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    next(error);
  }
};

// Update a prescription
const updatePrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Handle both frontend (diagnosis, notes) and direct API formats
    const { medicines, diagnosis, notes, additionalNotes, labTests, followUpInstructions, status } = req.body;
    const userId = req.user.id;
    const userType = req.userType;

    const prescription = await Prescription.findOne({ 
      _id: id, 
      isDeleted: false 
    });

    if (!prescription) {
      throw new PrescriptionNotFoundError(id);
    }

    // Only doctors can update their own prescriptions
    if (userType !== 'doctor' || prescription.doctor.id.toString() !== userId) {
      throw new UnauthorizedPrescriptionAccessError(id);
    }

    // Check if prescription is already dispensed
    if (prescription.status === 'dispensed') {
      throw new PrescriptionAlreadyDispensedError(id);
    }

    // Store original data for audit
    const originalData = prescription.toObject();

    // Update fields
    const updates = {};
    if (medicines) {
      updates.medicines = medicines.map(medicine => ({
        name: medicine.name.trim(),
        dosage: medicine.dosage.trim(),
        frequency: medicine.frequency?.trim() || 'As directed', // Default frequency if not provided
        duration: medicine.duration.trim(),
        instructions: medicine.instructions?.trim() || '',
        dispensed: medicine.dispensed || false,
        dispensedAt: medicine.dispensedAt || null,
        dispensedBy: medicine.dispensedBy || null
      }));
    }
    // Handle field mapping for frontend compatibility
    if (diagnosis !== undefined) updates.additionalNotes = diagnosis.trim();
    if (notes !== undefined) updates.followUpInstructions = notes.trim();
    if (additionalNotes !== undefined) updates.additionalNotes = additionalNotes.trim();
    if (labTests) updates.labTests = labTests;
    if (followUpInstructions !== undefined) updates.followUpInstructions = followUpInstructions.trim();
    if (status) updates.status = status;
    updates.updatedAt = new Date();
    updates.version = prescription.version + 1;

    // Validate updated data
    const updatedData = { ...prescription.toObject(), ...updates };
    const validationResult = PrescriptionService.validatePrescriptionData(updatedData);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Prescription validation failed',
          details: validationResult.errors
        }
      });
    }

    // Update prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    // Create audit log
    const auditService = new AuditService();
    await auditService.createAuditLog({
      prescriptionId: id,
      action: 'updated',
      performedBy: {
        userId: userId,
        userType: userType,
        userName: req.user.username
      },
      changes: {
        before: originalData,
        after: updatedPrescription.toObject(),
        updates: updates
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      data: updatedPrescription,
      message: 'Prescription updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Soft delete a prescription
const deletePrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.userType;

    const prescription = await Prescription.findOne({ 
      _id: id, 
      isDeleted: false 
    });

    if (!prescription) {
      throw new PrescriptionNotFoundError(id);
    }

    // Only doctors can delete their own prescriptions
    if (userType !== 'doctor' || prescription.doctor.id.toString() !== userId) {
      throw new UnauthorizedPrescriptionAccessError(id);
    }

    // Check if prescription is already dispensed
    if (prescription.status === 'dispensed') {
      throw new PrescriptionAlreadyDispensedError(id);
    }

    // Soft delete
    const deletedPrescription = await Prescription.findByIdAndUpdate(
      id,
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        status: 'cancelled'
      },
      { new: true }
    );

    // Create audit log
    const auditService = new AuditService();
    await auditService.createAuditLog({
      prescriptionId: id,
      action: 'deleted',
      performedBy: {
        userId: userId,
        userType: userType,
        userName: req.user.username
      },
      changes: { deleted: true, deletedAt: new Date() },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      data: deletedPrescription,
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Verify prescription (for pharmacists)
const verifyPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prescriptionNumber } = req.body;
    const userId = req.user.id;
    const userType = req.userType;

    // Only pharmacists can verify prescriptions
    if (userType !== 'pharmacist') {
      throw new UnauthorizedPrescriptionAccessError(id);
    }

    let query = { isDeleted: false };
    
    // Search by ID or prescription number
    if (id && id !== 'verify') {
      query._id = id;
    } else if (prescriptionNumber) {
      query.prescriptionNumber = prescriptionNumber;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IDENTIFIER',
          message: 'Prescription ID or prescription number is required'
        }
      });
    }

    const prescription = await Prescription.findOne(query);

    if (!prescription) {
      throw new PrescriptionNotFoundError(id || prescriptionNumber);
    }

    // Update verification status
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescription._id,
      {
        verifiedBy: userId,
        verifiedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    // Create audit log
    const auditService = new AuditService();
    await auditService.createAuditLog({
      prescriptionId: prescription._id,
      action: 'verified',
      performedBy: {
        userId: userId,
        userType: userType,
        userName: req.user.username
      },
      changes: {
        verifiedBy: userId,
        verifiedAt: new Date(),
        prescriptionNumber: prescription.prescriptionNumber
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      data: updatedPrescription,
      message: 'Prescription verified successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Mark medicine as dispensed (for pharmacists)
const dispenseMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { medicineIndex, pharmacistNotes } = req.body;
    const userId = req.user.id;
    const userType = req.userType;

    // Only pharmacists can dispense medicines
    if (userType !== 'pharmacist') {
      throw new UnauthorizedPrescriptionAccessError(id);
    }

    const prescription = await Prescription.findOne({ 
      _id: id, 
      isDeleted: false 
    });

    if (!prescription) {
      throw new PrescriptionNotFoundError(id);
    }

    // Check if medicine index is valid
    if (medicineIndex >= prescription.medicines.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEDICINE_INDEX',
          message: 'Invalid medicine index'
        }
      });
    }

    // Check if medicine is already dispensed
    if (prescription.medicines[medicineIndex].dispensed) {
      throw new MedicineAlreadyDispensedError(id, medicineIndex);
    }

    // Mark medicine as dispensed
    prescription.medicines[medicineIndex].dispensed = true;
    prescription.medicines[medicineIndex].dispensedAt = new Date();
    prescription.medicines[medicineIndex].dispensedBy = userId;
    if (pharmacistNotes) {
      prescription.medicines[medicineIndex].pharmacistNotes = pharmacistNotes.trim();
    }

    // Check if all medicines are dispensed
    const allDispensed = prescription.medicines.every(medicine => medicine.dispensed);
    if (allDispensed) {
      prescription.status = 'dispensed';
    }

    prescription.updatedAt = new Date();
    await prescription.save();

    // Create audit log
    const auditService = new AuditService();
    await auditService.createAuditLog({
      prescriptionId: id,
      action: 'dispensed',
      performedBy: {
        userId: userId,
        userType: userType,
        userName: req.user.username
      },
      changes: {
        medicineIndex,
        medicineName: prescription.medicines[medicineIndex].name,
        dispensedAt: new Date(),
        pharmacistNotes,
        allDispensed
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      data: prescription,
      message: `Medicine dispensed successfully${allDispensed ? '. All medicines have been dispensed.' : ''}`
    });

  } catch (error) {
    next(error);
  }
};

// Get audit trail for a prescription
const getPrescriptionAudit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.userType;

    const prescription = await Prescription.findOne({ 
      _id: id, 
      isDeleted: false 
    });

    if (!prescription) {
      throw new PrescriptionNotFoundError(id);
    }

    // Check authorization
    const hasAccess = PrescriptionService.checkUserAccess(prescription, userId, userType);
    if (!hasAccess && userType !== 'pharmacist') {
      throw new UnauthorizedPrescriptionAccessError(id);
    }

    // Get audit logs
    const auditService = new AuditService();
    const auditLogs = await auditService.getAuditTrail(id);

    res.status(200).json({
      success: true,
      data: auditLogs
    });

  } catch (error) {
    next(error);
  }
};

// Generate PDF for prescription
const generatePrescriptionPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.userType;

    const prescription = await Prescription.findOne({
      _id: id,
      isDeleted: false
    });

    if (!prescription) {
      throw new PrescriptionNotFoundError(id);
    }

    // Check authorization based on user role
    const hasAccess = PrescriptionService.checkUserAccess(prescription, userId, userType);
    if (!hasAccess) {
      throw new UnauthorizedPrescriptionAccessError(id);
    }

    // Initialize PDF service
    const pdfService = new PDFService();

    // Generate PDF data
    const pdfData = await pdfService.generatePrescriptionPDF(prescription);

    // Create audit log for PDF generation
    const auditService = new AuditService();
    await auditService.createAuditLog({
      prescriptionId: id,
      action: 'pdf_generated',
      performedBy: {
        userId: userId,
        userType: userType,
        userName: req.user.username
      },
      changes: {
        pdfGenerated: true,
        fileName: pdfData.fileName,
        fileSize: pdfData.size
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfData.fileName}"`);
    res.setHeader('Content-Length', pdfData.size);

    // Send PDF buffer
    res.send(pdfData.buffer);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  verifyPrescription,
  dispenseMedicine,
  getPrescriptionAudit,
  generatePrescriptionPDF
};