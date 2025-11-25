const mongoose = require("mongoose");

const PatientProfileSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
    unique: true
  },

  // Personal Information
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: {
    type: String,
    enum: ["male", "female", "non-binary", "genderfluid", "agender", "transgender-male", "transgender-female", "two-spirit", "other", "prefer-not-to-say"]
  },
  address: { type: String, trim: true },

  // Emergency Contact
  emergencyContact: { type: String, trim: true },
  emergencyPhone: { type: String, trim: true },

  // Medical Information
  bloodType: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown", "not-tested"]
  },
  allergies: { type: String, trim: true },
  medicalConditions: { type: String, trim: true },
  currentMedications: { type: String, trim: true },

  // Physical Measurements
  height: { type: String, trim: true }, // in cm
  weight: { type: String, trim: true }, // in kg
  bloodPressure: { type: String, trim: true },

  // Profile Image
  profileImage: { type: String }, // Cloudinary URL
  profileImagePublicId: { type: String }, // Cloudinary public ID for deletion

  // Medical Reports
  medicalReports: [{
    name: { type: String, required: true },
    url: { type: String, required: true }, // Cloudinary URL
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    publicId: { type: String, required: true } // Cloudinary public ID for deletion
  }]
}, {
  timestamps: true
});

// Create index for better query performance
PatientProfileSchema.index({ patientId: 1 });

// Ensure one profile per patient
PatientProfileSchema.index({ patientId: 1 }, { unique: true });

module.exports = mongoose.model("PatientProfile", PatientProfileSchema);