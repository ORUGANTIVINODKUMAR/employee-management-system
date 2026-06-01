import express from "express";

import {
  createLeaveRequest,
  getMyLeaveRequests,
  getPendingLeaveRequests,
  getFinanceLeaves,
  approveLeaveRequest,
  getApprovedLeaveCalendar,
  getTodayLeaves,
} from "../controllers/leaveController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/request", protect, upload.single("proofFile"), createLeaveRequest);

router.get("/my-requests", protect, getMyLeaveRequests);

router.get("/pending", protect, getPendingLeaveRequests);

router.get("/finance", protect, getFinanceLeaves);

router.put("/approve/:id", protect, approveLeaveRequest);

router.get(
  "/calendar",
  protect,
  getApprovedLeaveCalendar
);

router.get(
  "/today-leaves",
  protect,
  getTodayLeaves
);

export default router;