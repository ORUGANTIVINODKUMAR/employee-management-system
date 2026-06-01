import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const seedFinanceUser = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MongoDB URI not found in backend/.env");
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected");

    const existingFinance = await User.findOne({
      email: "finance@upsilonservice.com",
    });

    if (existingFinance) {
      console.log("Finance user already exists");
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash("finance@2026", 10);

    await User.create({
      name: "Finance User",
      email: "finance@upsilonservice.com",
      passwordHash,
      role: "Finance",
      isActive: true,
    });

    console.log("Finance user created successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Finance user seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedFinanceUser();