import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const passwordHash = await bcrypt.hash("Admin@123", 10);

const admin = await User.create({
  name: "Admin",
  email: "info@upsilonservices.com",
  passwordHash,
  role: "Admin",
  mustChangePassword: false,
  isActive: true,
});

console.log("Admin created:", admin.email);

process.exit();