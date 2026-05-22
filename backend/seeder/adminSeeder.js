import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import connectDB from "../config/db.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      email: "admin@upsilonservices.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const passwordHash = await bcrypt.hash(
      "Admin123",
      10
    );

    await User.create({
      name: "Admin",
      email: "admin@upsilonservices.com",
      passwordHash,
      role: "Admin",
      isActive: true,
    });

    console.log("Admin seeded successfully");

    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

seedAdmin();