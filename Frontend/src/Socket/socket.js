import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

console.log(`🔌 [Socket.js] Initializing socket connection to ${URL}`);

const socket = io(URL, {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

console.log("🔌 [Socket.js] Socket instance created, attempting connection...");

socket.on("connect", () => {
  console.log("🔌 [Socket.js] Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("🔌 [Socket.js] Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 [Socket.js] Socket disconnected:", socket.id, "Reason:", reason);
});

export default socket;
