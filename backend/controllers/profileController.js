import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("subcategoryId", "name")
      .select("-passwordHash");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMyMobile = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phone },
      { new: true }
    ).select("-passwordHash");

    res.status(200).json({
      success: true,
      message: "Mobile number updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    const admins = await User.find({
      role: "Admin",
      isActive: true,
    });

    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          recipientId: admin._id,
          title: "Employee Password Changed",
          message: `${user.name} changed their password.`,
          link: "/notifications",
        }))
      );
    }

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Admin has been notified.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
        signatureFile: req.file.path,
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