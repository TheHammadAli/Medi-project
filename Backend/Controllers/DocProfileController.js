const DocProfile = require("../Model/DocProfile");
const cloudinary = require("../Config/cloudinary");

// ✅ Add Doctor Profile with Cloudinary image upload
const addDoctor = async (req, res) => {
  try {
    const { doctorRefId } = req.body;

    // Validate that doctorRefId is provided
    if (!doctorRefId) {
      return res.status(400).json({ msg: "doctorRefId is required to link profile to doctor" });
    }

    // Verify the doctor exists
    const Doctor = require("../Model/Doctor");
    const doctor = await Doctor.findById(doctorRefId);
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found with provided doctorRefId" });
    }

    let imageUrl = "";

    if (req.file) {
      const result = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "doctor_profiles" },
        async (error, result) => {
          if (error)
            return res.status(500).json({ msg: "Cloudinary Error", error });

          imageUrl = result.secure_url;

          const doctorData = {
            ...req.body,
            doctorRefId,
            imageUrl,
          };

          const docProfile = new DocProfile(doctorData);
          await docProfile.save();

          res.status(201).json({ msg: "Doctor profile added successfully", docProfile });
        }
      );

      result.end(req.file.buffer);
    } else {
      return res.status(400).json({ msg: "Image is required" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ Fetch All Doctor Profiles
const getAllDoctorProfiles = async (req, res) => {
  try {
    const docProfiles = await DocProfile.find();
    res.status(200).json(docProfiles);
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Failed to fetch doctor profiles", error: error.message });
  }
};
// ✅ Get Profile by Email (or user ID if preferred)
const getDoctorProfileByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const docProfile = await DocProfile.findOne({ email });
    if (!docProfile) return res.status(404).json({ msg: "Doctor profile not found" });
    res.status(200).json(docProfile);
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error fetching profile", error: error.message });
  }
};

// ✅ Update Doctor Profile
const updateDoctorProfile = async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({ msg: "Email parameter is required" });
    }


    // Validate that doctorRefId is provided if updating
    if (req.body.doctorRefId) {
      const Doctor = require("../Model/Doctor");
      const doctor = await Doctor.findById(req.body.doctorRefId);
      if (!doctor) {
        return res.status(404).json({ msg: "Doctor not found with provided doctorRefId" });
      }
    }

    const updatedData = {
      ...req.body,
    };

    // Handle image upload if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) =>
          cloudinary.uploader
            .upload_stream(
              { resource_type: "image", folder: "doctor_profiles" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            )
            .end(req.file.buffer)
        );
        updatedData.imageUrl = result.secure_url;
      } catch (cloudinaryError) {
        return res.status(500).json({ msg: "Image upload failed", error: cloudinaryError.message });
      }
    }

    // Ensure doctorRefId is preserved if not being updated
    if (!updatedData.doctorRefId) {
      const existingProfile = await DocProfile.findOne({ email });
      if (existingProfile) {
        updatedData.doctorRefId = existingProfile.doctorRefId;
      } else {
        return res.status(404).json({ msg: "Doctor profile not found" });
      }
    }

    const updated = await DocProfile.findOneAndUpdate({ email }, updatedData, {
      new: true,
      runValidators: true, // Run schema validations
    });

    if (!updated) {
      return res.status(404).json({ msg: "Doctor profile not found" });
    }

    res.status(200).json({
      msg: "Profile updated successfully",
      doctor: updated,
      success: true
    });
  } catch (error) {
    console.error("Update profile error:", error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ msg: "Validation failed", errors: messages });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    res.status(500).json({ msg: "Update failed", error: error.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const result = await DocProfile.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Doctor profile not found" });
    res.json({ message: "Doctor profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addDoctor,
  getAllDoctorProfiles,
  getDoctorProfileByEmail,
  updateDoctorProfile,
  deleteProfile,
};
