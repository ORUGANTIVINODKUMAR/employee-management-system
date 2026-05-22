import express from "express";

import {
  createLeaveRequest,
  getMyLeaveRequests,
  getPendingLeaveRequests,
  approveLeaveRequest,
} from "../controllers/leaveController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/request",
  protect,
  upload.single("proofFile"),
  createLeaveRequest
);

router.get("/my-requests", protect, getMyLeaveRequests);

router.get("/pending", protect, getPendingLeaveRequests);

router.put("/approve/:id", protect, approveLeaveRequest);

export default router;