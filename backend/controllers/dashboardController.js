import User from "../models/User.js";
import Subcategory from "../models/Subcategory.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ReimbursementRequest from "../models/ReimbursementRequest.js";
import Holiday from "../models/Holiday.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({
      role: { $ne: "Admin" },
    });
    const managerTeamCount =
      req.user.role === "Manager"
        ? await User.countDocuments({
          managerId: req.user._id,
          isActive: true,
        })
        : 0;

    const teamLeaderTeamCount =
      req.user.role === "TeamLeader"
        ? await User.countDocuments({
          teamLeaderId: req.user._id,
          isActive: true,
        })
        : 0;
    const departments = await Subcategory.countDocuments();

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const leaveFilter = {
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      },
    };

    if (req.user.role === "TeamLeader") {
      leaveFilter.teamLeaderId = req.user._id;
    }

    if (req.user.role === "Manager") {
      leaveFilter.managerId = req.user._id;
    }

    const todayLeaves = ["Admin", "HR", "Manager", "TeamLeader"].includes(
      req.user.role
    )
      ? await LeaveRequest.find(leaveFilter)
        .populate("employeeId", "name email employeeId designation role")
        .populate("subcategoryId", "name")
        .populate("teamId", "name")
        .sort({ startDate: 1 })
      : [];

    const tomorrowHoliday = await Holiday.findOne({
      holidayDate: {
        $gte: tomorrow,
        $lte: endOfTomorrow,
      },
    }).sort({ holidayDate: 1 });

    const upcomingHolidays = await Holiday.find({
      holidayDate: {
        $gte: startOfToday,
      },
    })
      .sort({ holidayDate: 1 })
      .limit(3);

    const pendingTLLeaves = await LeaveRequest.countDocuments({
      teamLeaderId: req.user._id,
      finalStatus: "Pending Final Approval",
      tlStatus: "Pending",
    });

    const pendingManagerLeaves =
      req.user.role === "HR"
        ? await LeaveRequest.countDocuments({
          finalStatus: "Pending Final Approval",
        })
        : await LeaveRequest.countDocuments({
          managerId: req.user._id,
          finalStatus: "Pending Final Approval",
        });

    const pendingLeaves = await LeaveRequest.countDocuments({
      finalStatus: "Pending Final Approval",
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      },
    });

    const rejectedLeaves = await LeaveRequest.countDocuments({
      finalStatus: {
        $in: ["Rejected by Manager", "Rejected by HR"],
      },
    });

    const pendingTLReimbursements =
      await ReimbursementRequest.countDocuments({
        teamLeaderId: req.user._id,
        finalStatus: "Pending Final Approval",
        tlStatus: "Pending",
      });

    const pendingManagerReimbursements =
      req.user.role === "HR"
        ? await ReimbursementRequest.countDocuments({
          finalStatus: "Pending Final Approval",
        })
        : await ReimbursementRequest.countDocuments({
          managerId: req.user._id,
          finalStatus: "Pending Final Approval",
        });

    const pendingReimbursements =
      await ReimbursementRequest.countDocuments({
        finalStatus: "Pending Final Approval",
      });

    const approvedReimbursements =
      await ReimbursementRequest.countDocuments({
        finalStatus: {
          $in: ["Approved by Manager", "Approved by HR"],
        },
        financeStatus: "Pending Payment",
      });

    const paidReimbursements =
      await ReimbursementRequest.countDocuments({
        finalStatus: "Paid by Finance",
      });

    const myLeaves = await LeaveRequest.countDocuments({
      employeeId: req.user._id,
    });

    const myPendingLeaves = await LeaveRequest.countDocuments({
      employeeId: req.user._id,
      finalStatus: "Pending Final Approval",
    });

    const myApprovedLeaves = await LeaveRequest.countDocuments({
      employeeId: req.user._id,
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      },
    });

    const myRejectedLeaves = await LeaveRequest.countDocuments({
      employeeId: req.user._id,
      finalStatus: {
        $in: ["Rejected by Manager", "Rejected by HR"],
      },
    });

    const myReimbursements =
      await ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
      });

    const myPendingReimbursements =
      await ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: "Pending Final Approval",
      });

    const myApprovedReimbursements =
      await ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: {
          $in: ["Approved by Manager", "Approved by HR", "Paid by Finance"],
        },
      });

    const myRejectedReimbursements =
      await ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: {
          $in: ["Rejected by Manager", "Rejected by HR"],
        },
      });

    const approvedMyLeaves = await LeaveRequest.find({
      employeeId: req.user._id,
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      },
    });

    const yearlyCasualTotal = 20;
    const yearlySickTotal = 8;
    const yearlyEarnedTotal = 0;

    let usedCasualLeaves = 0;
    let usedSickLeaves = 0;

    approvedMyLeaves.forEach((leave) => {
      if (["Vacation", "Personal", "Casual"].includes(leave.leaveType)) {
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
        managerTeamCount,
        teamLeaderTeamCount,
        todayLeaves,
        tomorrowHoliday,
        upcomingHolidays,

        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,

        pendingTLLeaves,
        pendingManagerLeaves,

        pendingReimbursements,
        pendingTLReimbursements,
        pendingManagerReimbursements,
        approvedReimbursements,
        paidReimbursements,

        myLeaves,
        myPendingLeaves,
        myApprovedLeaves,
        myRejectedLeaves,

        myReimbursements,
        myPendingReimbursements,
        myApprovedReimbursements,
        myRejectedReimbursements,

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