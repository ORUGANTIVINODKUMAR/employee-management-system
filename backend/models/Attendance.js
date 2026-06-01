import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attendanceDate: {
      type: Date,
      required: true,
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    totalHours: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Half Day",
        "Late",
      ],
      default: "Present",
    },
  },
  { timestamps: true }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

export default Attendance;