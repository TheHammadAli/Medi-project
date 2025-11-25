const Appointment = require("../Model/Appointments");
const mongoose = require("mongoose");
const DoctorProfile = require("../Model/DocProfile");
const Patient = require("../Model/Patient");
const Chat = require("../Model/Chat");
const { getIO } = require("../Socket/socketServer");

const bookAppointment = async (req, res) => {
   const { doctorId, patientId, appointmentDate, appointmentTime, patientEmail } = req.body;

   try {
    

     // Ensure user is authenticated
     if (!req.user || !req.user.id) {
       console.log("❌ No authenticated user found");
       return res.status(401).json({
         success: false,
         message: "Authentication required. Please log in to book an appointment."
       });
     }

     // Ensure only patients can book appointments
     if (req.user.userType === "doctor") {
       console.log("❌ Doctor trying to book appointment as patient");
       return res.status(403).json({
         success: false,
         message: "Doctors cannot book appointments as patients. Please log in as a patient to book appointments."
       });
     }

     // Fetch doctor and patient from DB
     const doctor = await DoctorProfile.findById(doctorId);
     let patient;

     // Validate doctor exists
     if (!doctor) {
       console.log("❌ Doctor not found:", doctorId);
       return res.status(404).json({ success: false, message: "Doctor not found" });
     }

     // Try to find patient by ID first
     if (mongoose.Types.ObjectId.isValid(patientId)) {
       patient = await Patient.findById(patientId);
     }

     // If not found and patientId doesn't look like an ObjectId, try email/username lookup
     if (!patient && !mongoose.Types.ObjectId.isValid(patientId)) {
       patient = await Patient.findOne({
         $or: [
           { email: patientId },
           { username: patientId }
         ]
       });
     }

     // If still not found, try additional lookup methods
     if (!patient) {
       // Try finding by email if provided
       if (patientEmail) {
         console.log("🔍 Trying to find patient by email:", patientEmail);
         patient = await Patient.findOne({ email: patientEmail });
       }

       // If still not found and user is authenticated, check their record
       if (!patient && req.user && req.user.id) {
         console.log("🔍 Patient not found by other methods, checking authenticated user:", req.user.id);
         patient = await Patient.findById(req.user.id);
       }

       // If authenticated user doesn't have a patient record, they may need to register properly
       if (!patient && req.user && req.user.id) {
         console.log("❌ Authenticated user doesn't have a patient record:", req.user.id);
         return res.status(404).json({
           success: false,
           message: "Patient record not found. Please ensure you are properly registered and logged in as a patient. If you just registered, please try logging out and logging back in. If the issue persists, please contact support."
         });
       }
     }

     if (!patient) {
       console.log("❌ Patient not found:", patientId);
       return res.status(404).json({
         success: false,
         message: "Patient not found. Please ensure you are properly registered and logged in as a patient."
       });
     }

    // Ensure we're using the correct patient ID for the appointment
    const patientIdToUse = patient._id;

    // Validate appointment data
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Appointment date and time are required"
      });
    }

    // Validate date format
    const appointmentDateObj = new Date(appointmentDate);
    if (isNaN(appointmentDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date format"
      });
    }

    // Check if appointment date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDateObj < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot book appointments for past dates"
      });
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        doctor: doctor._id,
        patient: patientIdToUse,
        appointmentDate,
        appointmentTime,
      });

    } catch (appointmentError) {
      console.error("❌ Failed to create appointment:", appointmentError.message);
      console.error("❌ Appointment error details:", appointmentError);

      // Handle specific MongoDB errors
      if (appointmentError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "This time slot is already booked. Please select a different time."
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create appointment. Please try again.",
        error: appointmentError.message
      });
    }

    console.log("📌 Appointment saved:", appointment);

    // Create welcome message
    console.log("💬 Creating welcome message for patient:", patient?.username);
    const welcomeMessage = {
      senderId: doctor._id,
      senderModel: "DocProfile",
      text: `Hello ${
        patient?.username || "Guest"
      }, your appointment on ${appointmentDate} at ${appointmentTime} has been successfully confirmed. We will notify you closer to the scheduled time you selected. Thank you for choosing our services.`,
      timestamp: new Date(),
    };

    // Create or update chat thread
    console.log("🔍 Looking for existing chat between doctor and patient");
    let chat;

    try {
      chat = await Chat.findOne({ doctorId, patientId: patientIdToUse });

      if (!chat) {
        console.log("🆕 Creating new chat thread");
        chat = await Chat.create({
          doctorId,
          patientId: patientIdToUse,
          messages: [welcomeMessage],
        });
      } else {
        console.log("📝 Adding message to existing chat");
        chat.messages.push(welcomeMessage);
        await chat.save();
      }
    } catch (chatError) {
      console.error("❌ Chat operation failed:", chatError.message);
      console.error("❌ Chat error details:", chatError);
      // Don't fail the entire booking if chat fails
      console.log("⚠️ Continuing with booking despite chat error");
    }

    // Emit real-time message
    const roomId = [doctorId.toString(), patientIdToUse.toString()].sort().join("_");
    console.log("📢 Emitting welcome message to room:", roomId);

    try {
      getIO().to(roomId).emit("receive-message", welcomeMessage);
      console.log("✅ Socket message emitted successfully");
    } catch (socketError) {
      console.error("❌ Socket emission failed:", socketError.message);
      // Don't fail the booking if socket fails
    }

    return res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    console.error("❌ Booking Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAppointmentsForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId || doctorId === "undefined" || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing doctor ID." });
    }

    const appointments = await Appointment.find({ doctor: doctorId })
      .populate("patient", "username email")
      .sort({ appointmentDate: 1 });

    console.log("📋 Appointments fetched:", appointments);
    return res.status(200).json(appointments);
  } catch (error) {
    console.error("❌ Error fetching appointments:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch appointments." });
  }
};

const getBookedSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  try {
    const query = { doctor: doctorId };
    if (date) {
      query.appointmentDate = date;
    }

    const appointments = await Appointment.find(query).select("appointmentDate appointmentTime");
    res.status(200).json(appointments);
  } catch (err) {
    console.error("❌ Fetch Booked Slots Error:", err);
    res.status(500).json({ message: "Failed to fetch booked slots" });
  }
};

const getAppointmentsForPatient = async (req, res) => {
     try {
       const { patientId } = req.params;

       console.log("🔍 Fetching appointments for patient:", patientId);
       console.log("🔍 Authenticated user:", req.user);
       console.log("🔍 User ID from token:", req.user.id);
       console.log("🔍 Patient ID from URL:", patientId);
       console.log("🔍 User type:", req.user.userType);
       console.log("🔍 ID comparison:", req.user.id === patientId);
       console.log("🔍 ID types - token:", typeof req.user.id, "- URL:", typeof patientId);

       // Validate patientId
       if (!patientId || patientId === "undefined" || !mongoose.Types.ObjectId.isValid(patientId)) {
         console.log("❌ Invalid patientId format:", patientId);
         return res.status(400).json({
           success: false,
           message: "Invalid or missing patient ID."
         });
       }

       let patientIdToUse = patientId;

       // If user is a patient, ensure they can only access their own appointments
       if (req.user.userType === "patient") {
         // Find the patient record for the authenticated user
         const patientRecord = await Patient.findById(req.user.id);

         if (!patientRecord) {
           console.log("❌ Patient record not found for authenticated user:", req.user.id);
           return res.status(404).json({
             success: false,
             message: "Patient record not found. Please ensure you are properly registered."
           });
         }

         // Use the patient record's ID for fetching appointments
         patientIdToUse = patientRecord._id.toString();
         console.log("🔍 Using patient record ID:", patientIdToUse);
       }

       // Additional check: If user is a doctor trying to access patient appointments, deny access
       if (req.user.userType === "doctor") {
         console.log("❌ Doctor trying to access patient appointments");
         return res.status(403).json({
           success: false,
           message: "Access denied. Doctors cannot access patient appointment lists."
         });
       }

      // If user is a doctor, they can only view appointments of their patients
      if (req.user.userType === "doctor") {
        const doctorAppointments = await Appointment.find({
          doctor: req.user.id,
          patient: patientId
        })
          .populate("patient", "username email")
          .sort({ appointmentDate: 1 });

        console.log("✅ Doctor viewing patient appointments:", {
          count: doctorAppointments.length,
          doctorId: req.user.id,
          patientId
        });

        return res.status(200).json(doctorAppointments);
      }

      // For patients, fetch their own appointments
      const appointments = await Appointment.find({ patient: patientIdToUse })
        .populate("doctor", "name imageUrl speciality")
        .sort({ appointmentDate: 1 });

      console.log("✅ Patient appointments found:", {
        count: appointments.length,
        patientId: patientIdToUse,
        userId: req.user.id,
        appointments: appointments.map(apt => ({
          id: apt._id,
          doctor: apt.doctor ? { name: apt.doctor.name, speciality: apt.doctor.speciality } : null,
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
          status: apt.status,
          paymentStatus: apt.paymentStatus
        }))
      });

      res.status(200).json(appointments);
    } catch (error) {
      console.error("❌ Fetch Patient Appointments Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patient appointments",
        error: error.message
      });
    }
  };

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Appointment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.json({
      success: true,
      message: "Appointment deleted successfully",
      appointment: deleted,
    });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

const getDoctorsForPatientChat = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({
      patient: patientId,
      status: { $ne: "cancelled" },
    }).populate("doctor", "name speciality imageUrl");

    const doctorMap = new Map();
    appointments.forEach((appt) => {
      const doc = appt.doctor;
      if (doc && !doctorMap.has(doc._id.toString())) {
        doctorMap.set(doc._id.toString(), doc);
      }
    });

    const uniqueDoctors = Array.from(doctorMap.values());
    res.status(200).json({ success: true, doctors: uniqueDoctors });
  } catch (error) {
    console.error("❌ Error fetching doctors for chat:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  bookAppointment,
  getAppointmentsForDoctor,
  getBookedSlots,
  getAppointmentsForPatient,
  cancelAppointment,
  getDoctorsForPatientChat,
};