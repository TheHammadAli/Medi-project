const { Server } = require("socket.io");
const Call = require("../Model/Call");
const mongoose = require("mongoose");

const onlineUsers = new Map();
const ongoingCalls = new Map(); // key: `${callerId}-${receiverId}`, value: { callerId, callerModel, receiverId, receiverModel, callType, startTime }
let io;

const setupSocket = (server) => {
  console.log("🔌 [SocketServer] Setting up Socket.IO server...");
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(o => o);
        const defaultOrigins = [
          "http://localhost:5173",
          "http://localhost:5174",
          "https://medipredict-frontend.netlify.app",
          "https://medi-predict-frontend.vercel.app",
          "https://medipredict-backend.onrender.com"
        ];
        const allAllowedOrigins = [...new Set([...allowedOrigins, ...defaultOrigins])];

        // allow requests with no origin like mobile apps or curl
        if (!origin) return callback(null, true);
        if (allAllowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ [Socket] Connected: ${socket.id}`);

   socket.on("user-online", ({ userId, role }) => {
  if (!userId || typeof userId !== "string") {
    console.error("❌ [Socket] Invalid or missing userId in user-online event:", userId);
    return;
  }
  // Update socket.id if userId already exists
  if (onlineUsers.has(userId)) {
    console.log(`[Socket] Updating socket.id for user ${userId}`);
  }
  onlineUsers.set(userId, socket.id);
  console.log(`🟢 ${role} (${userId}) is online`);
  console.log(`[Socket] Online users:`, Array.from(onlineUsers.entries()));
  // Emit to all connected clients so they can update their online status
  io.emit("update-user-status", { userId, status: "online" });
});

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} went offline. Socket ID: ${socket.id}`);
          console.log(`[Socket] Online users:`, Array.from(onlineUsers.entries()));
          // Emit to all connected clients so they can update their online status
          io.emit("update-user-status", { userId, status: "offline" });
          break;
        }
      }
    });

    socket.on("join-room", ({ doctorId, patientId }) => {
      if (!doctorId || !patientId) {
        console.error("❌ [Socket] Missing doctorId or patientId in join-room");
        return;
      }
      const roomId = [String(doctorId), String(patientId)].sort().join("_");
      socket.join(roomId);
      console.log(`🧠 [Socket] ${socket.id} joined room: ${roomId}`);
    });

    socket.on("send-message", async (data) => {
      const {
        doctorId,
        patientId,
        senderId,
        senderModel,
        text,
        type,
        fileData,
        fileName,
      } = data;

      if (
        !doctorId ||
        !patientId ||
        !senderId ||
        !senderModel ||
        (!text && !fileData)
      ) {
        console.error("❌ [Socket] Invalid message payload:", data);
        return;
      }

      const roomId = [String(doctorId), String(patientId)].sort().join("_");
      io.to(roomId).emit("receive-message", {
        _id: data._id || new Date().getTime().toString(),
        senderId,
        senderModel,
        text,
        fileData,
        fileName,
        type: type || "text",
        timestamp: new Date(data.timestamp),
        chatId: roomId,
      });
      console.log(`📤 [Socket] Message sent to room ${roomId}`);
    });

    socket.on("call-user", ({ toUserId, fromUserId, callerModel, receiverModel, offer, callType }) => {
      console.log(`📞 [Socket] call-user triggered for toUserId: ${toUserId} from ${fromUserId} (${callType})`);
      console.log(`🔍 [Socket] Checking if user ${toUserId} is online`);
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        console.log(`✅ [Socket] User ${toUserId} is online`);
        console.log(`📞 [Socket] Attempting to forward call to ${toUserId} with targetSocketId: ${targetSocketId}`);
        console.log(`[Socket] Current onlineUsers map:`, Array.from(onlineUsers.entries()));
        io.to(targetSocketId).emit("incoming-call", {
          fromUserId,
          offer,
          callType,
        });
        console.log(`📞 [Socket] Call forwarded to ${toUserId} (${targetSocketId})`);

        // Store ongoing call
        const callKey = `${fromUserId}-${toUserId}`;
        ongoingCalls.set(callKey, {
          callerId: fromUserId,
          callerModel,
          receiverId: toUserId,
          receiverModel,
          callType,
          startTime: new Date(),
        });
      } else {
        console.log(`❌ [Socket] User ${toUserId} is offline`);
        console.error(`❌ [Socket] No socket found for toUserId: ${toUserId}`);
        socket.emit("call-error", {
          message: `User ${toUserId} is not online`,
        });
      }
    });

    socket.on("accept-call", ({ toUserId, answer }) => {
      const callerSocket = onlineUsers.get(toUserId);
      if (callerSocket) {
        io.to(callerSocket).emit("call-accepted", { answer });
        console.log(`✅ [Socket] Call accepted, answer sent to ${toUserId}`);
      } else {
        console.error(`❌ [Socket] No socket found for toUserId: ${toUserId}`);
      }
    });

    socket.on("ice-candidate", ({ toUserId, candidate }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", { candidate });
        console.log(`🧊 [Socket] ICE candidate sent to ${toUserId}`);
      }
    });

    socket.on("call-declined", ({ toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-declined");
        console.log(`📞 [Socket] Call declined for ${toUserId}`);
      }
      // Save declined call
      const callKey = `${toUserId}-${socket.id}`; // Wait, need to find the key
      // Actually, since declined is from receiver to caller, toUserId is caller
      // But key is caller-receiver, so ${toUserId}-${fromUserId}, but fromUserId not passed
      // Problem, need to adjust.
      // Perhaps use a different way.
      // For simplicity, when call-user, store with key fromUserId-toUserId
      // When declined, the socket is receiver, so toUserId is caller
      // So key `${toUserId}-${userId of socket}`
      // But userId not in socket.
      // Since onlineUsers has userId to socketId, I can find userId from socket.id
      let callerId = null;
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          callerId = uid;
          break;
        }
      }
      if (callerId) {
        const callKey = `${toUserId}-${callerId}`;
        const callData = ongoingCalls.get(callKey);
        if (callData) {
          const endTime = new Date();
          const duration = Math.floor((endTime - callData.startTime) / 1000);
          const call = new Call({
            callerId: new mongoose.Types.ObjectId(callData.callerId),
            callerModel: callData.callerModel,
            receiverId: new mongoose.Types.ObjectId(callData.receiverId),
            receiverModel: callData.receiverModel,
            callType: callData.callType,
            startTime: callData.startTime,
            endTime,
            duration,
            status: "declined",
          });
          call.save().catch(console.error);
          ongoingCalls.delete(callKey);
        }
      }
    });

    socket.on("call-cancelled", ({ toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-cancelled");
        console.log(`❌ [Socket] Call cancelled for ${toUserId}`);
      }
      // Save cancelled call
      let callerId = null;
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          callerId = uid;
          break;
        }
      }
      if (callerId) {
        const callKey = `${callerId}-${toUserId}`;
        const callData = ongoingCalls.get(callKey);
        if (callData) {
          const endTime = new Date();
          const duration = Math.floor((endTime - callData.startTime) / 1000);
          const call = new Call({
            callerId: new mongoose.Types.ObjectId(callData.callerId),
            callerModel: callData.callerModel,
            receiverId: new mongoose.Types.ObjectId(callData.receiverId),
            receiverModel: callData.receiverModel,
            callType: callData.callType,
            startTime: callData.startTime,
            endTime,
            duration,
            status: "cancelled",
          });
          call.save().catch(console.error);
          ongoingCalls.delete(callKey);
        }
      }
    });

    socket.on("end-call", ({ toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-ended");
        console.log(`📴 [Socket] Call ended for ${toUserId}`);
      }
      // Save completed call
      let callerId = null;
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          callerId = uid;
          break;
        }
      }
      if (callerId) {
        const callKey = `${callerId}-${toUserId}`;
        const callData = ongoingCalls.get(callKey);
        if (callData) {
          const endTime = new Date();
          const duration = Math.floor((endTime - callData.startTime) / 1000);
          const call = new Call({
            callerId: new mongoose.Types.ObjectId(callData.callerId),
            callerModel: callData.callerModel,
            receiverId: new mongoose.Types.ObjectId(callData.receiverId),
            receiverModel: callData.receiverModel,
            callType: callData.callType,
            startTime: callData.startTime,
            endTime,
            duration,
            status: "completed",
          });
          call.save().catch(console.error);
          ongoingCalls.delete(callKey);
        }
      }
    });
  });
};

module.exports = {
  setupSocket,
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
  },
};