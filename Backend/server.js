require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/db");
const http = require("http");
const { setupSocket } = require("./Socket/socketServer");
const fs = require("fs");
const path = require("path");

// Routes
const authRoutes = require("./Routes/authPatient");
const patientProfileRoutes = require("./Routes/patientProfileRoutes");
const patientRoutes = require("./Routes/patientRoutes");
const testimonialRoutes = require("./Routes/testimonialRoutes");
const doctorRoutes = require("./Routes/doctorRoutes");
const doctorProfileRoutes = require("./Routes/docProfileRoutes");
const appointmentRoutes = require("./Routes/appointmentRoutes");
const newsletterRoutes = require("./Routes/subscriberRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const feedbackRoutes = require("./Routes/feedbackRoutes");
const announcementRoutes = require("./Routes/announcementRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const callRoutes = require("./Routes/callRoutes");
const blogRoutes = require("./Routes/blogRoutes");
const prescriptionRoutes = require("./Routes/prescriptionRoutes");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "https://medi-predict-frontend.vercel.app",
        "https://medipredict-frontend.netlify.app"
      ];

      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      // Check if origin matches any allowed origin
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Also allow localhost with any port for development
        if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
          callback(null, true);
        } else if (origin && origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
  })
);

// Root route (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.send("✅ MediPredict Backend is running.");
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: {
      jwt_secret_configured: !!process.env.JWT_SECRET,
      mongo_uri_configured: !!process.env.MONGO_URI,
      port: process.env.PORT || 5000
    }
  });
});

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/patient-profile", patientProfileRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/doctor-profile", doctorProfileRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/announcement", announcementRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

// Cleanup function for uploaded files
const cleanupUploads = () => {
  const uploadsDir = path.join(__dirname, 'uploads');

  // Check if uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    console.log('[Cleanup] Uploads directory does not exist, skipping cleanup');
    return;
  }

  try {
    const files = fs.readdirSync(uploadsDir);

    if (files.length === 0) {
      console.log('[Cleanup] No files to clean up in uploads directory');
      return;
    }

    // Remove all files in uploads directory
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.unlinkSync(filePath);
      console.log(`[Cleanup] Removed temporary file: ${file}`);
    });

    console.log(`[Cleanup] Cleaned up ${files.length} temporary files`);
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error.message);
  }
};

// Start server after successful DB connection
let isServerRunning = false;
const startServer = async () => {
  if (isServerRunning) {
    console.log("[Server] Server is already running, skipping initialization.");
    return;
  }
  try {
    console.log(`[Server] Starting server initialization...`);
    // Clean up any existing uploaded files
    cleanupUploads();
    await connectDB();
    console.log(`[Server] Database connection established, setting up Socket.IO`);
    setupSocket(server);
    console.log(`[Server] Socket.IO setup completed`);

    const port = process.env.PORT || 8080;
    console.log(`[Server] Starting server on port ${port} with Socket.IO attached`);
    server.listen(port, () => console.log(`Server running on port ${port}`));

  } catch (error) {
    console.error(`❌ [Server] Failed to start server: ${error.message}`);
    console.error(`[Server] Error stack:`, error.stack);
    process.exit(1);
  }
};

startServer();
