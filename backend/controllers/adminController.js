import Subcategory from "../models/Subcategory.js";
import Team from "../models/Team.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ReimbursementRequest from "../models/ReimbursementRequest.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
export const createSubcategory = async (req, res) => {
  try {
    const { name } = req.body;

    const exists = await Subcategory.findOne({ name });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Subcategory already exists",
      });
    }

    const subcategory = await Subcategory.create({
      name,
    });

    res.status(201).json({
      success: true,
      subcategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find();

    const users = await User.find({
      role: {
        $in: ["Employee", "TeamLeader", "Manager", "HR"],
      },
    }).select(
      "name email employeeId designation role subcategoryId"
    );

    const subcategoriesWithUsers = subcategories.map((department) => {
      const departmentUsers = users.filter(
        (user) =>
          user.subcategoryId?.toString() === department._id.toString()
      );

      const employees = departmentUsers.filter(
        (user) => user.role === "Employee"
      );

      const teamLeaders = departmentUsers.filter(
        (user) => user.role === "TeamLeader"
      );

      const managers = departmentUsers.filter(
        (user) => user.role === "Manager"
      );

      const hrs = departmentUsers.filter(
        (user) => user.role === "HR"
      );

      return {
        ...department.toObject(),

        users: departmentUsers,
        userCount: departmentUsers.length,

        employeeCount: employees.length,
        teamLeaderCount: teamLeaders.length,
        managerCount: managers.length,
        hrCount: hrs.length,

        employees,
        teamLeaders,
        managers,
        hrs,
      };
    });

    res.status(200).json({
      success: true,
      subcategories: subcategoriesWithUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createTeam = async (req, res) => {
  try {
    const {
      name,
      departmentId,
      managerIds,
      hrIds,
      description,
    } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Team name and department are required",
      });
    }

    const exists = await Team.findOne({
      name,
      departmentId,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Team already exists in this department",
      });
    }

    const team = await Team.create({
      name,
      departmentId,
      managerIds: managerIds || [],
      hrIds: hrIds || [],
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("departmentId", "name")
      .populate("managerIds", "name email role")
      .populate("hrIds", "name email role")
      .populate("teamLeaderId", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    console.log("GET TEAMS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const {
      name,
      departmentId,
      managerIds,
      hrIds,
      teamLeaderId,
      description,
      isActive,
    } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    team.name = name ?? team.name;
    team.departmentId = departmentId ?? team.departmentId;
    team.managerIds = managerIds ?? team.managerIds;
    team.hrIds = hrIds ?? team.hrIds;
    team.teamLeaderId = teamLeaderId || null;
    team.description = description ?? team.description;

    if (typeof isActive === "boolean") {
      team.isActive = isActive;
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team,
    });
  } catch (error) {
    console.log("UPDATE TEAM ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      employeeId,
      designation,
      phone,
      dateOfJoining,
      email,
      password,
      role,
      subcategoryId,
      teamId,
      managerId,
      hrId,
      teamLeaderId,
      assignedTeamIds,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    if (
      !email
        ?.toLowerCase()
        .endsWith("@upsilonservices.com")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only @upsilonservices.com email addresses are allowed",
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      firstName,
      lastName,
      employeeId,
      designation,
      phone,
      dateOfJoining,
      email,
      passwordHash,
      role,

      subcategoryId:
        role === "Admin" || role === "Finance" || !subcategoryId
          ? null
          : subcategoryId,

      teamId:
        role === "Admin" || role === "Finance" || !teamId ? null : teamId,

      managerId:
        role === "Admin" || role === "Finance" || !managerId
          ? null
          : managerId,

      hrId:
        role === "Admin" || role === "Finance" || !hrId
          ? null
          : hrId,

      teamLeaderId:
        role === "Employee" && teamLeaderId ? teamLeaderId : null,

      assignedTeamIds:
        role === "HR" || role === "Manager" ? assignedTeamIds || [] : [],
    });


    res.status(201).json({
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

export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("subcategoryId", "name")
      .populate("teamId", "name")
      .populate("managerId", "name email role")
      .populate("hrId", "name email role")
      .populate("teamLeaderId", "name email role")
      .populate("assignedTeamIds", "name")
      .select("-passwordHash");


    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "Admin") {
      return res.status(400).json({
        success: false,
        message: "Admin user cannot be deleted",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      designation,
      phone,
      dateOfJoining,
      email,
      role,
      subcategoryId,
      isActive,
      teamId,
      managerId,
      hrId,
      teamLeaderId,
      assignedTeamIds,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      email &&
      !email
        .toLowerCase()
        .endsWith("@upsilonservices.com")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only @upsilonservices.com email addresses are allowed",
      });
    }
    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email });

      if (
        existingEmailUser &&
        existingEmailUser._id.toString() !== user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Email already used by another user",
        });
      }
    }
    user.firstName = firstName;
    user.lastName = lastName;
    user.designation = designation;
    user.phone = phone;
    user.dateOfJoining = dateOfJoining || user.dateOfJoining;
    if (email) {
      user.email = email;
    }
    user.role = role;
    user.isActive = isActive;

    user.subcategoryId =
      role === "Admin" || role === "Finance" || !subcategoryId
        ? null
        : subcategoryId;

    user.teamId =
      role === "Admin" || role === "Finance" || !teamId ? null : teamId;

    user.managerId =
      role === "Admin" || role === "Finance" || !managerId
        ? null
        : managerId;

    user.hrId =
      role === "Admin" || role === "Finance" || !hrId
        ? null
        : hrId;

    user.teamLeaderId =
      role === "Employee" && teamLeaderId ? teamLeaderId : null;

    user.assignedTeamIds =
      role === "HR" || role === "Manager" ? assignedTeamIds || [] : [];

    await user.save();


    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const usersInDepartment = await User.countDocuments({
      subcategoryId: req.params.id,
    });

    if (usersInDepartment > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete department. Users are assigned to this department.",
      });
    }

    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getAllLeaveReports = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({})
      .populate("employeeId", "name email employeeId designation")
      .populate("subcategoryId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllReimbursementReports = async (req, res) => {
  try {
    const reimbursements = await ReimbursementRequest.find({})
      .populate("employeeId", "name email employeeId designation")
      .populate("managerApprovedBy", "name")
      .populate("hrApprovedBy", "name")
      .populate("teamLeaderId", "name")
      .populate("tlApprovedBy", "name")
      .populate("financeApprovedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};