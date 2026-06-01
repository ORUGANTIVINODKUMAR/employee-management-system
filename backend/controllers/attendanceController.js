import Attendance from "../models/Attendance.js";

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getEndOfToday = () => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

export const checkIn = async (req, res) => {
  try {
    const todayStart = getStartOfToday();
    const todayEnd = getEndOfToday();

    const existingAttendance = await Attendance.findOne({
      employeeId: req.user._id,
      attendanceDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    if (existingAttendance?.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today.",
      });
    }

    const now = new Date();

    const lateTime = new Date();
    lateTime.setHours(9, 30, 0, 0);

    const attendance = await Attendance.create({
      employeeId: req.user._id,
      attendanceDate: todayStart,
      checkInTime: now,
      status: now > lateTime ? "Late" : "Present",
    });

    res.status(201).json({
      success: true,
      message: "Checked in successfully.",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const checkOut = async (req, res) => {
  try {
    const todayStart = getStartOfToday();
    const todayEnd = getEndOfToday();

    const attendance = await Attendance.findOne({
      employeeId: req.user._id,
      attendanceDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    if (!attendance?.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Please check in first.",
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "You have already checked out today.",
      });
    }

    const now = new Date();
    const totalMilliseconds = now - attendance.checkInTime;
    const totalHours = Number((totalMilliseconds / (1000 * 60 * 60)).toFixed(2));

    attendance.checkOutTime = now;
    attendance.totalHours = totalHours;

    if (totalHours < 4) {
      attendance.status = "Half Day";
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Checked out successfully.",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({
      employeeId: req.user._id,
    }).sort({ attendanceDate: -1 });

    res.status(200).json({
      success: true,
      attendanceRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const todayStart = getStartOfToday();
    const todayEnd = getEndOfToday();

    const attendance = await Attendance.findOne({
      employeeId: req.user._id,
      attendanceDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    res.status(200).json({
      success: true,
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    if (!["Admin", "HR", "Manager","Finance"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view attendance records.",
      });
    }

    const attendanceRecords = await Attendance.find({})
      .populate("employeeId", "name email employeeId role subcategoryId")
      .sort({ attendanceDate: -1 });

    res.status(200).json({
      success: true,
      attendanceRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};