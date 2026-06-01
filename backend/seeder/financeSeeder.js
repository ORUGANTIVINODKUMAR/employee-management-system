import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../../config/db.js";
import User from "../../models/User.js";

dotenv.config();

connectDB();

const seedFinanceUser = async () => {
  try {
    const existingFinance = await User.findOne({
      email: "finance@upsilonservice.com",
    });

    if (existingFinance) {
      console.log("Finance user already exists");
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
    process.exit(0);
  } catch (error) {
    console.error("Finance user seed failed:", error.message);
    process.exit(1);
  }
};

seedFinanceUser();