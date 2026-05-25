import Subcategory from "../models/Subcategory.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ReimbursementRequest from "../models/ReimbursementRequest.js";

export const createSubcategory = async (req, res) => {
  try {
    const { name } = req.body;

    const exists = await Subcategory.findOne({ name });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Subcategory already exists",
      });
    }

    const subcategory = await Subcategory.create({
      name,
    });

    res.status(201).json({
      success: true,
      subcategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find();

    res.status(200).json({
      success: true,
      subcategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const createUser = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      employeeId,
      designation,
      phone,
      dateOfJoining,
      email,
      password,
      role,
      subcategoryId,
    } = req.body;
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      firstName,
      lastName,
      employeeId,
      designation,
      phone,
      dateOfJoining,
      email,
      passwordHash,
      role,
      subcategoryId:
        role === "Admin" || !subcategoryId
          ? null
          : subcategoryId,
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("subcategoryId", "name")
      .select("-passwordHash");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "Admin") {
      return res.status(400).json({
        success: false,
        message: "Admin user cannot be deleted",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const usersInDepartment = await User.countDocuments({
      subcategoryId: req.params.id,
    });

    if (usersInDepartment > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete department. Users are assigned to this department.",
      });
    }

    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getAllLeaveReports = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({})
      .populate("employeeId", "name email employeeId designation")
      .populate("subcategoryId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllReimbursementReports = async (req, res) => {
  try {
    const reimbursements = await ReimbursementRequest.find({})
      .populate("employeeId", "name email employeeId designation")
      .populate("approvals.managerApprovedBy", "name")
      .populate("approvals.hrApprovedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};