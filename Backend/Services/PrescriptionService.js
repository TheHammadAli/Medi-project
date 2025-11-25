const Prescription = require('../Model/Prescription');
const AuditLog = require('../Model/AuditLog');
const mongoose = require('mongoose');

class PrescriptionService {
  /**
   * Create a new prescription with validation and audit logging
   * @param {Object} prescriptionData - The prescription data
   * @param {Object} user - The user creating the prescription
   * @param {string} ipAddress - IP address for audit logging
   * @param {string} userAgent - User agent for audit logging
   * @returns {Promise<Object>} Created prescription
   */
  async createPrescription(prescriptionData, user, ipAddress = null, userAgent = null) {
    try {
      // Validate prescription data
      const validationResult = this.validatePrescriptionData(prescriptionData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Generate unique prescription number
      const prescriptionNumber = await this.generatePrescriptionNumber();
      
      // Create prescription with generated number
      const prescriptionWithNumber = {
        ...prescriptionData,
        prescriptionNumber
      };

      const prescription = new Prescription(prescriptionWithNumber);
      const savedPrescription = await prescription.save();

      // Create audit log
      await this.createAuditLog(
        'created',
        user.id,
        user.userType || 'doctor',
        user.name,
        savedPrescription._id,
        { prescriptionData: prescriptionWithNumber },
        {},
        ipAddress,
        userAgent
      );

      return {
        success: true,
        data: savedPrescription,
        message: 'Prescription created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create prescription: ${error.message}`);
    }
  }

  /**
   * Update an existing prescription with validation and audit logging
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} updateData - The data to update
   * @param {Object} user - The user updating the prescription
   * @param {string} ipAddress - IP address for audit logging
   * @param {string} userAgent - User agent for audit logging
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePrescription(prescriptionId, updateData, user, ipAddress = null, userAgent = null) {
    try {
      // Find existing prescription
      const existingPrescription = await Prescription.findById(prescriptionId);
      if (!existingPrescription) {
        throw new Error('Prescription not found');
      }

      // Check if prescription can be modified
      if (!existingPrescription.canBeModified()) {
        throw new Error('Prescription cannot be modified - it has been dispensed or deleted');
      }

      // Validate update data
      const validationResult = this.validatePrescriptionData(updateData, true);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Store previous values for audit
      const previousValues = existingPrescription.toObject();

      // Update prescription
      Object.assign(existingPrescription, updateData);
      const updatedPrescription = await existingPrescription.save();

      // Create audit log
      await this.createAuditLog(
        'updated',
        user.id,
        user.userType || 'doctor',
        user.name,
        prescriptionId,
        updateData,
        previousValues,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        data: updatedPrescription,
        message: 'Prescription updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update prescription: ${error.message}`);
    }
  }

  /**
   * Soft delete a prescription with audit logging
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} user - The user deleting the prescription
   * @param {string} ipAddress - IP address for audit logging
   * @param {string} userAgent - User agent for audit logging
   * @returns {Promise<Object>} Result of deletion
   */
  async deletePrescription(prescriptionId, user, ipAddress = null, userAgent = null) {
    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Check if prescription can be deleted
      if (prescription.status === 'dispensed') {
        throw new Error('Cannot delete dispensed prescription');
      }

      // Soft delete
      prescription.isDeleted = true;
      prescription.deletedAt = new Date();
      await prescription.save();

      // Create audit log
      await this.createAuditLog(
        'deleted',
        user.id,
        user.userType || 'doctor',
        user.name,
        prescriptionId,
        { isDeleted: true, deletedAt: prescription.deletedAt },
        {},
        ipAddress,
        userAgent
      );

      return {
        success: true,
        message: 'Prescription deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete prescription: ${error.message}`);
    }
  }

  /**
   * Get prescriptions based on user role and filters
   * @param {Object} user - The user requesting prescriptions
   * @param {Object} filters - Filters to apply
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Object>} Prescriptions data
   */
  async getPrescriptions(user, filters = {}, options = {}) {
    try {
      let query = { isDeleted: false };

      // Apply role-based filtering
      if (user.userType === 'doctor') {
        query['doctor.id'] = user.id;
      } else if (user.userType === 'patient') {
        query['patient.id'] = user.id;
      }

      // Apply additional filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.patientId && user.userType === 'doctor') {
        query['patient.id'] = filters.patientId;
      }
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      // Set default options
      const limit = options.limit || 50;
      const skip = options.skip || 0;
      const sort = options.sort || { createdAt: -1 };

      const prescriptions = await Prescription.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('patient.id', 'name email phone')
        .populate('doctor.id', 'name specialization');

      const total = await Prescription.countDocuments(query);

      return {
        success: true,
        data: {
          prescriptions,
          pagination: {
            total,
            limit,
            skip,
            hasMore: skip + prescriptions.length < total
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to get prescriptions: ${error.message}`);
    }
  }

  /**
   * Validate prescription data
   * @param {Object} data - Prescription data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validatePrescriptionData(data, isUpdate = false) {
    const errors = [];

    // Required fields for new prescriptions
    if (!isUpdate) {
      if (!data.doctor || !data.doctor.id) {
        errors.push('Doctor information is required');
      }
      if (!data.patient || !data.patient.id) {
        errors.push('Patient information is required');
      }
    }

    // Validate doctor information
    if (data.doctor) {
      if (!data.doctor.name) {
        errors.push('Doctor name is required');
      }
      if (!data.doctor.specialization) {
        errors.push('Doctor specialization is required');
      }
    }

    // Validate patient information
    if (data.patient) {
      if (!data.patient.name) {
        errors.push('Patient name is required');
      }
      if (data.patient.age !== undefined) {
        if (!Number.isInteger(data.patient.age) || data.patient.age <= 0 || data.patient.age > 150) {
          errors.push('Patient age must be a valid number between 1 and 150');
        }
      }
      if (data.patient.gender && !['Male', 'Female', 'Other'].includes(data.patient.gender)) {
        errors.push('Patient gender must be Male, Female, or Other');
      }
    }

    // Validate medicines
    if (data.medicines) {
      if (!Array.isArray(data.medicines) || data.medicines.length === 0) {
        errors.push('At least one medicine is required');
      } else {
        data.medicines.forEach((medicine, index) => {
          const medicineErrors = this.validateMedicineData(medicine);
          if (medicineErrors.length > 0) {
            errors.push(`Medicine ${index + 1}: ${medicineErrors.join(', ')}`);
          }
        });
      }
    }

    // Validate status
    if (data.status && !['active', 'completed', 'dispensed', 'cancelled'].includes(data.status)) {
      errors.push('Invalid prescription status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate individual medicine data
   * @param {Object} medicine - Medicine data to validate
   * @returns {Array} Array of validation errors
   */
  validateMedicineData(medicine) {
    const errors = [];

    if (!medicine.name || medicine.name.trim().length === 0) {
      errors.push('Medicine name is required');
    }
    if (!medicine.dosage || medicine.dosage.trim().length === 0) {
      errors.push('Medicine dosage is required');
    }
    if (!medicine.frequency || medicine.frequency.trim().length === 0) {
      errors.push('Medicine frequency is required');
    }
    if (!medicine.duration || medicine.duration.trim().length === 0) {
      errors.push('Medicine duration is required');
    }

    return errors;
  }

  /**
   * Generate unique prescription number
   * @returns {Promise<string>} Unique prescription number
   */
  async generatePrescriptionNumber() {
    let isUnique = false;
    let prescriptionNumber;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate prescription number with timestamp and random component
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      prescriptionNumber = `RX-${timestamp}-${random}`;

      // Check if number already exists
      const existing = await Prescription.findOne({ 
        prescriptionNumber,
        isDeleted: false 
      });
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique prescription number after multiple attempts');
    }

    return prescriptionNumber;
  }

  /**
   * Create audit log entry
   * @param {string} action - Action performed
   * @param {string} userId - User ID
   * @param {string} userType - User type
   * @param {string} userName - User name
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} changes - Changes made
   * @param {Object} previousValues - Previous values
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Audit log entry
   */
  async createAuditLog(action, userId, userType, userName, prescriptionId, changes = {}, previousValues = {}, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        prescriptionId,
        action,
        performedBy: {
          userId,
          userType,
          userName
        },
        changes,
        previousValues,
        ipAddress,
        userAgent,
        metadata: {
          timestamp: new Date(),
          source: 'PrescriptionService'
        }
      };

      return await AuditLog.createLog(auditData);
    } catch (error) {
      // Log error but don't throw to prevent breaking main operations
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  /**
   * Check if user is authorized to access prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} user - User object
   * @returns {Promise<boolean>} Authorization result
   */
  async checkUserAuthorization(prescriptionId, user) {
    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription || prescription.isDeleted) {
        return false;
      }

      // Admin can access all prescriptions
      if (user.userType === 'admin') {
        return true;
      }

      // Doctor can access their own prescriptions
      if (user.userType === 'doctor' && prescription.doctor.id.toString() === user.id.toString()) {
        return true;
      }

      // Patient can access their own prescriptions
      if (user.userType === 'patient' && prescription.patient.id.toString() === user.id.toString()) {
        return true;
      }

      // Pharmacist can access prescriptions for verification
      if (user.userType === 'pharmacist') {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Authorization check failed:', error);
      return false;
    }
  }

  /**
   * Get prescription by ID with authorization check
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} user - User object
   * @param {string} ipAddress - IP address for audit logging
   * @param {string} userAgent - User agent for audit logging
   * @returns {Promise<Object>} Prescription data
   */
  async getPrescriptionById(prescriptionId, user, ipAddress = null, userAgent = null) {
    try {
      // Check authorization
      const isAuthorized = await this.checkUserAuthorization(prescriptionId, user);
      if (!isAuthorized) {
        throw new Error('Unauthorized access to prescription');
      }

      const prescription = await Prescription.findById(prescriptionId)
        .populate('patient.id', 'name email phone')
        .populate('doctor.id', 'name specialization');

      if (!prescription || prescription.isDeleted) {
        throw new Error('Prescription not found');
      }

      // Create audit log for viewing
      await this.createAuditLog(
        'viewed',
        user.id,
        user.userType,
        user.name,
        prescriptionId,
        {},
        {},
        ipAddress,
        userAgent
      );

      return {
        success: true,
        data: prescription
      };
    } catch (error) {
      throw new Error(`Failed to get prescription: ${error.message}`);
    }
  }

  /**
   * Update prescription status
   * @param {string} prescriptionId - Prescription ID
   * @param {string} newStatus - New status
   * @param {Object} user - User object
   * @param {string} ipAddress - IP address for audit logging
   * @param {string} userAgent - User agent for audit logging
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePrescriptionStatus(prescriptionId, newStatus, user, ipAddress = null, userAgent = null) {
    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription || prescription.isDeleted) {
        throw new Error('Prescription not found');
      }

      const previousStatus = prescription.status;
      prescription.status = newStatus;
      
      // Update dispensing information if status is dispensed
      if (newStatus === 'dispensed') {
        prescription.verifiedBy = user.id;
        prescription.verifiedAt = new Date();
      }

      await prescription.save();

      // Create audit log
      await this.createAuditLog(
        'updated',
        user.id,
        user.userType,
        user.name,
        prescriptionId,
        { status: newStatus },
        { status: previousStatus },
        ipAddress,
        userAgent
      );

      return {
        success: true,
        data: prescription,
        message: `Prescription status updated to ${newStatus}`
      };
    } catch (error) {
      throw new Error(`Failed to update prescription status: ${error.message}`);
    }
  }
}

module.exports = PrescriptionService;