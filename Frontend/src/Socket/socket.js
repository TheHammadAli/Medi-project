import { io } from "socket.io-client";

console.log("🔌 [Socket.js] Initializing socket connection to http://localhost:8000");

 const socket = io("http://localhost:8000", {
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
