import express from "express";

import {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayAttendance,
  getAllAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);

router.get("/my-attendance", protect, getMyAttendance);
router.get("/today", protect, getTodayAttendance);
router.get("/all", protect, getAllAttendance);

export default router;