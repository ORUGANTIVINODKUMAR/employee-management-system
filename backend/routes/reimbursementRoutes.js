import express from "express";

import {
  createReimbursementRequest,
  getMyReimbursementRequests,

  getPendingTLReimbursements,
  approveReimbursementByTL,
  rejectReimbursementByTL,

  getPendingManagerReimbursements,
  approveReimbursementByManager,
  rejectReimbursementByManager,

  getFinanceReimbursements,
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

router.get(
  "/my-requests",
  protect,
  getMyReimbursementRequests
);

/* TL */

router.get(
  "/tl-pending",
  protect,
  getPendingTLReimbursements
);

router.put(
  "/tl-approve/:id",
  protect,
  approveReimbursementByTL
);

router.put(
  "/tl-reject/:id",
  protect,
  rejectReimbursementByTL
);

/* Manager / HR */

router.get(
  "/manager-pending",
  protect,
  getPendingManagerReimbursements
);

router.put(
  "/manager-approve/:id",
  protect,
  approveReimbursementByManager
);

router.put(
  "/manager-reject/:id",
  protect,
  rejectReimbursementByManager
);

/* Finance */

router.get(
  "/finance",
  protect,
  getFinanceReimbursements
);

router.put(
  "/mark-paid/:id",
  protect,
  markReimbursementAsPaid
);

export default router;