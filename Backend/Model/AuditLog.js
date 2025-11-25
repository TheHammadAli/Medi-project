const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  prescriptionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prescription', 
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'viewed', 'downloaded', 'verified', 'dispensed', 'pdf_generated'],
    required: true,
    index: true
  },
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { 
      type: String, 
      enum: ['doctor', 'patient', 'pharmacist', 'admin'],
      required: true
    },
    userName: { type: String, required: true }
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    validate: {
      validator: function(v) {
        // Basic IP address validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        // Updated IPv6 regex to handle compressed notation like ::1
        const ipv6Regex = /^(?:::(?:1|0{1,4}):?|(?:[0-9a-fA-F]{1,4}:){1,7}(?::|:[0-9a-fA-F]{1,4})|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4})$/;
        return !v || ipv4Regex.test(v) || ipv6Regex.test(v);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: String,
  sessionId: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  // Disable versioning for audit logs to prevent modification
  versionKey: false,
  // Add indexes for performance optimization
  index: {
    'prescriptionId': 1,
    'action': 1,
    'performedBy.userId': 1,
    'performedBy.userType': 1,
    'timestamp': -1
  }
});

// Compound indexes for frequently queried combinations
AuditLogSchema.index({ 'prescriptionId': 1, 'timestamp': -1 });
AuditLogSchema.index({ 'performedBy.userId': 1, 'action': 1, 'timestamp': -1 });
AuditLogSchema.index({ 'performedBy.userType': 1, 'timestamp': -1 });

// Prevent modification of audit logs after creation
AuditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    const error = new Error('Audit logs cannot be modified after creation');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Prevent deletion of audit logs
AuditLogSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  const error = new Error('Audit logs cannot be deleted');
  error.name = 'ValidationError';
  return next(error);
});

AuditLogSchema.pre('deleteMany', function(next) {
  const error = new Error('Audit logs cannot be deleted');
  error.name = 'ValidationError';
  return next(error);
});

AuditLogSchema.pre('findOneAndDelete', function(next) {
  const error = new Error('Audit logs cannot be deleted');
  error.name = 'ValidationError';
  return next(error);
});

// Static method to create audit log entry
AuditLogSchema.statics.createLog = async function(logData) {
  try {
    const auditLog = new this(logData);
    return await auditLog.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent breaking main operations
    return null;
  }
};

// Static method to get audit trail for a prescription
AuditLogSchema.statics.getAuditTrail = function(prescriptionId, options = {}) {
  const query = { prescriptionId };
  
  if (options.action) {
    query.action = options.action;
  }
  
  if (options.userType) {
    query['performedBy.userType'] = options.userType;
  }
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) {
      query.timestamp.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      query.timestamp.$lte = new Date(options.endDate);
    }
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

// Static method to get user activity summary
AuditLogSchema.statics.getUserActivity = function(userId, userType, options = {}) {
  const query = {
    'performedBy.userId': userId,
    'performedBy.userType': userType
  };
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) {
      query.timestamp.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      query.timestamp.$lte = new Date(options.endDate);
    }
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 50);
};

// Static method to get system activity statistics
AuditLogSchema.statics.getActivityStats = function(options = {}) {
  const matchStage = {};
  
  if (options.startDate || options.endDate) {
    matchStage.timestamp = {};
    if (options.startDate) {
      matchStage.timestamp.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      matchStage.timestamp.$lte = new Date(options.endDate);
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          userType: '$performedBy.userType'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        totalCount: { $sum: '$count' },
        byUserType: {
          $push: {
            userType: '$_id.userType',
            count: '$count',
            lastActivity: '$lastActivity'
          }
        }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
};

module.exports = mongoose.model("AuditLog", AuditLogSchema);