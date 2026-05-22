import ReimbursementRequest from "../models/ReimbursementRequest.js";

import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { sendReimbursementRequestEmail } from "../services/emailService.js";
export const createReimbursement = async (req, res) => {
  try {
    const {
      expenseFrom,
      expenseTo,
      businessPurpose,
      lessCashAdvance = 0,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt / Invoice upload is required.",
      });
    }

    let items = [];

    try {
      items = JSON.parse(req.body.items);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid expense items format.",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one expense item is required.",
      });
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.cost || 0),
      0
    );

    const totalReimbursement =
      subtotal - Number(lessCashAdvance || 0);

    const reimbursement = await ReimbursementRequest.create({
      employeeId: req.user._id,
      expenseFrom,
      expenseTo,
      businessPurpose,
      receiptFile: `/uploads/${req.file.filename}`,
      items,
      subtotal,
      lessCashAdvance,
      totalReimbursement,
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

    Promise.all(
      approvers.map((approver) =>
        sendReimbursementRequestEmail({
          to: approver.email,
          employeeName: req.user.name,
          businessPurpose,
          totalReimbursement,
        })
      )
    ).catch((emailError) => {
      console.log("Reimbursement email failed:", emailError.message);
    });
    res.status(201).json({
      success: true,
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyReimbursements = async (req, res) => {
  try {
    const reimbursements = await ReimbursementRequest.find({
      employeeId: req.user._id,
    }).sort({ createdAt: -1 });

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

export const getPendingReimbursements = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can view reimbursement approvals",
      });
    }

    const reimbursements = await ReimbursementRequest.find({})
      .populate("employeeId", "name email employeeId designation signatureFile")
      .populate("approvals.managerApprovedBy", "name signatureFile")
      .populate("approvals.hrApprovedBy", "name signatureFile")
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

export const approveReimbursement = async (req, res) => {
  try {
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
        message: "Only Manager or HR can approve reimbursement",
      });
    }

    const reimbursement = await ReimbursementRequest.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement not found",
      });
    }

    if (req.user.role === "Manager") {
      reimbursement.approvals.managerStatus = decision;
      reimbursement.approvals.managerApprovedBy = req.user._id;
    }

    if (req.user.role === "HR") {
      reimbursement.approvals.hrStatus = decision;
      reimbursement.approvals.hrApprovedBy = req.user._id;
    }

    if (
      reimbursement.approvals.managerStatus === "Rejected" ||
      reimbursement.approvals.hrStatus === "Rejected"
    ) {
      reimbursement.status = "Rejected";
    } else if (
      reimbursement.approvals.managerStatus === "Approved" &&
      reimbursement.approvals.hrStatus === "Approved"
    ) {
      reimbursement.status = "Approved";
    } else {
      reimbursement.status = "Pending";
    }

    await reimbursement.save();
    if (reimbursement.status === "Approved") {
      await createNotification({
        recipientId: reimbursement.employeeId,
        title: "Reimbursement Approved",
        message: "Your reimbursement request has been approved by Manager and HR.",
        link: "/dashboard",
      });
    }

    if (reimbursement.status === "Rejected") {
      await createNotification({
        recipientId: reimbursement.employeeId,
        title: "Reimbursement Rejected",
        message: "Your reimbursement request has been rejected.",
        link: "/dashboard",
      });
    }
    res.status(200).json({
      success: true,
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};