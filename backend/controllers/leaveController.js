import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import Holiday from "../models/Holiday.js";
import { createNotification } from "../services/notificationService.js";
import {
  sendDecisionEmail,
  sendFinanceLeaveEmail,
  sendLeaveRequestEmail,
} from "../services/emailService.js";

const calculateWorkingDays = async (
  startDate,
  endDate
) => {
  const holidays = await Holiday.find({});

  const holidayDates = holidays.map((holiday) =>
    new Date(holiday.holidayDate)
      .toISOString()
      .split("T")[0]
  );

  let count = 0;

  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const day = current.getDay();

    const formattedDate =
      current.toISOString().split("T")[0];

    const isWeekend =
      day === 0 || day === 6;

    const isHoliday =
      holidayDates.includes(formattedDate);

    if (!isWeekend && !isHoliday) {
      count++;
    }

    current.setDate(
      current.getDate() + 1
    );
  }

  return count;
};

export const createLeaveRequest = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, leaveExplanation } = req.body;

    if (!req.user.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to any department",
      });
    }


    const workingDays =
      await calculateWorkingDays(
        startDate,
        endDate
      );

    if (workingDays <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Leave cannot be applied only on weekends or holidays.",
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

      proofFile: req.file ? req.file.path : "",
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
          workingDays,
        })
      )
    ).catch((emailError) => {
      console.log("Email failed:", emailError.message);
    });

    res.status(201).json({ success: true, leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      employeeId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, leaveRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    res.status(200).json({ success: true, leaveRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    const leaveRequests = await LeaveRequest.find({ status: "Approved" })
      .populate("employeeId", "name email employeeId designation")
      .populate("subcategoryId", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, leaveRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, rejectionReason = "" } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision",
      });
    }

    if (decision === "Rejected" && !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can approve leave",
      });
    }

    const leaveRequest = await LeaveRequest.findById(id).populate(
      "employeeId",
      "name email"
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (req.user.role === "Manager") {
      leaveRequest.approvals.managerStatus = decision;
      leaveRequest.approvals.managerRejectionReason =
        decision === "Rejected" ? rejectionReason.trim() : "";
    }

    if (req.user.role === "HR") {
      leaveRequest.approvals.hrStatus = decision;
      leaveRequest.approvals.hrRejectionReason =
        decision === "Rejected" ? rejectionReason.trim() : "";
    }

    if (
      leaveRequest.approvals.managerStatus === "Rejected" ||
      leaveRequest.approvals.hrStatus === "Rejected"
    ) {
      leaveRequest.status = "Rejected";
      leaveRequest.rejectionReason =
        leaveRequest.approvals.managerRejectionReason ||
        leaveRequest.approvals.hrRejectionReason ||
        rejectionReason.trim();
    } else if (
      leaveRequest.approvals.managerStatus === "Approved" &&
      leaveRequest.approvals.hrStatus === "Approved"
    ) {
      leaveRequest.status = "Approved";
      leaveRequest.rejectionReason = "";
    } else {
      leaveRequest.status = "Pending";
    }

    await leaveRequest.save();

    if (leaveRequest.status === "Approved") {
      await createNotification({
        recipientId: leaveRequest.employeeId._id,
        title: "Leave Approved",
        message: "Your leave request has been approved by Manager and HR.",
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
            status: leaveRequest.status,
          })
        )
      ).catch((emailError) =>
        console.log("Finance leave email failed:", emailError.message)
      );
    }

    if (leaveRequest.status === "Rejected") {
      await createNotification({
        recipientId: leaveRequest.employeeId._id,
        title: "Leave Rejected",
        message: `Your leave request has been rejected. Reason: ${leaveRequest.rejectionReason}`,
        link: "/dashboard",
      });

      sendDecisionEmail({
        to: leaveRequest.employeeId.email,
        subject: "Leave Request Rejected",
        title: "Leave Request Rejected",
        employeeName: leaveRequest.employeeId.name,
        requestType: "Leave",
        status: "Rejected",
        rejectionReason: leaveRequest.rejectionReason,
      }).catch((emailError) =>
        console.log("Leave rejection email failed:", emailError.message)
      );
    }

    res.status(200).json({ success: true, leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }


};
export const getApprovedLeaveCalendar = async (req, res) => {
  try {
    if (
      !["Manager", "HR", "Finance", "Admin"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const leaveRequests = await LeaveRequest.find({
      status: "Approved",
    })
      .populate(
        "employeeId",
        "name email employeeId designation role"
      )
      .populate("subcategoryId", "name")
      .sort({ startDate: 1 });

    const calendarEvents = leaveRequests.map((leave) => ({
      id: leave._id,

      title: `${leave.employeeId?.name} | ${leave.leaveType}`,

      start: leave.startDate,

      end: leave.endDate,

      status: leave.status,

      leaveType: leave.leaveType,

      employeeName: leave.employeeId?.name,

      employeeEmail: leave.employeeId?.email,

      designation:
        leave.employeeId?.designation,

      role: leave.employeeId?.role,

      department:
        leave.subcategoryId?.name,
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
    if (
      !["Manager", "HR", "Finance", "Admin"].includes(req.user.role)
    ) {
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
      status: "Approved",

      startDate: { $lte: endOfDay },

      endDate: { $gte: today },
    })
      .populate(
        "employeeId",
        "name email employeeId designation role"
      )
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
