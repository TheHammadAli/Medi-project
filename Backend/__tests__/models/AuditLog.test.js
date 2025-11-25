const mongoose = require('mongoose');
const AuditLog = require('../../Model/AuditLog');

describe('AuditLog Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid audit log', async () => {
      const auditLogData = createTestAuditLog();
      const auditLog = new AuditLog(auditLogData);
      
      const savedAuditLog = await auditLog.save();
      
      expect(savedAuditLog._id).toBeDefined();
      expect(savedAuditLog.prescriptionId).toEqual(auditLogData.prescriptionId);
      expect(savedAuditLog.action).toBe('created');
      expect(savedAuditLog.performedBy.userType).toBe('doctor');
      expect(savedAuditLog.timestamp).toBeDefined();
    });

    test('should require prescriptionId', async () => {
      const auditLogData = createTestAuditLog();
      delete auditLogData.prescriptionId;
      
      const auditLog = new AuditLog(auditLogData);
      
      await expect(auditLog.save()).rejects.toThrow();
    });

    test('should require action', async () => {
      const auditLogData = createTestAuditLog();
      delete auditLogData.action;
      
      const auditLog = new AuditLog(auditLogData);
      
      await expect(auditLog.save()).rejects.toThrow();
    });

    test('should require performedBy information', async () => {
      const auditLogData = createTestAuditLog();
      delete auditLogData.performedBy;
      
      const auditLog = new AuditLog(auditLogData);
      
      await expect(auditLog.save()).rejects.toThrow();
    });

    test('should validate action enum', async () => {
      const auditLogData = createTestAuditLog({
        action: 'invalid_action'
      });
      
      const auditLog = new AuditLog(auditLogData);
      
      await expect(auditLog.save()).rejects.toThrow();
    });

    test('should validate userType enum', async () => {
      const auditLogData = createTestAuditLog({
        performedBy: {
          userId: new mongoose.Types.ObjectId(),
          userType: 'invalid_type',
          userName: 'Test User'
        }
      });
      
      const auditLog = new AuditLog(auditLogData);
      
      await expect(auditLog.save()).rejects.toThrow();
    });

    test('should validate IP address format', async () => {
      const auditLogData = createTestAuditLog({
        ipAddress: 'invalid_ip'
      });
      
      const auditLog = new AuditLog(auditLogData);
      
      await expect(auditLog.save()).rejects.toThrow('Invalid IP address format');
    });

    test('should accept valid IPv4 address', async () => {
      const auditLogData = createTestAuditLog({
        ipAddress: '192.168.1.1'
      });
      
      const auditLog = new AuditLog(auditLogData);
      const savedAuditLog = await auditLog.save();
      
      expect(savedAuditLog.ipAddress).toBe('192.168.1.1');
    });

    test('should accept valid IPv6 address', async () => {
      const auditLogData = createTestAuditLog({
        ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      });
      
      const auditLog = new AuditLog(auditLogData);
      const savedAuditLog = await auditLog.save();
      
      expect(savedAuditLog.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    test('should allow empty IP address', async () => {
      const auditLogData = createTestAuditLog();
      delete auditLogData.ipAddress;
      
      const auditLog = new AuditLog(auditLogData);
      const savedAuditLog = await auditLog.save();
      
      expect(savedAuditLog.ipAddress).toBeUndefined();
    });
  });

  describe('Immutability', () => {
    test('should prevent modification after creation', async () => {
      const auditLogData = createTestAuditLog();
      const auditLog = new AuditLog(auditLogData);
      const savedAuditLog = await auditLog.save();
      
      savedAuditLog.action = 'updated';
      
      await expect(savedAuditLog.save()).rejects.toThrow('Audit logs cannot be modified after creation');
    });

    test('should prevent deletion', async () => {
      const auditLogData = createTestAuditLog();
      const auditLog = new AuditLog(auditLogData);
      const savedAuditLog = await auditLog.save();
      
      await expect(savedAuditLog.deleteOne()).rejects.toThrow('Audit logs cannot be deleted');
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test audit logs
      const prescriptionId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      
      const auditLogs = [
        createTestAuditLog({
          prescriptionId,
          action: 'created',
          performedBy: {
            userId,
            userType: 'doctor',
            userName: 'Dr. Smith'
          }
        }),
        createTestAuditLog({
          prescriptionId,
          action: 'updated',
          performedBy: {
            userId,
            userType: 'doctor',
            userName: 'Dr. Smith'
          }
        }),
        createTestAuditLog({
          prescriptionId,
          action: 'viewed',
          performedBy: {
            userId: new mongoose.Types.ObjectId(),
            userType: 'patient',
            userName: 'John Doe'
          }
        })
      ];
      
      await AuditLog.insertMany(auditLogs);
    });

    test('createLog should create audit log entry', async () => {
      const logData = createTestAuditLog();
      
      const result = await AuditLog.createLog(logData);
      
      expect(result).toBeDefined();
      expect(result.action).toBe(logData.action);
      expect(result.prescriptionId).toEqual(logData.prescriptionId);
    });

    test('createLog should not throw error on failure', async () => {
      const invalidLogData = {
        // Missing required fields
        action: 'created'
      };
      
      const result = await AuditLog.createLog(invalidLogData);
      
      expect(result).toBeNull();
    });

    test('getAuditTrail should return audit logs for prescription', async () => {
      const auditLogs = await AuditLog.find({});
      const prescriptionId = auditLogs[0].prescriptionId;
      
      const trail = await AuditLog.getAuditTrail(prescriptionId);
      
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every(log => log.prescriptionId.equals(prescriptionId))).toBe(true);
    });

    test('getAuditTrail should filter by action', async () => {
      const auditLogs = await AuditLog.find({});
      const prescriptionId = auditLogs[0].prescriptionId;
      
      const trail = await AuditLog.getAuditTrail(prescriptionId, { action: 'created' });
      
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every(log => log.action === 'created')).toBe(true);
    });

    test('getAuditTrail should filter by userType', async () => {
      const auditLogs = await AuditLog.find({});
      const prescriptionId = auditLogs[0].prescriptionId;
      
      const trail = await AuditLog.getAuditTrail(prescriptionId, { userType: 'doctor' });
      
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every(log => log.performedBy.userType === 'doctor')).toBe(true);
    });

    test('getAuditTrail should filter by date range', async () => {
      const auditLogs = await AuditLog.find({});
      const prescriptionId = auditLogs[0].prescriptionId;
      
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const trail = await AuditLog.getAuditTrail(prescriptionId, { 
        startDate: startDate.toISOString() 
      });
      
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every(log => log.timestamp >= startDate)).toBe(true);
    });

    test('getUserActivity should return user activity logs', async () => {
      const auditLogs = await AuditLog.find({ 'performedBy.userType': 'doctor' });
      const userId = auditLogs[0].performedBy.userId;
      
      const activity = await AuditLog.getUserActivity(userId, 'doctor');
      
      expect(activity.length).toBeGreaterThan(0);
      expect(activity.every(log => log.performedBy.userId.equals(userId))).toBe(true);
      expect(activity.every(log => log.performedBy.userType === 'doctor')).toBe(true);
    });

    test('getActivityStats should return aggregated statistics', async () => {
      const stats = await AuditLog.getActivityStats();
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
      
      const createdStat = stats.find(stat => stat._id === 'created');
      expect(createdStat).toBeDefined();
      expect(createdStat.totalCount).toBeGreaterThan(0);
      expect(Array.isArray(createdStat.byUserType)).toBe(true);
    });
  });

  describe('Indexes', () => {
    test('should have proper indexes for performance', async () => {
      const indexes = await AuditLog.collection.getIndexes();
      
      // Check that required indexes exist
      const indexNames = Object.keys(indexes);
      expect(indexNames).toContain('prescriptionId_1');
      expect(indexNames).toContain('action_1');
      expect(indexNames).toContain('timestamp_1');
    });
  });
});