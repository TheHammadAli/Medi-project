const Patient = require("../Model/Patient");
const PatientProfile = require("../Model/PatientProfile");
const cloudinary = require("../Config/cloudinary");
const fs = require("fs");

// Get patient profile
const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-password");
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // Get or create patient profile
    let profile = await PatientProfile.findOne({ patientId: req.user.id });

    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = new PatientProfile({ patientId: req.user.id });
      await profile.save();
      // Update patient with profile reference
      patient.profile = profile._id;
      await patient.save();
    }

    // Combine patient and profile data
    const combinedData = {
      ...patient.toObject(),
      ...profile.toObject(),
      // Ensure we don't duplicate patientId
      patientId: undefined
    };

    res.status(200).json(combinedData);
  } catch (error) {
    console.error("Error getting patient profile:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update patient profile
const updateProfile = async (req, res) => {
  try {
    const patientId = req.user.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.email; // Email should be updated through separate endpoint
    delete updates.password;
    delete updates.isVerified;
    delete updates.medicalReports; // Medical reports handled separately
    delete updates.patientId; // This is handled separately

    // Get or create patient profile
    let profile = await PatientProfile.findOne({ patientId: patientId });

    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = new PatientProfile({ patientId: patientId, ...updates });
      await profile.save();

      // Update patient with profile reference
      await Patient.findByIdAndUpdate(patientId, { profile: profile._id });

      // Combine patient and profile data
      const patient = await Patient.findById(patientId).select("-password");
      const combinedData = {
        ...patient.toObject(),
        ...profile.toObject(),
        patientId: undefined
      };

      return res.status(200).json({
        msg: "Profile created successfully",
        patient: combinedData
      });
    }

    // Update existing profile
    const updatedProfile = await PatientProfile.findByIdAndUpdate(
      profile._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Get updated patient data
    const patient = await Patient.findById(patientId).select("-password");

    // Combine patient and profile data
    const combinedData = {
      ...patient.toObject(),
      ...updatedProfile.toObject(),
      patientId: undefined
    };

    res.status(200).json({
      msg: "Profile updated successfully",
      patient: combinedData
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ msg: error.message });
    }
    res.status(500).json({ msg: "Server error" });
  }
};

// Upload profile image to Cloudinary
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No image file provided" });
    }

    const patientId = req.user.id;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "patient_profiles",
      transformation: [
        { width: 300, height: 300, crop: "fill" },
        { quality: "auto" }
      ]
    });

    // Get or create patient profile
    let profile = await PatientProfile.findOne({ patientId: patientId });

    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = new PatientProfile({ patientId: patientId });
    }

    // If profile has existing profile image, delete it from Cloudinary
    if (profile.profileImage) {
      const publicId = profile.profileImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`patient_profiles/${publicId}`);
    }

    // Update profile with new profile image URL
    profile.profileImage = result.secure_url;
    await profile.save();

    // Get patient data for response
    const patient = await Patient.findById(patientId).select("-password");

    // Combine patient and profile data
    const combinedData = {
      ...patient.toObject(),
      ...profile.toObject(),
      patientId: undefined
    };

    // Delete the temporary file
    if (req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      msg: "Profile image uploaded successfully",
      imageUrl: result.secure_url,
      patient: combinedData
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    // Delete the temporary file if it exists
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ msg: "Failed to upload image" });
  }
};

// Upload medical report
const uploadMedicalReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file provided" });
    }

    const patientId = req.user.id;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        msg: "Invalid file type. Only PDF, images, and Word documents are allowed."
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        msg: "File size too large. Maximum size is 10MB."
      });
    }

    // Upload to Cloudinary using buffer for memory storage
    const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
      folder: "medical_reports",
      resource_type: "auto"
    });

    // Create medical report object
    const medicalReport = {
      name: req.file.originalname,
      url: result.secure_url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: new Date(),
      publicId: result.public_id
    };

    // Get or create patient profile and add medical report
    let profile = await PatientProfile.findOne({ patientId: patientId });

    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = new PatientProfile({ patientId: patientId });
    }

    // Add medical report to profile
    profile.medicalReports.push(medicalReport);
    await profile.save();

    // Get patient data for response
    const patient = await Patient.findById(patientId).select("-password");

    // Combine patient and profile data
    const combinedData = {
      ...patient.toObject(),
      ...profile.toObject(),
      patientId: undefined
    };

    res.status(200).json({
      msg: "Medical report uploaded successfully",
      report: medicalReport,
      patient: combinedData
    });
  } catch (error) {
    console.error("Error uploading medical report:", error);
    res.status(500).json({ msg: "Failed to upload medical report" });
  }
};

// Get all medical reports
const getMedicalReports = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ patientId: req.user.id })
      .select("medicalReports")
      .populate("medicalReports");

    if (!profile) {
      return res.status(200).json({
        reports: [],
        count: 0
      });
    }

    res.status(200).json({
      reports: profile.medicalReports,
      count: profile.medicalReports.length
    });
  } catch (error) {
    console.error("Error getting medical reports:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete medical report
const deleteMedicalReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const patientId = req.user.id;

    // Find the patient profile and get the report
    const profile = await PatientProfile.findOne({ patientId: patientId });
    if (!profile) {
      return res.status(404).json({ msg: "Patient profile not found" });
    }

    const report = profile.medicalReports.id(reportId);
    if (!report) {
      return res.status(404).json({ msg: "Medical report not found" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(report.publicId);

    // Remove from patient's medical reports
    profile.medicalReports.pull(reportId);
    await profile.save();

    res.status(200).json({
      msg: "Medical report deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting medical report:", error);
    res.status(500).json({ msg: "Failed to delete medical report" });
  }
};

// Get medical report by ID (for viewing/downloading)
const getMedicalReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const patientId = req.user.id;

    const profile = await PatientProfile.findOne({ patientId: patientId });
    if (!profile) {
      return res.status(404).json({ msg: "Patient profile not found" });
    }

    const report = profile.medicalReports.id(reportId);
    if (!report) {
      return res.status(404).json({ msg: "Medical report not found" });
    }

    res.status(200).json({ report });
  } catch (error) {
    console.error("Error getting medical report:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get patient profile by patient ID (for doctors)
const getPatientProfileById = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Find the patient
    const patient = await Patient.findById(patientId).select("-password");
    if (!patient) {
      return res.status(404).json({ success: false, msg: "Patient not found" });
    }

    // Get patient profile
    let profile = await PatientProfile.findOne({ patientId: patientId });

    if (!profile) {
      return res.status(404).json({ success: false, msg: "Patient profile not found" });
    }

    // Combine patient and profile data
    const combinedData = {
      ...patient.toObject(),
      ...profile.toObject(),
      patientId: undefined
    };

    res.status(200).json({
      success: true,
      patient: combinedData
    });
  } catch (error) {
    console.error("Error getting patient profile by ID:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadMedicalReport,
  getMedicalReports,
  deleteMedicalReport,
  getMedicalReport,
  getPatientProfileById
};