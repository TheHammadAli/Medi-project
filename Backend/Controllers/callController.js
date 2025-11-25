const Call = require("../Model/Call");

// Save a new call record
const saveCall = async (req, res) => {
  try {
    const {
      callerId,
      callerModel,
      receiverId,
      receiverModel,
      callType,
      startTime,
      endTime,
      duration,
      status,
    } = req.body;

    if (!callerId || !callerModel || !receiverId || !receiverModel || !callType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const newCall = new Call({
      callerId,
      callerModel,
      receiverId,
      receiverModel,
      callType,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      status: status || "completed",
    });

    await newCall.save();

    return res
      .status(200)
      .json({ success: true, call: newCall });
  } catch (error) {
    console.error("Error saving call:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get call history for a user (doctor or patient)
const getCallHistory = async (req, res) => {
  try {
    const { userId, userModel } = req.params;

    if (!userId || !userModel) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId or userModel." });
    }

    const calls = await Call.find({
       $or: [
         { callerId: userId, callerModel: userModel },
         { receiverId: userId, receiverModel: userModel },
       ],
     })
       .populate("callerId")
       .populate("receiverId")
       .sort({ startTime: -1 });

    // Process calls to ensure we have proper names even if population fails
    const processedCalls = calls.map(call => {
       const callObj = call.toObject();

       // Ensure caller information
       if (callObj.callerId) {
         const isDocProfile = call.callerModel === "DocProfile";
         const callerName = isDocProfile
           ? (call.callerId.name || "Unknown Doctor")
           : (call.callerId.username || "Unknown Patient");

         callObj.callerId = {
           _id: call.callerId._id,
           name: callerName,
           model: call.callerModel
         };
       }

       // Ensure receiver information
       if (callObj.receiverId) {
         const isDocProfile = call.receiverModel === "DocProfile";
         const receiverName = isDocProfile
           ? (call.receiverId.name || "Unknown Doctor")
           : (call.receiverId.username || "Unknown Patient");

         callObj.receiverId = {
           _id: call.receiverId._id,
           name: receiverName,
           model: call.receiverModel
         };
       }

       return callObj;
     });

    return res
      .status(200)
      .json({ success: true, calls: processedCalls });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  saveCall,
  getCallHistory,
};