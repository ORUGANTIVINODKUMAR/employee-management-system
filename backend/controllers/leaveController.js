import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { sendLeaveRequestEmail } from "../services/emailService.js";


const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;

  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const day = current.getDay();

    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const createLeaveRequest = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      leaveExplanation,
    } = req.body;

    if (!req.user.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to any department",
      });
    }

    const workingDays = calculateWorkingDays(startDate, endDate);

    if (workingDays > 2 && !leaveExplanation) {
      return res.status(400).json({
        success: false,
        message:
          "Reason for Leave Explanation is required for more than 2 working days.",
      });
    }

    if (workingDays > 2 && !req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Proof / Receipts upload is required for more than 2 working days.",
      });
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId: req.user._id,
      subcategoryId: req.user.subcategoryId,
      leaveType,
      startDate,
      endDate,
      reason,
      workingDays,
      leaveExplanation: leaveExplanation || "",
      proofFile: req.file ? `/uploads/${req.file.filename}` : "",
    });

    const approvers = await User.find({
      role: { $in: ["Manager", "HR"] },
      isActive: true,
    });

    await Promise.all(
      approvers.map((approver) =>
        createNotification({
          recipientId: approver._id,
          title: "New Leave Request",
          message: `${req.user.name} submitted a ${leaveType} leave request.`,
          link: "/dashboard",
        })
      )
    );

    Promise.all(
      approvers.map((approver) =>
        sendLeaveRequestEmail({
          to: approver.email,
          employeeName: req.user.name,
          leaveType,
          startDate,
          endDate,
        })
      )
    ).catch((emailError) => {
      console.log("Email failed:", emailError.message);
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
    }).sort({ createdAt: -1 });

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

export const getPendingLeaveRequests = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can view approvals",
      });
    }

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

export const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision",
      });
    }

    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can approve leave",
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (req.user.role === "Manager") {
      leaveRequest.approvals.managerStatus = decision;
    }

    if (req.user.role === "HR") {
      leaveRequest.approvals.hrStatus = decision;
    }

    if (
      leaveRequest.approvals.managerStatus === "Rejected" ||
      leaveRequest.approvals.hrStatus === "Rejected"
    ) {
      leaveRequest.status = "Rejected";
    } else if (
      leaveRequest.approvals.managerStatus === "Approved" &&
      leaveRequest.approvals.hrStatus === "Approved"
    ) {
      leaveRequest.status = "Approved";
    } else {
      leaveRequest.status = "Pending";
    }

    await leaveRequest.save();
    if (leaveRequest.status === "Approved") {
      await createNotification({
        recipientId: leaveRequest.employeeId,
        title: "Leave Approved",
        message: "Your leave request has been approved by Manager and HR.",
        link: "/dashboard",
      });
    }

    if (leaveRequest.status === "Rejected") {
      await createNotification({
        recipientId: leaveRequest.employeeId,
        title: "Leave Rejected",
        message: "Your leave request has been rejected.",
        link: "/dashboard",
      });
    }
    res.status(200).json({
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