const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, default: "patient" },

  // Reference to PatientProfile for detailed profile information
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientProfile"
  }
}, {
  timestamps: true
});

// Index for better query performance
PatientSchema.index({ email: 1 });
PatientSchema.index({ username: 1 });

module.exports = mongoose.model("Patient", PatientSchema);
