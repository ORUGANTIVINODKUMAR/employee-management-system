import User from "../models/User.js";
import Subcategory from "../models/Subcategory.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ReimbursementRequest from "../models/ReimbursementRequest.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({
      role: { $ne: "Admin" },
    });

    const departments = await Subcategory.countDocuments();

    const pendingLeaves = await LeaveRequest.countDocuments({
      status: "Pending",
    });

    const pendingReimbursements =
      await ReimbursementRequest.countDocuments({
        status: "Pending",
      });

    const myLeaves = await LeaveRequest.countDocuments({
      employeeId: req.user._id,
    });

    const myReimbursements =
      await ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
      });

    // Employee leave balance logic
    const yearlyCasualTotal = 20;
    const yearlySickTotal = 8;
    const yearlyEarnedTotal = 0;

    const approvedLeaves = await LeaveRequest.find({
      employeeId: req.user._id,
      status: "Approved",
    });

    let usedCasualLeaves = 0;
    let usedSickLeaves = 0;

    approvedLeaves.forEach((leave) => {
      if (["Vacation", "Personal"].includes(leave.leaveType)) {
        usedCasualLeaves += leave.workingDays || 0;
      }

      if (leave.leaveType === "Sick") {
        usedSickLeaves += leave.workingDays || 0;
      }
    });

    const leaveBalance = {
      casual: {
        total: yearlyCasualTotal,
        used: usedCasualLeaves,
        remaining: Math.max(yearlyCasualTotal - usedCasualLeaves, 0),
      },

      sick: {
        total: yearlySickTotal,
        used: usedSickLeaves,
        remaining: Math.max(yearlySickTotal - usedSickLeaves, 0),
      },

      earned: {
        total: yearlyEarnedTotal,
        used: 0,
        remaining: yearlyEarnedTotal,
      },
    };

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        departments,
        pendingLeaves,
        pendingReimbursements,
        myLeaves,
        myReimbursements,
        leaveBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};