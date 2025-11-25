require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../Model/Admin");

const MONGO_URI = process.env.MONGO_URI;

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🔌 MongoDB connected");

    const email = "hammadalimughal08@gmail.com";
    const plainPassword = "admin123";

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("⚠️ Admin already exists.");
      return process.exit(0);
    }

    const hashed = await bcrypt.hash(plainPassword, 10);
    await Admin.create({ email, password: hashed });

    console.log("✅ Admin created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
