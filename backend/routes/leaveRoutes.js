import express from "express";

import {
  createLeaveRequest,
  getMyLeaveRequests,

  getPendingTLRequests,
  approveLeaveByTL,
  rejectLeaveByTL,
  getManagerApprovalHistory,
  getPendingManagerRequests,
  approveLeaveByManager,
  rejectLeaveByManager,
  getTLApprovalHistory,
  getFinanceLeaves,
  getApprovedLeaveCalendar,
  getTodayLeaves,
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
router.get(
  "/tl/history",
  protect,
  getTLApprovalHistory
);
router.get(
  "/my-requests",
  protect,
  getMyLeaveRequests
);

/* Team Leader Approval Routes */
router.get(
  "/tl-pending",
  protect,
  getPendingTLRequests
);

router.put(
  "/tl-approve/:id",
  protect,
  approveLeaveByTL
);
router.get("/tl-history", protect, getTLApprovalHistory);
router.put(
  "/tl-reject/:id",
  protect,
  rejectLeaveByTL
);
router.get(
  "/manager-history",
  protect,
  getManagerApprovalHistory
);
/* Manager / HR Final Approval Routes */
router.get(
  "/manager-pending",
  protect,
  getPendingManagerRequests
);

router.put(
  "/manager-approve/:id",
  protect,
  approveLeaveByManager
);

router.put(
  "/manager-reject/:id",
  protect,
  rejectLeaveByManager
);

router.get(
  "/finance",
  protect,
  getFinanceLeaves
);

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