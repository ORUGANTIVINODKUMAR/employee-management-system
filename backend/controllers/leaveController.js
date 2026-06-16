import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import Holiday from "../models/Holiday.js";
import { createNotification } from "../services/notificationService.js";
import {
  sendDecisionEmail,
  sendFinanceLeaveEmail,
  sendLeaveRequestEmail,
} from "../services/emailService.js";

const calculateWorkingDays = async (startDate, endDate) => {
  const holidays = await Holiday.find({});

  const holidayDates = holidays.map((holiday) =>
    new Date(holiday.holidayDate).toISOString().split("T")[0]
  );

  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const day = current.getDay();
    const formattedDate = current.toISOString().split("T")[0];

    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidayDates.includes(formattedDate);

    if (!isWeekend && !isHoliday) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const createLeaveRequest = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, leaveExplanation } =
      req.body;

    if (!req.user.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to any department",
      });
    }

    const employee = await User.findById(req.user._id)
      .populate("teamLeaderId", "name email role")
      .populate("managerId", "name email role");

    if (!employee.teamLeaderId) {
      return res.status(400).json({
        success: false,
        message: "No Team Leader assigned",
      });
    }

    const workingDays = await calculateWorkingDays(startDate, endDate);

    if (workingDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Leave cannot be applied only on weekends or holidays.",
      });
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId: req.user._id,
      subcategoryId: req.user.subcategoryId,
      teamId: req.user.teamId || null,
      teamLeaderId: employee.teamLeaderId._id,
      managerId: employee.managerId?._id || null,
      leaveType,
      startDate,
      endDate,
      reason,
      leaveExplanation: leaveExplanation || "",
      workingDays,
      proofFile: req.file ? req.file.path : "",
      tlStatus: "Pending",
      managerStatus: "Pending",
      hrStatus: "Pending",
      finalStatus: "Pending Final Approval",
      approvalHistory: [
        {
          level: "TeamLeader",
          action: "Submitted",
          actedBy: req.user._id,
          remarks: "Leave request submitted",
        },
      ],
    });
    const hrUsers = await User.find({
      role: "HR",
      isActive: true,
    });

    const notificationUsers = [
      employee.teamLeaderId,
      employee.managerId,
      ...hrUsers,
    ].filter(Boolean);

    await Promise.all(
      notificationUsers.map((approver) =>
        createNotification({
          recipientId: approver._id,
          title: "New Leave Request",
          message: `${req.user.name} submitted a ${leaveType} leave request.`,
          link: "/dashboard",
        })
      )
    );

    Promise.all(
      notificationUsers
        .filter((approver) => approver.email)
        .map((approver) =>
          sendLeaveRequestEmail({
            to: approver.email,
            employeeName: req.user.name,
            leaveType,
            startDate,
            endDate,
            workingDays,
          })
        )
    ).catch((emailError) => {
      console.log("Leave request email failed:", emailError.message);
    });

    res.status(201).json({
      success: true,
      leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      employeeId: req.user._id,
    })
      .populate("teamLeaderId", "name email role")
      .populate("managerId", "name email role")
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

