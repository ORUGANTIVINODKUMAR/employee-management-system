import express from "express";

import {
  createSubcategory,
  getSubcategories,
  createUser,
  getUsers,
  deleteUser,
  deleteSubcategory,
  getAllLeaveReports,
  getAllReimbursementReports,
} from "../controllers/adminController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/subcategories",
  protect,
  authorizeRoles("Admin"),
  createSubcategory
);

router.get(
  "/subcategories",
  protect,
  authorizeRoles("Admin"),
  getSubcategories
);
router.post(
  "/users",
  protect,
  authorizeRoles("Admin"),
  createUser
);

router.get(
  "/users",
  protect,
  authorizeRoles("Admin"),
  getUsers
);
router.delete(
  "/users/:id",
  protect,
  authorizeRoles("Admin"),
  deleteUser
);

router.delete(
  "/subcategories/:id",
  protect,
  authorizeRoles("Admin"),
  deleteSubcategory
);
router.get(
  "/leave-reports",
  protect,
  authorizeRoles("Admin"),
  getAllLeaveReports
);

router.get(
  "/reimbursement-reports",
  protect,
  authorizeRoles("Admin"),
  getAllReimbursementReports
);
export default router;