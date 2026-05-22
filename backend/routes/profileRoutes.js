import express from "express";

import { uploadSignature } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/signature",
  protect,
  upload.single("signatureFile"),
  uploadSignature
);

export default router;