const Chat = require("../Model/Chat");
const DocProfile = require("../Model/DocProfile");
const Patient = require("../Model/Patient");

// Save a new chat message
const saveMessage = async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      senderId,
      senderModel,
      text,
      type,
      fileData,
      fileName,
    } = req.body;

    if (!doctorId || !patientId || !senderId || !senderModel) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // Find existing chat or create new
    let chat = await Chat.findOne({ doctorId, patientId });
    if (!chat) {
      chat = new Chat({ doctorId, patientId, messages: [] });
    }

    const newMessage = {
      senderId,
      senderModel,
      timestamp: new Date(),
      ...(text && { text }),
      ...(type && { type }),
      ...(fileData && { fileData }),
      ...(fileName && { fileName }),
    };

    chat.messages.push(newMessage);
    await chat.save();

    // Return messages with chatId included
    const messagesWithChatId = chat.messages.map((msg) => ({
      ...msg.toObject(),
      chatId: chat._id,
    }));

    return res
      .status(200)
      .json({ success: true, messages: messagesWithChatId });
  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get chat history between a doctor and patient
const getChatHistory = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;

    if (!doctorId || !patientId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing doctorId or patientId." });
    }

    const chat = await Chat.findOne({ doctorId, patientId })
      .populate("doctorId", "name email")
      .populate("patientId", "username email")
      .populate({
        path: "patientId",
        populate: {
          path: "profile",
          select: "profileImage"
        }
      });

    if (!chat) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const messagesWithChatId = chat.messages.map((msg) => ({
      ...msg.toObject(),
      chatId: chat._id,
    }));

    return res
      .status(200)
      .json({ success: true, messages: messagesWithChatId });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Edit a message text by chatId and messageId
const editMessage = async (req, res) => {
  try {
    const { chatId, messageId, newText } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });

    const message = chat.messages.id(messageId);
    if (!message)
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });

    message.text = newText;
    await chat.save();

    return res
      .status(200)
      .json({ success: true, message: "Message updated successfully" });
  } catch (error) {
    console.error("Error editing message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a message by chatId and messageId
const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });

    const message = chat.messages.id(messageId);
    if (!message)
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });

    message.remove();
    await chat.save();

    return res
      .status(200)
      .json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get doctor profile by doctorId
const doctorInfo = async (req, res) => {
  try {
    const doctor = await DocProfile.findOne({
      doctorRefId: req.params.doctorId,
    });

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all patients who chatted with a doctor, with latest message & unread count
const getDoctorChats = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const chats = await Chat.find({ doctorId }).populate({
      path: "patientId",
      select: "username email",
      populate: {
        path: "profile",
        select: "profileImage"
      }
    });

    const patients = chats.map((chat) => {
      if (!chat.patientId) {
        return null; // Skip this chat if patientId is null
      }
      const messages = chat.messages || [];
      const latest = messages[messages.length - 1];

      // Unread messages sent by patient
      const unreadCount = messages.filter(
        (m) => m.senderModel === "Patient" && !m.read
      ).length;

      return {
        _id: chat.patientId._id,
        username: chat.patientId.username,
        profileImage: chat.patientId.profile?.profileImage || null,
        latestMessage: latest?.text ||
                      (latest?.type === "image" ? "📷 Image" :
                       latest?.type === "file" ? `📄 ${latest?.fileName || "File"}` :
                       "No messages yet"),
        unreadCount,
        timestamp: latest?.timestamp,
      };
    })
    .filter(patient => patient !== null && patient._id) // Remove null entries and any invalid entries
    .sort((a, b) => {
      // Sort by timestamp, most recent first
      const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return timeB - timeA;
    });

    return res.status(200).json({ success: true, patients });
  } catch (error) {
    console.error("Error fetching doctor chats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all doctors a patient chatted with, with latest message & unread count
const getPatientChats = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    const chats = await Chat.find({ patientId }).populate(
      "doctorId",
      "name username email imageUrl"
    );

    const doctors = chats.map((chat) => {
      const messages = chat.messages || [];
      const latest = messages[messages.length - 1];

      // Unread messages sent by doctor
      const unreadCount = messages.filter(
        (m) => m.senderModel === "DocProfile" && !m.read
      ).length;

      return {
        _id: chat.doctorId._id,
        username: chat.doctorId.username || chat.doctorId.name || "Doctor",
        imageUrl: chat.doctorId.imageUrl || null,
        latestMessage: latest?.text || "No messages yet",
        unreadCount,
      };
    });

    return res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.error("Error fetching patient chats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  saveMessage,
  getChatHistory,
  editMessage,
  deleteMessage,
  doctorInfo,
  getDoctorChats,
  getPatientChats,
};
