# Prescription Management Models

This directory contains the data models for the prescription management system, including comprehensive schemas, validation, and audit logging capabilities.

## Models Overview

### 1. Prescription Model (`Prescription.js`)

The main prescription model that stores all prescription-related data including doctor information, patient details, medicines, and metadata.

#### Key Features:
- **Automatic prescription number generation** with unique identifiers
- **Comprehensive validation** for all required fields
- **Version tracking** for prescription updates
- **Soft delete functionality** with `isDeleted` flag
- **Performance-optimized indexes** for frequent queries
- **Instance methods** for business logic operations
- **Static methods** for common query patterns

#### Schema Structure:
```javascript
{
  prescriptionNumber: String (unique, indexed),
  doctor: {
    id: ObjectId (ref: DocProfile),
    name: String,
    specialization: String,
    licenseNumber: String,
    contact: { phone, email },
    digitalSignature: String
  },
  patient: {
    id: ObjectId (ref: Patient),
    name: String,
    age: Number (1-150),
    gender: Enum ['Male', 'Female', 'Other'],
    patientId: String,
    appointmentRef: ObjectId (ref: Appointment)
  },
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    dispensed: Boolean,
    dispensedAt: Date,
    dispensedBy: ObjectId (ref: Doctor)
  }],
  additionalNotes: String,
  labTests: [String],
  followUpInstructions: String,
  status: Enum ['active', 'completed', 'dispensed', 'cancelled'],
  pdfGenerated: Boolean,
  pdfUrl: String,
  verifiedBy: ObjectId (ref: Doctor),
  verifiedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  version: Number,
  timestamps: { createdAt, updatedAt }
}
```

#### Instance Methods:
- `canBeModified()` - Checks if prescription can be edited
- `isFullyDispensed()` - Checks if all medicines are dispensed

#### Static Methods:
- `findActiveByDoctor(doctorId)` - Get active prescriptions for a doctor
- `findByPatient(patientId)` - Get all prescriptions for a patient

### 2. AuditLog Model (`AuditLog.js`)

Immutable audit logging model that tracks all prescription-related operations for compliance and security.

#### Key Features:
- **Immutable records** - Cannot be modified or deleted after creation
- **Comprehensive action tracking** for all prescription operations
- **User context capture** including IP address and user agent
- **Flexible metadata storage** for additional context
- **Performance-optimized queries** with compound indexes
- **Built-in error handling** to prevent audit failures from breaking operations

#### Schema Structure:
```javascript
{
  prescriptionId: ObjectId (ref: Prescription, indexed),
  action: Enum ['created', 'updated', 'deleted', 'viewed', 'downloaded', 'verified', 'dispensed', 'pdf_generated'],
  performedBy: {
    userId: ObjectId,
    userType: Enum ['doctor', 'patient', 'pharmacist', 'admin'],
    userName: String
  },
  changes: Mixed (what changed),
  previousValues: Mixed (previous values),
  ipAddress: String (validated IPv4/IPv6),
  userAgent: String,
  sessionId: String,
  metadata: Mixed (additional context),
  timestamp: Date (indexed)
}
```

#### Static Methods:
- `createLog(logData)` - Safely create audit log entry
- `getAuditTrail(prescriptionId, options)` - Get audit trail for prescription
- `getUserActivity(userId, userType, options)` - Get user activity logs
- `getActivityStats(options)` - Get aggregated activity statistics

## Database Indexes

### Prescription Indexes:
- `prescriptionNumber` (unique)
- `doctor.id + createdAt` (compound, descending)
- `patient.id + status` (compound)
- `prescriptionNumber + isDeleted` (compound)

### AuditLog Indexes:
- `prescriptionId + timestamp` (compound, descending)
- `performedBy.userId + action + timestamp` (compound, descending)
- `performedBy.userType + timestamp` (compound, descending)
- `action` (single field)
- `timestamp` (single field, descending)

## Usage Examples

### Creating a Prescription:
```javascript
const prescription = new Prescription({
  doctor: {
    id: doctorProfileId,
    name: 'Dr. John Smith',
    specialization: 'Cardiology',
    licenseNumber: 'LIC123456'
  },
  patient: {
    id: patientId,
    name: 'Jane Doe',
    age: 35,
    gender: 'Female'
  },
  medicines: [{
    name: 'Aspirin',
    dosage: '100mg',
    frequency: 'Once daily',
    duration: '30 days',
    instructions: 'Take with food'
  }]
});

const savedPrescription = await prescription.save();
// Prescription number is automatically generated
```

### Creating Audit Log:
```javascript
await AuditLog.createLog({
  prescriptionId: prescription._id,
  action: 'created',
  performedBy: {
    userId: doctorId,
    userType: 'doctor',
    userName: 'Dr. John Smith'
  },
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

### Querying Prescriptions:
```javascript
// Get active prescriptions for a doctor
const doctorPrescriptions = await Prescription.findActiveByDoctor(doctorId);

// Get all prescriptions for a patient
const patientPrescriptions = await Prescription.findByPatient(patientId);

// Check if prescription can be modified
if (prescription.canBeModified()) {
  // Update prescription
}
```

### Audit Trail Queries:
```javascript
// Get audit trail for a prescription
const auditTrail = await AuditLog.getAuditTrail(prescriptionId, {
  action: 'updated',
  startDate: '2024-01-01',
  limit: 50
});

// Get user activity
const userActivity = await AuditLog.getUserActivity(userId, 'doctor', {
  startDate: '2024-01-01',
  limit: 100
});
```

## Testing

The models include comprehensive unit tests covering:
- Schema validation
- Business logic methods
- Index constraints
- Error handling
- Audit immutability

Run tests with:
```bash
npm test
```

## Database Setup

To create the required indexes in your database:
```bash
npm run create-indexes
```

## Security Considerations

1. **Audit Immutability**: Audit logs cannot be modified or deleted
2. **Data Validation**: Comprehensive validation prevents invalid data
3. **Soft Deletes**: Prescriptions are soft-deleted to maintain audit trails
4. **IP Validation**: IP addresses are validated for audit logs
5. **Version Tracking**: All prescription changes increment version numbers

## Performance Optimizations

1. **Strategic Indexing**: Indexes on frequently queried fields
2. **Compound Indexes**: Multi-field indexes for complex queries
3. **Lean Queries**: Use `.lean()` for read-only operations
4. **Pagination**: Built-in limit support for large result sets
5. **Selective Fields**: Query only required fields when possible