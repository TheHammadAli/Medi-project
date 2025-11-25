const mongoose = require("mongoose");

const PatientMessageSchema = new mongoose.Schema({
  text: String,
  type: { type: String, default: "text" },
  fileData: String,
  fileName: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const PatientCallSchema = new mongoose.Schema({
  type: { type: String, enum: ["audio", "video"], required: true },
  timestamp: { type: Date, default: Date.now },
  duration: Number,
  status: {
    type: String,
    enum: ["missed", "ended", "rejected"],
    default: "ended",
  },
});

const PatientChatSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocProfile",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    messages: [PatientMessageSchema], // ✅ Patient-only messages
    calls: [PatientCallSchema], // ✅ Patient-only calls
  },
  { timestamps: true }
);

PatientChatSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model("PatientChat", PatientChatSchema);
