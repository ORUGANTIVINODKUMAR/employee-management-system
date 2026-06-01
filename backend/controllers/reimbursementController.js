import ReimbursementRequest from "../models/ReimbursementRequest.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import {
  sendDecisionEmail,
  sendFinanceReimbursementEmail,
} from "../services/emailService.js";

export const createReimbursementRequest = async (req, res) => {
  try {
    const {
      expenseFrom,
      expenseTo,
      businessPurpose,
      items,
      subtotal,
      lessCashAdvance,
      totalReimbursement,
    } = req.body;

    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;

    const uploadedReceiptFiles =
      req.files?.map((file) => file.path) || [];

    const reimbursementRequest =
      await ReimbursementRequest.create({
        employeeId: req.user._id,
        expenseFrom,
        expenseTo,
        businessPurpose,
        items: parsedItems,
        subtotal,
        lessCashAdvance:
          lessCashAdvance || 0,
        totalReimbursement,
        receiptFiles:
          uploadedReceiptFiles,
      });

    const approvers = await User.find({
      role: { $in: ["Manager", "HR"] },
      isActive: true,
    });

    await Promise.all(
      approvers.map((approver) =>
        createNotification({
          recipientId: approver._id,
          title: "New Reimbursement Request",
          message: `${req.user.name} submitted a reimbursement request.`,
          link: "/dashboard",
        })
      )
    );

    res.status(201).json({
      success: true,
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyReimbursementRequests = async (req, res) => {
  try {
    const reimbursementRequests = await ReimbursementRequest.find({
      employeeId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingReimbursementRequests = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can view reimbursement approvals",
      });
    }

    const reimbursementRequests = await ReimbursementRequest.find({})
      .populate("employeeId", "name email employeeId designation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFinanceReimbursements = async (req, res) => {
  try {
    if (req.user.role !== "Finance") {
      return res.status(403).json({
        success: false,
        message: "Only Finance can view approved reimbursements",
      });
    }

    const reimbursementRequests = await ReimbursementRequest.find({
      status: "Approved",
    })
      .populate("employeeId", "name email employeeId designation")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveReimbursementRequest = async (req, res) => {
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
        message: "Only Manager or HR can approve reimbursement",
      });
    }

    const reimbursementRequest = await ReimbursementRequest.findById(id).populate(
      "employeeId",
      "name email"
    );

    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement request not found",
      });
    }

    if (req.user.role === "Manager") {
      reimbursementRequest.approvals.managerStatus = decision;
      reimbursementRequest.approvals.managerApprovedBy =
        decision === "Approved" ? req.user._id : null;
      reimbursementRequest.approvals.managerRejectionReason =
        decision === "Rejected" ? rejectionReason.trim() : "";
    }

    if (req.user.role === "HR") {
      reimbursementRequest.approvals.hrStatus = decision;
      reimbursementRequest.approvals.hrApprovedBy =
        decision === "Approved" ? req.user._id : null;
      reimbursementRequest.approvals.hrRejectionReason =
        decision === "Rejected" ? rejectionReason.trim() : "";
    }

    if (
      reimbursementRequest.approvals.managerStatus === "Rejected" ||
      reimbursementRequest.approvals.hrStatus === "Rejected"
    ) {
      reimbursementRequest.status = "Rejected";
      reimbursementRequest.financeStatus = "Not Routed";
      reimbursementRequest.rejectionReason =
        reimbursementRequest.approvals.managerRejectionReason ||
        reimbursementRequest.approvals.hrRejectionReason ||
        rejectionReason.trim();
    } else if (
      reimbursementRequest.approvals.managerStatus === "Approved" &&
      reimbursementRequest.approvals.hrStatus === "Approved"
    ) {
      reimbursementRequest.status = "Approved";
      reimbursementRequest.financeStatus = "Pending Payment";
      reimbursementRequest.rejectionReason = "";
    } else {
      reimbursementRequest.status = "Pending";
    }

    await reimbursementRequest.save();

    if (reimbursementRequest.status === "Approved") {
      await createNotification({
        recipientId: reimbursementRequest.employeeId._id,
        title: "Reimbursement Approved",
        message:
          "Your reimbursement request has been approved by Manager and HR.",
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
            title: "Reimbursement Ready for Payment",
            message: `${reimbursementRequest.employeeId.name}'s reimbursement request is ready for payment processing.`,
            link: "/dashboard",
          })
        )
      );

      Promise.all(
        financeUsers.map((finance) =>
          sendFinanceReimbursementEmail({
            to: finance.email,
            employeeName: reimbursementRequest.employeeId.name,
            totalReimbursement:
              reimbursementRequest.totalReimbursement,
            businessPurpose: reimbursementRequest.businessPurpose,
            expenseFrom: reimbursementRequest.expenseFrom,
            expenseTo: reimbursementRequest.expenseTo,
            status: reimbursementRequest.status,
          })
        )
      ).catch((emailError) =>
        console.log("Finance reimbursement email failed:", emailError.message)
      );
    }

    if (reimbursementRequest.status === "Rejected") {
      await createNotification({
        recipientId: reimbursementRequest.employeeId._id,
        title: "Reimbursement Rejected",
        message: `Your reimbursement request has been rejected. Reason: ${reimbursementRequest.rejectionReason}`,
        link: "/dashboard",
      });

      sendDecisionEmail({
        to: reimbursementRequest.employeeId.email,
        subject: "Reimbursement Request Rejected",
        title: "Reimbursement Request Rejected",
        employeeName: reimbursementRequest.employeeId.name,
        requestType: "Reimbursement",
        status: "Rejected",
        rejectionReason: reimbursementRequest.rejectionReason,
      }).catch((emailError) =>
        console.log("Reimbursement rejection email failed:", emailError.message)
      );
    }

    res.status(200).json({
      success: true,
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const markReimbursementAsPaid = async (req, res) => {
  try {
    if (req.user.role !== "Finance") {
      return res.status(403).json({
        success: false,
        message: "Only Finance can update payment status",
      });
    }

    const reimbursementRequest =
      await ReimbursementRequest.findById(
        req.params.id
      ).populate("employeeId", "name email");

    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement request not found",
      });
    }

    reimbursementRequest.financeStatus = "Paid";

    await reimbursementRequest.save();

    await createNotification({
      recipientId:
        reimbursementRequest.employeeId._id,
      title: "Reimbursement Paid",
      message:
        "Your reimbursement payment has been processed successfully.",
      link: "/dashboard",
    });

    res.status(200).json({
      success: true,
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};