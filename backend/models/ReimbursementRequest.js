import mongoose from "mongoose";

const expenseItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
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
    },

    receiptFile: {
      type: String,
      required: true,
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

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvals: {
      managerStatus: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
      },

      hrStatus: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
      },

      managerApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      hrApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
  },
  { timestamps: true }
);

const ReimbursementRequest = mongoose.model(
  "ReimbursementRequest",
  reimbursementRequestSchema
);

export default ReimbursementRequest;