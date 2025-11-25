const mongoose = require("mongoose");

const docProfileSchema = new mongoose.Schema(
  {
    // Reference to the Doctor model (needed for JWT-based lookups)
    doctorRefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor", // Ensure this matches your Doctor model name
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    speciality: String,
    education: String,
    experience: String,
    fees: String,
    address1: String,
    address2: String,
    about: String,
    imageUrl: String,
    timing: String,
    daysAvailable: [String],
  },
  { timestamps: true }
);

// ✅ Prevent model overwrite errors in dev
module.exports =
  mongoose.models.DocProfile || mongoose.model("DocProfile", docProfileSchema);
