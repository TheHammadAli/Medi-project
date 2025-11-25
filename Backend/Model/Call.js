const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "callerModel",
    },
    callerModel: {
      type: String,
      required: true,
      enum: ["DocProfile", "Patient"],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "receiverModel",
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["DocProfile", "Patient"],
    },
    callType: {
      type: String,
      required: true,
      enum: ["audio", "video"],
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
    },
    status: {
      type: String,
      enum: ["completed", "missed", "declined", "cancelled"],
      default: "completed",
    },
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", CallSchema);

module.exports = Call;