import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
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

    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    leaveType: {
      type: String,
      enum: [
        "Sick",
        "Vacation",
        "Personal",
        "Travel",
        "Casual",
        "Earned",
        "Emergency",
      ],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    workingDays: {
      type: Number,
      default: 0,
    },

    leaveExplanation: {
      type: String,
      default: "",
    },

    proofFile: {
      type: String,
      default: "",
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

    finalStatus: {
      type: String,
      enum: [
        "Pending Final Approval",
        "Approved by Manager",
        "Approved by HR",
        "Rejected by Manager",
        "Rejected by HR",
      ],
      default: "Pending Final Approval",
    },

    approvalHistory: [
      {
        level: {
          type: String,
          enum: ["TeamLeader", "Manager", "HR"],
        },

        action: {
          type: String,
          enum: ["Submitted", "Approved", "Rejected"],
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

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;