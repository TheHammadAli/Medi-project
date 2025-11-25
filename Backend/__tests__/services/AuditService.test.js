const AuditService = require('../../Services/AuditService');
const AuditLog = require('../../Model/AuditLog');
const mongoose = require('mongoose');

// Mock the AuditLog model
jest.mock('../../Model/AuditLog');

describe('AuditService', () => {
  let auditService;
  let mockLogData;

  beforeEach(() => {
    auditService = new AuditService();
    
    mockLogData = {
      prescriptionId: new mongoose.Types.ObjectId(),
      action: 'created',
      userId: new mongoose.Types.ObjectId(),
      userType: 'doctor',
      userName: 'Dr. John Smith',
      changes: { status: 'active' },
      previousValues: {},
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      sessionId: 'session123'
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create audit log successfully', async () => {
      const mockAuditLog = { _id: new mongoose.Types.ObjectId(), ...mockLogData };
      AuditLog.createLog = jest.fn().mockResolvedValue(mockAuditLog);

      const result = await auditService.createAuditLog(mockLogData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuditLog);
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          prescriptionId: mockLogData.prescriptionId,
          action: mockLogData.action,
          performedBy: {
            userId: mockLogData.userId,
            userType: mockLogData.userType,
            userName: mockLogData.userName
          },
          changes: mockLogData.changes,
          previousValues: mockLogData.previousValues,
          ipAddress: mockLogData.ipAddress,
          userAgent: mockLogData.userAgent,
          sessionId: mockLogData.sessionId,
          metadata: expect.objectContaining({
            timestamp: expect.any(Date),
            source: 'AuditService'
          })
        })
      );
    });

    it('should return error for missing required fields', async () => {
      const invalidLogData = {
        prescriptionId: new mongoose.Types.ObjectId(),
        // Missing action, userId, userType, userName
      };

      const result = await auditService.createAuditLog(invalidLogData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required audit log fields');
      expect(AuditLog.createLog).not.toHaveBeenCalled();
    });

    it('should return error for invalid action type', async () => {
      const invalidLogData = {
        ...mockLogData,
        action: 'invalid_action'
      };

      const result = await auditService.createAuditLog(invalidLogData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid action type: invalid_action');
      expect(AuditLog.createLog).not.toHaveBeenCalled();
    });

    it('should return error for invalid user type', async () => {
      const invalidLogData = {
        ...mockLogData,
        userType: 'invalid_user_type'
      };

      const result = await auditService.createAuditLog(invalidLogData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid user type: invalid_user_type');
      expect(AuditLog.createLog).not.toHaveBeenCalled();
    });

    it('should handle AuditLog.createLog failure gracefully', async () => {
      AuditLog.createLog = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await auditService.createAuditLog(mockLogData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('getAuditTrail', () => {
    it('should get audit trail successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockAuditLogs = [
        { _id: new mongoose.Types.ObjectId(), action: 'created' },
        { _id: new mongoose.Types.ObjectId(), action: 'updated' }
      ];

      AuditLog.getAuditTrail = jest.fn().mockResolvedValue(mockAuditLogs);

      const result = await auditService.getAuditTrail(prescriptionId);

      expect(result.success).toBe(true);
      expect(result.data.prescriptionId).toEqual(prescriptionId);
      expect(result.data.auditLogs).toEqual(mockAuditLogs);
      expect(result.data.total).toBe(2);
      expect(AuditLog.getAuditTrail).toHaveBeenCalledWith(prescriptionId, {});
    });

    it('should pass options to getAuditTrail', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const options = { action: 'updated', limit: 10 };

      AuditLog.getAuditTrail = jest.fn().mockResolvedValue([]);

      await auditService.getAuditTrail(prescriptionId, options);

      expect(AuditLog.getAuditTrail).toHaveBeenCalledWith(prescriptionId, options);
    });

    it('should throw error on failure', async () => {
      AuditLog.getAuditTrail = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        auditService.getAuditTrail(new mongoose.Types.ObjectId())
      ).rejects.toThrow('Failed to get audit trail: Database error');
    });
  });

  describe('getUserActivity', () => {
    it('should get user activity successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const userType = 'doctor';
      const mockActivities = [
        { _id: new mongoose.Types.ObjectId(), action: 'created' }
      ];

      AuditLog.getUserActivity = jest.fn().mockResolvedValue(mockActivities);

      const result = await auditService.getUserActivity(userId, userType);

      expect(result.success).toBe(true);
      expect(result.data.userId).toEqual(userId);
      expect(result.data.userType).toBe(userType);
      expect(result.data.activities).toEqual(mockActivities);
      expect(result.data.total).toBe(1);
      expect(AuditLog.getUserActivity).toHaveBeenCalledWith(userId, userType, {});
    });

    it('should throw error on failure', async () => {
      AuditLog.getUserActivity = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        auditService.getUserActivity(new mongoose.Types.ObjectId(), 'doctor')
      ).rejects.toThrow('Failed to get user activity: Database error');
    });
  });

  describe('getActivityStats', () => {
    it('should get activity statistics successfully', async () => {
      const mockStats = [
        { _id: 'created', totalCount: 10 },
        { _id: 'updated', totalCount: 5 }
      ];

      AuditLog.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      const result = await auditService.getActivityStats();

      expect(result.success).toBe(true);
      expect(result.data.statistics).toEqual(mockStats);
      expect(result.data.generatedAt).toBeInstanceOf(Date);
      expect(AuditLog.getActivityStats).toHaveBeenCalledWith({});
    });

    it('should throw error on failure', async () => {
      AuditLog.getActivityStats = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        auditService.getActivityStats()
      ).rejects.toThrow('Failed to get activity statistics: Database error');
    });
  });

  describe('logPrescriptionAccess', () => {
    it('should log prescription access successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const user = {
        id: new mongoose.Types.ObjectId(),
        userType: 'patient',
        name: 'Jane Doe'
      };
      const accessType = 'viewed';

      const mockAuditLog = { _id: new mongoose.Types.ObjectId() };
      AuditLog.createLog = jest.fn().mockResolvedValue(mockAuditLog);

      const result = await auditService.logPrescriptionAccess(
        prescriptionId,
        user,
        accessType,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(true);
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          prescriptionId,
          action: accessType,
          performedBy: {
            userId: user.id,
            userType: user.userType,
            userName: user.name
          },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          metadata: expect.objectContaining({
            accessType,
            timestamp: expect.any(Date)
          })
        })
      );
    });
  });

  describe('logPrescriptionModification', () => {
    it('should log prescription modification successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const user = {
        id: new mongoose.Types.ObjectId(),
        userType: 'doctor',
        name: 'Dr. Smith'
      };
      const action = 'updated';
      const changes = { status: 'completed' };
      const previousValues = { status: 'active' };

      const mockAuditLog = { _id: new mongoose.Types.ObjectId() };
      AuditLog.createLog = jest.fn().mockResolvedValue(mockAuditLog);

      const result = await auditService.logPrescriptionModification(
        prescriptionId,
        user,
        action,
        changes,
        previousValues
      );

      expect(result.success).toBe(true);
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          prescriptionId,
          action,
          performedBy: {
            userId: user.id,
            userType: user.userType,
            userName: user.name
          },
          changes,
          previousValues,
          metadata: expect.objectContaining({
            modificationType: action,
            timestamp: expect.any(Date)
          })
        })
      );
    });
  });

  describe('logPrescriptionVerification', () => {
    it('should log prescription verification successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const pharmacist = {
        id: new mongoose.Types.ObjectId(),
        name: 'Pharmacist John',
        licenseNumber: 'PHARM123'
      };
      const verificationData = { verified: true, notes: 'All good' };

      const mockAuditLog = { _id: new mongoose.Types.ObjectId() };
      AuditLog.createLog = jest.fn().mockResolvedValue(mockAuditLog);

      const result = await auditService.logPrescriptionVerification(
        prescriptionId,
        pharmacist,
        verificationData
      );

      expect(result.success).toBe(true);
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          prescriptionId,
          action: 'verified',
          performedBy: {
            userId: pharmacist.id,
            userType: 'pharmacist',
            userName: pharmacist.name
          },
          changes: verificationData,
          metadata: expect.objectContaining({
            verificationTimestamp: expect.any(Date),
            pharmacistLicense: pharmacist.licenseNumber
          })
        })
      );
    });
  });

  describe('logMedicineDispensing', () => {
    it('should log medicine dispensing successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const pharmacist = {
        id: new mongoose.Types.ObjectId(),
        name: 'Pharmacist Jane',
        licenseNumber: 'PHARM456'
      };
      const dispensedMedicines = [
        { name: 'Aspirin', quantity: 30 },
        { name: 'Vitamin D', quantity: 60 }
      ];

      const mockAuditLog = { _id: new mongoose.Types.ObjectId() };
      AuditLog.createLog = jest.fn().mockResolvedValue(mockAuditLog);

      const result = await auditService.logMedicineDispensing(
        prescriptionId,
        pharmacist,
        dispensedMedicines
      );

      expect(result.success).toBe(true);
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          prescriptionId,
          action: 'dispensed',
          performedBy: {
            userId: pharmacist.id,
            userType: 'pharmacist',
            userName: pharmacist.name
          },
          changes: expect.objectContaining({
            dispensedMedicines,
            dispensedAt: expect.any(Date)
          }),
          metadata: expect.objectContaining({
            dispensingTimestamp: expect.any(Date),
            pharmacistLicense: pharmacist.licenseNumber,
            medicineCount: 2
          })
        })
      );
    });
  });

  describe('logPDFGeneration', () => {
    it('should log PDF generation successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const user = {
        id: new mongoose.Types.ObjectId(),
        userType: 'doctor',
        name: 'Dr. Smith'
      };
      const pdfData = {
        pdfUrl: '/pdfs/prescription-123.pdf',
        size: 1024
      };

      const mockAuditLog = { _id: new mongoose.Types.ObjectId() };
      AuditLog.createLog = jest.fn().mockResolvedValue(mockAuditLog);

      const result = await auditService.logPDFGeneration(
        prescriptionId,
        user,
        pdfData
      );

      expect(result.success).toBe(true);
      expect(AuditLog.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          prescriptionId,
          action: 'pdf_generated',
          performedBy: {
            userId: user.id,
            userType: user.userType,
            userName: user.name
          },
          changes: expect.objectContaining({
            pdfUrl: pdfData.pdfUrl,
            generatedAt: expect.any(Date)
          }),
          metadata: expect.objectContaining({
            pdfSize: pdfData.size,
            generationTimestamp: expect.any(Date)
          })
        })
      );
    });
  });

  describe('getComplianceReport', () => {
    it('should generate compliance report successfully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockStats = [
        {
          _id: 'created',
          totalCount: 100,
          byUserType: [
            { userType: 'doctor', count: 80 },
            { userType: 'admin', count: 20 }
          ]
        },
        {
          _id: 'updated',
          totalCount: 50,
          byUserType: [
            { userType: 'doctor', count: 50 }
          ]
        }
      ];

      AuditLog.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      const result = await auditService.getComplianceReport(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data.reportPeriod.startDate).toEqual(startDate);
      expect(result.data.reportPeriod.endDate).toEqual(endDate);
      expect(result.data.summary.totalActions).toBe(150);
      expect(result.data.summary.uniqueActions).toBe(2);
      expect(result.data.actionBreakdown).toHaveLength(2);
      expect(result.data.actionBreakdown[0]).toEqual({
        action: 'created',
        count: 100,
        percentage: '66.67',
        userTypeBreakdown: mockStats[0].byUserType
      });
    });

    it('should handle empty statistics', async () => {
      AuditLog.getActivityStats = jest.fn().mockResolvedValue([]);

      const result = await auditService.getComplianceReport(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.success).toBe(true);
      expect(result.data.summary.totalActions).toBe(0);
      expect(result.data.summary.uniqueActions).toBe(0);
      expect(result.data.actionBreakdown).toHaveLength(0);
    });
  });

  describe('sanitizeChanges', () => {
    it('should sanitize sensitive fields', () => {
      const changes = {
        name: 'John Doe',
        password: 'secret123',
        token: 'abc123',
        nested: {
          key: 'value',
          secret: 'hidden'
        },
        array: [
          { name: 'item1', password: 'pass1' },
          { name: 'item2', key: 'value2' }
        ]
      };

      const sanitized = auditService.sanitizeChanges(changes);

      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.nested.key).toBe('value');
      expect(sanitized.nested.secret).toBe('[REDACTED]');
      expect(sanitized.array[0].name).toBe('item1');
      expect(sanitized.array[0].password).toBe('[REDACTED]');
      expect(sanitized.array[1].name).toBe('item2');
      expect(sanitized.array[1].key).toBe('value2');
    });

    it('should handle non-object inputs', () => {
      expect(auditService.sanitizeChanges(null)).toBe(null);
      expect(auditService.sanitizeChanges(undefined)).toBe(undefined);
      expect(auditService.sanitizeChanges('string')).toBe('string');
      expect(auditService.sanitizeChanges(123)).toBe(123);
    });
  });

  describe('validateAuditIntegrity', () => {
    it('should validate audit integrity successfully', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockAuditLogs = [
        {
          _id: new mongoose.Types.ObjectId(),
          performedBy: { userId: new mongoose.Types.ObjectId(), userType: 'doctor' },
          action: 'created',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          performedBy: { userId: new mongoose.Types.ObjectId(), userType: 'doctor' },
          action: 'updated',
          timestamp: new Date('2024-01-01T11:00:00Z')
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockAuditLogs)
      };
      AuditLog.find = jest.fn().mockReturnValue(mockQuery);

      const result = await auditService.validateAuditIntegrity(prescriptionId);

      expect(result.success).toBe(true);
      expect(result.data.prescriptionId).toEqual(prescriptionId);
      expect(result.data.totalLogs).toBe(2);
      expect(result.data.issues).toHaveLength(0);
      expect(result.data.isValid).toBe(true);
      expect(result.data.validatedAt).toBeInstanceOf(Date);
    });

    it('should detect missing required fields', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockAuditLogs = [
        {
          _id: new mongoose.Types.ObjectId(),
          performedBy: { userId: null, userType: 'doctor' }, // Missing userId
          action: 'created',
          timestamp: new Date('2024-01-01T10:00:00Z')
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockAuditLogs)
      };
      AuditLog.find = jest.fn().mockReturnValue(mockQuery);

      const result = await auditService.validateAuditIntegrity(prescriptionId);

      expect(result.success).toBe(true);
      expect(result.data.issues).toHaveLength(1);
      expect(result.data.issues[0].issue).toBe('Missing required fields');
      expect(result.data.isValid).toBe(false);
    });

    it('should detect timestamp sequence violations', async () => {
      const prescriptionId = new mongoose.Types.ObjectId();
      const mockAuditLogs = [
        {
          _id: new mongoose.Types.ObjectId(),
          performedBy: { userId: new mongoose.Types.ObjectId(), userType: 'doctor' },
          action: 'created',
          timestamp: new Date('2024-01-01T11:00:00Z') // Later timestamp
        },
        {
          _id: new mongoose.Types.ObjectId(),
          performedBy: { userId: new mongoose.Types.ObjectId(), userType: 'doctor' },
          action: 'updated',
          timestamp: new Date('2024-01-01T10:00:00Z') // Earlier timestamp
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockAuditLogs)
      };
      AuditLog.find = jest.fn().mockReturnValue(mockQuery);

      const result = await auditService.validateAuditIntegrity(prescriptionId);

      expect(result.success).toBe(true);
      expect(result.data.issues).toHaveLength(1);
      expect(result.data.issues[0].issue).toBe('Timestamp sequence violation');
      expect(result.data.isValid).toBe(false);
    });
  });
});