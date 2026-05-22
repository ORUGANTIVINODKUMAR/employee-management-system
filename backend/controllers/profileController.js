import User from "../models/User.js";

export const uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Signature file is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        signatureFile: `/uploads/${req.file.filename}`,
      },
      {
        new: true,
      }
    ).select("-passwordHash");

    res.status(200).json({
      success: true,
      message: "Signature uploaded successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};