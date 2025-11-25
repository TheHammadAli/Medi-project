const AuditLog = require('../Model/AuditLog');

class AuditService {
  /**
   * Create a comprehensive audit log entry
   * @param {Object} logData - Audit log data
   * @returns {Promise<Object>} Created audit log
   */
  async createAuditLog(logData) {
    try {
      const {
        prescriptionId,
        action,
        userId,
        userType,
        userName,
        changes = {},
        previousValues = {},
        ipAddress = null,
        userAgent = null,
        sessionId = null,
        metadata = {}
      } = logData;

      // Validate required fields
      if (!prescriptionId || !action || !userId || !userType || !userName) {
        throw new Error('Missing required audit log fields');
      }

      // Validate action type
      const validActions = ['created', 'updated', 'deleted', 'viewed', 'downloaded', 'verified', 'dispensed', 'pdf_generated'];
      if (!validActions.includes(action)) {
        throw new Error(`Invalid action type: ${action}`);
      }

      // Validate user type
      const validUserTypes = ['doctor', 'patient', 'pharmacist', 'admin'];
      if (!validUserTypes.includes(userType)) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      const auditData = {
        prescriptionId,
        action,
        performedBy: {
          userId,
          userType,
          userName
        },
        changes: this.sanitizeChanges(changes),
        previousValues: this.sanitizeChanges(previousValues),
        ipAddress,
        userAgent,
        sessionId,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          source: 'AuditService'
        }
      };

      const auditLog = await AuditLog.createLog(auditData);
      return {
        success: true,
        data: auditLog
      };
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Return null instead of throwing to prevent breaking main operations
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get audit trail for a specific prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Audit trail data
   */
  async getAuditTrail(prescriptionId, options = {}) {
    try {
      const auditLogs = await AuditLog.getAuditTrail(prescriptionId, options);
      
      return {
        success: true,
        data: {
          prescriptionId,
          auditLogs,
          total: auditLogs.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get audit trail: ${error.message}`);
    }
  }

  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @param {string} userType - User type
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User activity data
   */
  async getUserActivity(userId, userType, options = {}) {
    try {
      const activities = await AuditLog.getUserActivity(userId, userType, options);
      
      return {
        success: true,
        data: {
          userId,
          userType,
          activities,
          total: activities.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user activity: ${error.message}`);
    }
  }

  /**
   * Get system activity statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Activity statistics
   */
  async getActivityStats(options = {}) {
    try {
      const stats = await AuditLog.getActivityStats(options);
      
      return {
        success: true,
        data: {
          statistics: stats,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Failed to get activity statistics: ${error.message}`);
    }
  }

  /**
   * Log prescription access for compliance
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} user - User accessing the prescription
   * @param {string} accessType - Type of access (view, download, etc.)
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Audit log result
   */
  async logPrescriptionAccess(prescriptionId, user, accessType, ipAddress = null, userAgent = null) {
    const logData = {
      prescriptionId,
      action: accessType,
      userId: user.id,
      userType: user.userType,
      userName: user.name,
      ipAddress,
      userAgent,
      metadata: {
        accessType,
        timestamp: new Date()
      }
    };

    return await this.createAuditLog(logData);
  }

  /**
   * Log prescription modification
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} user - User modifying the prescription
   * @param {string} action - Action performed (created, updated, deleted)
   * @param {Object} changes - Changes made
   * @param {Object} previousValues - Previous values
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Audit log result
   */
  async logPrescriptionModification(prescriptionId, user, action, changes, previousValues, ipAddress = null, userAgent = null) {
    const logData = {
      prescriptionId,
      action,
      userId: user.id,
      userType: user.userType,
      userName: user.name,
      changes,
      previousValues,
      ipAddress,
      userAgent,
      metadata: {
        modificationType: action,
        timestamp: new Date()
      }
    };

    return await this.createAuditLog(logData);
  }

  /**
   * Log prescription verification by pharmacist
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} pharmacist - Pharmacist user
   * @param {Object} verificationData - Verification details
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Audit log result
   */
  async logPrescriptionVerification(prescriptionId, pharmacist, verificationData, ipAddress = null, userAgent = null) {
    const logData = {
      prescriptionId,
      action: 'verified',
      userId: pharmacist.id,
      userType: 'pharmacist',
      userName: pharmacist.name,
      changes: verificationData,
      ipAddress,
      userAgent,
      metadata: {
        verificationTimestamp: new Date(),
        pharmacistLicense: pharmacist.licenseNumber
      }
    };

    return await this.createAuditLog(logData);
  }

  /**
   * Log medicine dispensing
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} pharmacist - Pharmacist user
   * @param {Array} dispensedMedicines - List of dispensed medicines
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Audit log result
   */
  async logMedicineDispensing(prescriptionId, pharmacist, dispensedMedicines, ipAddress = null, userAgent = null) {
    const now = new Date();
    const logData = {
      prescriptionId,
      action: 'dispensed',
      userId: pharmacist.id,
      userType: 'pharmacist',
      userName: pharmacist.name,
      changes: {
        dispensedMedicines,
        dispensedAt: now
      },
      ipAddress,
      userAgent,
      metadata: {
        dispensingTimestamp: now,
        pharmacistLicense: pharmacist.licenseNumber,
        medicineCount: dispensedMedicines.length
      }
    };

    return await this.createAuditLog(logData);
  }

  /**
   * Log PDF generation
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} user - User requesting PDF
   * @param {Object} pdfData - PDF generation details
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Audit log result
   */
  async logPDFGeneration(prescriptionId, user, pdfData, ipAddress = null, userAgent = null) {
    const now = new Date();
    const logData = {
      prescriptionId,
      action: 'pdf_generated',
      userId: user.id,
      userType: user.userType,
      userName: user.name,
      changes: {
        pdfUrl: pdfData.pdfUrl,
        generatedAt: now
      },
      ipAddress,
      userAgent,
      metadata: {
        pdfSize: pdfData.size,
        generationTimestamp: now
      }
    };

    return await this.createAuditLog(logData);
  }

  /**
   * Get compliance report for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Compliance report
   */
  async getComplianceReport(startDate, endDate, filters = {}) {
    try {
      const options = {
        startDate,
        endDate,
        ...filters
      };

      const stats = await AuditLog.getActivityStats(options);
      
      // Calculate compliance metrics
      const totalActions = stats.reduce((sum, stat) => sum + stat.totalCount, 0);
      const actionBreakdown = stats.map(stat => ({
        action: stat._id,
        count: stat.totalCount,
        percentage: totalActions > 0 ? ((stat.totalCount / totalActions) * 100).toFixed(2) : 0,
        userTypeBreakdown: stat.byUserType
      }));

      return {
        success: true,
        data: {
          reportPeriod: {
            startDate,
            endDate
          },
          summary: {
            totalActions,
            uniqueActions: stats.length
          },
          actionBreakdown,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate compliance report: ${error.message}`);
    }
  }

  /**
   * Sanitize changes object to remove sensitive data
   * @param {Object} changes - Changes object
   * @returns {Object} Sanitized changes
   */
  sanitizeChanges(changes) {
    if (!changes || typeof changes !== 'object') {
      return changes;
    }

    const sanitized = { ...changes };
    
    // Remove sensitive fields that shouldn't be logged
    const sensitiveFields = ['password', 'token', 'secret'];
    
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      // Don't sanitize Date objects
      if (obj instanceof Date) return obj;
      
      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Validate audit log data integrity
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<Object>} Validation result
   */
  async validateAuditIntegrity(prescriptionId) {
    try {
      const auditLogs = await AuditLog.find({ prescriptionId }).sort({ timestamp: 1 });
      
      const issues = [];
      let previousLog = null;

      for (const log of auditLogs) {
        // Check for required fields
        if (!log.performedBy.userId || !log.performedBy.userType || !log.action) {
          issues.push({
            logId: log._id,
            issue: 'Missing required fields',
            timestamp: log.timestamp
          });
        }

        // Check for logical sequence
        if (previousLog) {
          if (log.timestamp < previousLog.timestamp) {
            issues.push({
              logId: log._id,
              issue: 'Timestamp sequence violation',
              timestamp: log.timestamp
            });
          }
        }

        previousLog = log;
      }

      return {
        success: true,
        data: {
          prescriptionId,
          totalLogs: auditLogs.length,
          issues,
          isValid: issues.length === 0,
          validatedAt: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Failed to validate audit integrity: ${error.message}`);
    }
  }
}

module.exports = AuditService;