import express from "express";

import {
  createSubcategory,
  getSubcategories,
  createTeam,
  getTeams,
  deleteTeam,
  updateTeam,
  createUser,
  getUsers,
  deleteUser,
  updateUser,
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
  "/teams",
  protect,
  authorizeRoles("Admin"),
  createTeam
);

router.get(
  "/teams",
  protect,
  authorizeRoles("Admin"),
  getTeams
);

router.delete(
  "/teams/:id",
  protect,
  authorizeRoles("Admin"),
  deleteTeam
);

router.post(
  "/users",
  protect,
  authorizeRoles("Admin"),
  createUser
);
router.put(
  "/teams/:id",
  protect,
  authorizeRoles("Admin"),
  updateTeam
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

router.put(
  "/users/:id",
  protect,
  authorizeRoles("Admin"),
  updateUser
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
