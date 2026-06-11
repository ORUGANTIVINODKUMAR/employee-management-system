import mongoose from "mongoose";

const expenseItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    cost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const reimbursementRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    expenseFrom: {
      type: Date,
      required: true,
    },

    expenseTo: {
      type: Date,
      required: true,
    },

    businessPurpose: {
      type: String,
      required: true,
      trim: true,
    },

    receiptFiles: {
      type: [String],
      default: [],
    },

    items: {
      type: [expenseItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one expense item is required",
      },
    },

    subtotal: {
      type: Number,
      required: true,
    },

    lessCashAdvance: {
      type: Number,
      default: 0,
    },

    totalReimbursement: {
      type: Number,
      required: true,
    },

    tlStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    tlApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    tlApprovedAt: {
      type: Date,
      default: null,
    },

    tlRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    managerStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    managerApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    managerApprovedAt: {
      type: Date,
      default: null,
    },

    managerRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    hrStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    hrApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hrApprovedAt: {
      type: Date,
      default: null,
    },

    hrRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    financeStatus: {
      type: String,
      enum: ["Not Routed", "Pending Payment", "Paid"],
      default: "Not Routed",
    },

    financeApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    financeApprovedAt: {
      type: Date,
      default: null,
    },

    finalStatus: {
      type: String,
      enum: [
        "Pending Final Approval",
        "Approved by Manager",
        "Approved by HR",
        "Rejected by Manager",
        "Rejected by HR",
        "Pending Finance Payment",
        "Paid by Finance",
      ],
      default: "Pending Final Approval",
    },

    approvalHistory: [
      {
        level: {
          type: String,
          enum: ["TeamLeader", "Manager", "HR", "Finance"],
        },

        action: {
          type: String,
          enum: ["Submitted", "Approved", "Rejected", "Paid"],
        },

        actedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        actedAt: {
          type: Date,
          default: Date.now,
        },

        remarks: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const ReimbursementRequest = mongoose.model(
  "ReimbursementRequest",
  reimbursementRequestSchema
);

export default ReimbursementRequest;