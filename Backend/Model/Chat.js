const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel", // Dynamic reference to DocProfile or Patient
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["DocProfile", "Patient"],
  },
  text: {
    type: String,
  },
  type: {
    type: String,
    default: "text",
  },
  fileData: {
    type: String,
  },
  fileName: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSchema = new mongoose.Schema(
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
    read: {
      type: Boolean,
      default: false,
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

// Ensure one chat per doctor-patient pair
ChatSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;
