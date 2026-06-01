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

    leaveType: {
      type: String,
      enum: ["Sick", "Vacation", "Personal", "Travel"],
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

      managerRejectionReason: {
        type: String,
        default: "",
        trim: true,
      },

      hrRejectionReason: {
        type: String,
        default: "",
        trim: true,
      },
    },

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