export const getManagerApprovalHistory = async (req, res) => {
  try {
    const filter =
      req.user.role === "HR"
        ? {
          finalStatus: {
            $in: [
              "Approved by Manager",
              "Approved by HR",
              "Rejected by Manager",
              "Rejected by HR",
            ],
          },
        }
        : {
          managerId: req.user._id,
          finalStatus: {
            $in: [
              "Approved by Manager",
              "Approved by HR",
              "Rejected by Manager",
              "Rejected by HR",
            ],
          },
        };

    const leaveRequests = await LeaveRequest.find(filter)
      .populate(
        "employeeId",
        "name email employeeId designation"
      )
      .populate("subcategoryId", "name")
      .sort({ updatedAt: -1 });

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
export const getPendingTLRequests = async (req, res) => {
  try {
    if (req.user.role !== "TeamLeader") {
      return res.status(403).json({
        success: false,
        message: "Only Team Leaders can view these requests",
      });
    }

    const leaveRequests = await LeaveRequest.find({
      teamLeaderId: req.user._id,
      finalStatus: "Pending Final Approval",
      tlStatus: "Pending",
    })
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

export const getTLApprovalHistory = async (req, res) => {
  try {
    if (req.user.role !== "TeamLeader") {
      return res.status(403).json({
        success: false,
        message: "Only Team Leaders can view history",
      });
    }

    const leaveRequests = await LeaveRequest.find({
      teamLeaderId: req.user._id,
      tlStatus: {
        $in: ["Approved", "Rejected"],
      },
    })
      .populate(
        "employeeId",
        "name email employeeId designation"
      )
      .populate("subcategoryId", "name")
      .sort({ updatedAt: -1 });

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

export const approveLeaveByTL = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id).populate(
      "employeeId",
      "name email"
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leaveRequest.teamLeaderId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as TL for this leave request",
      });
    }


    leaveRequest.tlStatus = "Approved";
    leaveRequest.tlApprovedBy = req.user._id;
    leaveRequest.tlApprovedAt = new Date();

    leaveRequest.approvalHistory.push({
      level: "TeamLeader",
      action: "Approved",
      actedBy: req.user._id,
      remarks: "Approved by Team Leader",
    });

    await leaveRequest.save();

    await createNotification({
      recipientId: leaveRequest.employeeId._id,
      title: "Leave Approved by Team Leader",
      message:
        "Your leave has been approved by Team Leader and is pending Manager/HR approval.",
      link: "/dashboard",
    });

    if (leaveRequest.managerId) {
      await createNotification({
        recipientId: leaveRequest.managerId,
        title: "Leave Pending Final Approval",
        message: `${leaveRequest.employeeId.name}'s leave was approved by TL and needs your final review.`,
        link: "/dashboard",
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave approved by Team Leader",
      leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectLeaveByTL = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id).populate(
      "employeeId",
      "name email"
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leaveRequest.teamLeaderId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as TL for this leave request",
      });
    }

    leaveRequest.tlStatus = "Rejected";
    leaveRequest.tlRejectionReason = rejectionReason.trim();


    leaveRequest.approvalHistory.push({
      level: "TeamLeader",
      action: "Rejected",
      actedBy: req.user._id,
      remarks: rejectionReason.trim(),
    });

    await leaveRequest.save();

    await createNotification({
      recipientId: leaveRequest.employeeId._id,
      title: "Leave Rejected by Team Leader",
      message: `Your leave was rejected by Team Leader. Reason: ${rejectionReason}`,
      link: "/dashboard",
    });

    res.status(200).json({
      success: true,
      message: "Leave rejected by Team Leader",
      leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingManagerRequests = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can view these requests",
      });
    }

    const filter =
      req.user.role === "HR"
        ? {
          finalStatus: "Pending Final Approval",
          tlStatus: "Approved",
        }
        : {
          finalStatus: "Pending Final Approval",
          managerId: req.user._id,
          tlStatus: "Approved",
        };
    const leaveRequests = await LeaveRequest.find(filter)
      .populate("employeeId", "name email employeeId designation")
      .populate("subcategoryId", "name")
      .populate("tlApprovedBy", "name")
      .populate("teamLeaderId", "name email role")
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

export const approveLeaveByManager = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can approve leave",
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id).populate(
      "employeeId",
      "name email"
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (
      req.user.role === "Manager" &&
      leaveRequest.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as manager for this leave request",
      });
    }

    if (req.user.role === "Manager") {
      leaveRequest.managerStatus = "Approved";
      leaveRequest.managerApprovedBy = req.user._id;
      leaveRequest.managerApprovedAt = new Date();
      leaveRequest.finalStatus = "Approved by Manager";
    }

    if (req.user.role === "HR") {
      leaveRequest.hrStatus = "Approved";
      leaveRequest.hrApprovedBy = req.user._id;
      leaveRequest.hrApprovedAt = new Date();
      leaveRequest.finalStatus = "Approved by HR";
    }
    leaveRequest.rejectionReason = "";

    leaveRequest.approvalHistory.push({
      level: "Manager",
      action: "Approved",
      actedBy: req.user._id,
      remarks: `Approved by ${req.user.role}`,
    });

    await leaveRequest.save();

    await createNotification({
      recipientId: leaveRequest.employeeId._id,
      title: "Leave Approved",
      message: "Your leave request has been finally approved.",
      link: "/dashboard",
    });

    const financeUsers = await User.find({
      role: "Finance",
      isActive: true,
    });

    await Promise.all(
      financeUsers.map((finance) =>
        createNotification({
          recipientId: finance._id,
          title: "Approved Leave Details",
          message: `${leaveRequest.employeeId.name} has an approved ${leaveRequest.leaveType} leave request.`,
          link: "/dashboard",
        })
      )
    );

    Promise.all(
      financeUsers.map((finance) =>
        sendFinanceLeaveEmail({
          to: finance.email,
          employeeName: leaveRequest.employeeId.name,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          workingDays: leaveRequest.workingDays,
          status: leaveRequest.finalStatus,
        })
      )
    ).catch((emailError) =>
      console.log("Finance leave email failed:", emailError.message)
    );

    res.status(200).json({
      success: true,
      message: "Leave approved successfully",
      leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectLeaveByManager = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can reject leave",
      });
    }

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id).populate(
      "employeeId",
      "name email"
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (
      req.user.role === "Manager" &&
      leaveRequest.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as manager for this leave request",
      });
    }

    if (req.user.role === "Manager") {
      leaveRequest.managerStatus = "Rejected";
      leaveRequest.managerRejectionReason = rejectionReason.trim();
      leaveRequest.finalStatus = "Rejected by Manager";
    }

    if (req.user.role === "HR") {
      leaveRequest.hrStatus = "Rejected";
      leaveRequest.hrRejectionReason = rejectionReason.trim();
      leaveRequest.finalStatus = "Rejected by HR";
    }
    leaveRequest.rejectionReason = rejectionReason.trim();

    leaveRequest.approvalHistory.push({
      level: "Manager",
      action: "Rejected",
      actedBy: req.user._id,
      remarks: rejectionReason.trim(),
    });

    await leaveRequest.save();

    await createNotification({
      recipientId: leaveRequest.employeeId._id,
      title: "Leave Rejected",
      message: `Your leave request was rejected. Reason: ${rejectionReason}`,
      link: "/dashboard",
    });

    sendDecisionEmail({
      to: leaveRequest.employeeId.email,
      subject: "Leave Request Rejected",
      title: "Leave Request Rejected",
      employeeName: leaveRequest.employeeId.name,
      requestType: "Leave",
      status: "Rejected",
      rejectionReason: rejectionReason.trim(),
    }).catch((emailError) =>
      console.log("Leave rejection email failed:", emailError.message)
    );

    res.status(200).json({
      success: true,
      message: "Leave rejected successfully",
      leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFinanceLeaves = async (req, res) => {
  try {
    if (req.user.role !== "Finance") {
      return res.status(403).json({
        success: false,
        message: "Only Finance can view approved leave details",
      });
    }

    const leaveRequests = await LeaveRequest.find({
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      }
    })
      .populate("employeeId", "name email employeeId designation")
      .populate("subcategoryId", "name")
      .sort({ updatedAt: -1 });

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

export const getApprovedLeaveCalendar = async (req, res) => {
  try {
    if (!["Manager", "HR", "Finance", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const leaveRequests = await LeaveRequest.find({
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      }
    })
      .populate("employeeId", "name email employeeId designation role")
      .populate("subcategoryId", "name")
      .sort({ startDate: 1 });

    const calendarEvents = leaveRequests.map((leave) => ({
      id: leave._id,
      title: `${leave.employeeId?.name} | ${leave.leaveType}`,
      start: leave.startDate,
      end: leave.endDate,
      status: leave.finalStatus,
      leaveType: leave.leaveType,
      employeeName: leave.employeeId?.name,
      employeeEmail: leave.employeeId?.email,
      designation: leave.employeeId?.designation,
      role: leave.employeeId?.role,
      department: leave.subcategoryId?.name,
    }));

    res.status(200).json({
      success: true,
      calendarEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTodayLeaves = async (req, res) => {
  try {
    if (!["Manager", "HR", "Finance", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const leaveRequests = await LeaveRequest.find({
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      },
      startDate: { $lte: endOfDay },
      endDate: { $gte: today },
    })
      .populate("employeeId", "name email employeeId designation role")
      .populate("subcategoryId", "name")
      .sort({ startDate: 1 });

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