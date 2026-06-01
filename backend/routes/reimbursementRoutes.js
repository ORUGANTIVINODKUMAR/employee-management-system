import express from "express";

import {
  createReimbursementRequest,
  getMyReimbursementRequests,
  getPendingReimbursementRequests,
  getFinanceReimbursements,
  approveReimbursementRequest,
  markReimbursementAsPaid,
} from "../controllers/reimbursementController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/request",
  protect,
  upload.array("receiptFiles", 10),
  createReimbursementRequest
);

router.get("/my-requests", protect, getMyReimbursementRequests);

router.get("/pending", protect, getPendingReimbursementRequests);

router.get("/finance", protect, getFinanceReimbursements);

router.put("/approve/:id", protect, approveReimbursementRequest);
router.put(
  "/mark-paid/:id",
  protect,
  markReimbursementAsPaid
);

export default router;