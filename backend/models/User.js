import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfJoining: {
      type: Date,
    },
    dateOfBirth: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [
        "Admin",
        "HR",
        "Manager",
        "TeamLeader",
        "Employee",
        "Finance",
      ],
      default: "Employee",
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedTeamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    signatureFile: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

export default User;
