import express from "express";

import {
  createReimbursement,
  getMyReimbursements,
  getPendingReimbursements,
  approveReimbursement,
} from "../controllers/reimbursementController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/request",
  protect,
  upload.single("receiptFile"),
  createReimbursement
);

router.get("/my-requests", protect, getMyReimbursements);

router.get("/pending", protect, getPendingReimbursements);

router.put("/approve/:id", protect, approveReimbursement);

export default router;