const Patient = require("../Model/Patient");

// ✅ Get all patients (Admin only)
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({})
      .populate('profile')
      .sort({ createdAt: -1 });

    res.status(200).json(patients);
  } catch (error) {
    console.error("❌ Error fetching patients:", error);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
};

// ✅ Delete a patient by ID (Admin only)
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Delete the patient
    await Patient.findByIdAndDelete(id);

    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting patient:", error);
    res.status(500).json({ message: "Failed to delete patient" });
  }
};

module.exports = {
  getAllPatients,
  deletePatient
};