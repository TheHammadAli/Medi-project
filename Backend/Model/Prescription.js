const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  doctor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'DocProfile', required: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    licenseNumber: { type: String },
    contact: {
      phone: String,
      email: String
    },
    digitalSignature: String
  },
  patient: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { 
      type: String, 
      enum: ['Male', 'Female', 'Other'],
      required: true 
    },
    patientId: String,
    appointmentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
  },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: String,
    dispensed: { type: Boolean, default: false },
    dispensedAt: Date,
    dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }],
  additionalNotes: String,
  labTests: [String],
  followUpInstructions: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'dispensed', 'cancelled'],
    default: 'active'
  },
  pdfGenerated: { type: Boolean, default: false },
  pdfUrl: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  verifiedAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  version: { type: Number, default: 1 }
}, { 
  timestamps: true,
  // Add indexes for performance optimization
  index: {
    'doctor.id': 1,
    'patient.id': 1,
    'status': 1,
    'createdAt': -1,
    'prescriptionNumber': 1
  }
});

// Compound indexes for frequently queried fields
PrescriptionSchema.index({ 'doctor.id': 1, 'createdAt': -1 });
PrescriptionSchema.index({ 'patient.id': 1, 'status': 1 });
PrescriptionSchema.index({ 'prescriptionNumber': 1, 'isDeleted': 1 });

// Pre-save middleware to generate prescription number
PrescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    // Generate unique prescription number
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.prescriptionNumber = `RX-${timestamp}-${random}`.toUpperCase();
  }
  
  // Update version on modification
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Pre-validate middleware to ensure prescription number is set
PrescriptionSchema.pre('validate', function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    // Generate unique prescription number
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.prescriptionNumber = `RX-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Instance method to check if prescription can be modified
PrescriptionSchema.methods.canBeModified = function() {
  return this.status !== 'dispensed' && !this.isDeleted;
};

// Instance method to check if prescription is fully dispensed
PrescriptionSchema.methods.isFullyDispensed = function() {
  return this.medicines.every(medicine => medicine.dispensed);
};

// Static method to find active prescriptions for a doctor
PrescriptionSchema.statics.findActiveByDoctor = function(doctorId) {
  return this.find({
    'doctor.id': doctorId,
    isDeleted: false,
    status: { $in: ['active', 'completed'] }
  }).sort({ createdAt: -1 });
};

// Static method to find prescriptions for a patient
PrescriptionSchema.statics.findByPatient = function(patientId) {
  return this.find({
    'patient.id': patientId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Validation for medicines array
PrescriptionSchema.path('medicines').validate(function(medicines) {
  return medicines && medicines.length > 0;
}, 'At least one medicine is required');

// Validation for patient age
PrescriptionSchema.path('patient.age').validate(function(age) {
  return age > 0 && age <= 150;
}, 'Patient age must be between 1 and 150');

module.exports = mongoose.model("Prescription", PrescriptionSchema);