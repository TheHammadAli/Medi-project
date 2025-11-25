import React, { createContext, useContext, useEffect, useState } from "react";
import socket from "../Socket/socket";
import { fetchChatHistory } from "../Components/Chat/chatApi";

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

function ChatProvider({ children, doctorId, patientId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔌 Socket connection log
  useEffect(() => {
    console.log(`🔌 [ChatContext] Initial socket status: ${socket.connected ? "Connected" : "Disconnected"}`);

    const handleConnect = () => {
      console.log(`✅ [ChatContext] Socket connected: ${socket.id}`);
      if (doctorId && patientId) {
        const roomId = [String(doctorId), String(patientId)].sort().join("_");
        socket.emit("join-room", { doctorId: String(doctorId), patientId: String(patientId) });
        console.log(`🧠 [ChatContext] Re-joined room on connect: ${roomId}`);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ [ChatContext] Socket disconnected");
    };

    const handleConnectError = (error) => {
      console.error("❌ [ChatContext] Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [doctorId, patientId]);

  // 📜 Fetch chat history when IDs are ready
  useEffect(() => {
    if (!doctorId || !patientId) {
      console.warn("⚠️ [ChatContext] doctorId or patientId missing");
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        console.log(`📚 [ChatContext] Loading chat history...`);
        const data = await fetchChatHistory(doctorId, patientId);
        if (data.success) {
          setMessages(data.messages);
          console.log(`✅ [ChatContext] Chat history loaded: ${data.messages.length} messages`);
        } else {
          console.error("❌ [ChatContext] Chat history failed:", data.message);
        }
      } catch (err) {
        console.error("❌ [ChatContext] Error fetching chat history:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [doctorId, patientId]);

  // 🧠 Join socket room after IDs are set
  useEffect(() => {
    if (doctorId && patientId) {
      const roomId = [String(doctorId), String(patientId)].sort().join("_");
      socket.emit("join-room", { doctorId, patientId });
      console.log(`🧠 [ChatContext] Joined room: ${roomId}`);
    }
  }, [doctorId, patientId]);

  // 📬 Real-time message receiver
  useEffect(() => {
    const handleReceive = (message) => {
      if (!message._id) return;

      setMessages((prev) => {
        if (prev.some((msg) => msg._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    socket.on("receive-message", handleReceive);

    return () => {
      socket.off("receive-message", handleReceive);
    };
  }, []);

  return (
    <ChatContext.Provider value={{ messages, setMessages, loading }}>
      {children}
    </ChatContext.Provider>
  );
}

export default ChatProvider;
