import express from "express";

import {
  getMyProfile,
  updateMyMobile,
  changeMyPassword,
  uploadSignature,
} from "../controllers/profileController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);

router.put("/mobile", protect, updateMyMobile);

router.put("/password", protect, changeMyPassword);

router.post(
  "/signature",
  protect,
  upload.single("signatureFile"),
  uploadSignature
);

export default router;