import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "employee-portal/uploads";

    if (req.originalUrl.includes("leave")) {
      folder = "employee-portal/leave-proofs";
    }

    if (req.originalUrl.includes("reimbursements")) {
      folder = "employee-portal/reimbursement-receipts";
    }

    if (req.originalUrl.includes("profile")) {
      folder = "employee-portal/signatures";
    }

    const isPdf =
      file.mimetype === "application/pdf";

    const cleanFileName = file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "-");

    return {
      folder,
      resource_type: "auto",
      allowed_formats: ["pdf", "jpg", "jpeg", "png"],
      public_id: `${Date.now()}-${cleanFileName}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;