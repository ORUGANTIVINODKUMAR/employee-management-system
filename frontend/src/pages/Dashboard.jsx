import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Receipt,
  LogOut,
  BadgeCheck,
  Bell,
  Wallet,
  Menu,
  X,
} from "lucide-react";


import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import FinanceLeaves from "./FinanceLeaves";
import FinanceReimbursements from "./FinanceReimbursements";
import AdminSubcategories from "./AdminSubcategories";
import AdminUsers from "./AdminUsers";
import AdminLeaveReports from "./AdminLeaveReports";
import AdminReimbursementReports from "./AdminReimbursementReports";
import LeaveRequests from "./LeaveRequests";
import LeaveCalendar from "./LeaveCalendar";
import Reimbursements from "./Reimbursements";
import ReimbursementApprovals from "./ReimbursementApprovals";
import SignatureUploader from "../components/SignatureUploader";
import Notifications from "./Notifications";
import HolidayManagement from "./HolidayManagement";
import EditProfile from "./EditProfile";
import AdminTeams from "./AdminTeams";
import TLApprovals from "./TLApprovals";
import ManagerApprovals from "./ManagerApprovals";
const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [activePage, setActivePage] = useState(
    localStorage.getItem("activePage") || "dashboard"
  );

  const [stats, setStats] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isAdmin = user?.role === "Admin";
  const isEmployee = user?.role === "Employee";

  const isManagerOrHR =
    ["Manager", "HR"].includes(user?.role);

  const isTeamLeader =
    user?.role === "TeamLeader";
  const isFinance = user?.role === "Finance";

  useEffect(() => {
    if (
      user?.role === "Employee" &&
      user?.mustChangePassword
    ) {
      setShowPasswordModal(true);
    } else {
      setShowPasswordModal(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data.stats);
        if (user?.role !== "Admin") {
          const notificationRes = await api.get("/notifications");
          setNotifications(notificationRes.data.notifications || []);
        }

        localStorage.setItem(
          "leaveBalance",
          JSON.stringify(data.stats.leaveBalance)
        );
      } catch (error) {
        console.log(error.response?.data);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const menuButton = (key, icon, label) => (
    <button
      className={activePage === key ? "active-menu" : ""}
      onClick={() => {
        setActivePage(key);
        localStorage.setItem("activePage", key);
        setIsMobileSidebarOpen(false);
      }}
    >
      {icon}
      {label}
    </button>
  );

  const handlePasswordChange = async () => {
    try {
      if (
        passwordData.newPassword !==
        passwordData.confirmPassword
      ) {
        alert("Passwords do not match");
        return;
      }

      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      updateUser({
        ...user,
        mustChangePassword: false,
      });

      setShowPasswordModal(false);

      alert("Password updated successfully");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to update password"
      );
    }
  };

  return (
    <div className="dashboard-layout portal-redesign">
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>

        <img src={logo} alt="Upsilon" />

        <span>{user?.role}</span>
      </div>

      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={`sidebar modern-sidebar ${isMobileSidebarOpen ? "mobile-sidebar-open" : ""
          }`}
      >
        <button
          className="mobile-sidebar-close"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <X size={22} />
        </button>
        <div>
          <div
            className="brand-block"
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 0",
            }}
          >
            <img
              src={logo}
              alt="Upsilon"
              style={{
                width: "140px",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          <div className="sidebar-menu">

            {menuButton("dashboard", <LayoutDashboard size={18} />, "Dashboard")}
            {!isAdmin &&
              menuButton("notifications", <Bell size={18} />, "Notifications")}
            {isAdmin && (
              <>
                {menuButton("departments", <Building2 size={18} />, "Departments")}
                <button
                  className={activePage === "teams" ? "active-menu" : ""}
                  onClick={() => {
                    setActivePage("teams");
                    localStorage.setItem("activePage", "teams");
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <Users size={18} />
                  Teams
                </button>
                {menuButton("users", <Users size={18} />, "User Management")}

                {menuButton(
                  "leaveReports",
                  <CalendarCheck size={18} />,
                  "Leave Reports"
                )}

                {menuButton(
                  "reimbursementReports",
                  <Receipt size={18} />,
                  "Reimbursement Reports"
                )}
              </>
            )}

            {(isEmployee || isTeamLeader) &&
              menuButton("leave", <CalendarCheck size={18} />, "Leaves")}

            {(isEmployee || isTeamLeader) &&
              menuButton("reimbursements", <Receipt size={18} />, "Reimbursements")}

            {isTeamLeader &&
              menuButton(
                "tlApprovals",
                <CalendarCheck size={18} />,
                "TL Leave Approvals"
              )}
            {isTeamLeader &&
              menuButton(
                "reimbursementApprovals",
                <Receipt size={18} />,
                "TL Reimbursement Approvals"
              )}
            {isManagerOrHR &&
              menuButton(
                "managerApprovals",
                <CalendarCheck size={18} />,
                "Final Leave Approvals"
              )}

            {isManagerOrHR &&
              menuButton(
                "reimbursementApprovals",
                <Receipt size={18} />,
                "Reimbursement Approvals"
              )}
            {(isManagerOrHR || isFinance || isAdmin) &&
              menuButton(
                "leaveCalendar",
                <CalendarCheck size={18} />,
                "Leave Calendar"
              )}
            {isFinance &&
              menuButton("financeLeaves", <CalendarCheck size={18} />, "Finance Leaves")}

            {isFinance &&
              menuButton(
                "financeReimbursements",
                <Receipt size={18} />,
                "Finance Reimbursements"
              )}

            {menuButton(
              "holidays",
              <CalendarCheck size={18} />,
              "Holidays"
            )}
          </div>
        </div>

        <div className="sidebar-user-box">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>

          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>

          <button className="logout-btn compact-logout" onClick={logout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main modern-main">
        <div className="modern-page-header">
          <span className="eyebrow">
            {isEmployee
              ? "PERSONAL"
              : isAdmin
                ? "ADMIN"
                : isFinance
                  ? "FINANCE"
                  : isTeamLeader
                    ? "TEAM LEADER"
                    : "APPROVALS"}
          </span>

          <h1>
            Hello, {user?.firstName || user?.name}
          </h1>
          <p>

            Here&apos;s a snapshot of your profile and recent activity.
          </p>
          <div className="notification-wrapper">

            <button
              className="notification-bell"
              onClick={() =>
                setShowNotifications(!showNotifications)
              }
            >
              <Bell size={22} />

              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="notification-count">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">

                <div className="notification-dropdown-header">
                  <h4>Notifications</h4>

                  <button
                    onClick={async () => {
                      await api.put("/notifications/read-all");
                      setNotifications([]);
                      setShowNotifications(false);
                    }}
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="notification-dropdown-body">

                  {notifications.length === 0 ? (
                    <p className="empty-notification">
                      No notifications
                    </p>
                  ) : (
                    notifications.slice(0, 8).map((item) => (
                      <div
                        key={item._id}
                        className={`notification-item ${!item.isRead ? "unread-notification" : ""
                          }`}
                      >
                        <div className="notification-content">
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}

                </div>

              </div>
            )}

          </div>
        </div>

        {activePage === "dashboard" && (
          <>

            <div
              className="modern-section-card"
              style={{
                background: stats.tomorrowHoliday
                  ? "linear-gradient(135deg, #fff7ed, #ffffff)"
                  : "linear-gradient(135deg, #ecfdf5, #ffffff)",
                border: stats.tomorrowHoliday
                  ? "1px solid #fed7aa"
                  : "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <span className="eyebrow">
                    {stats.tomorrowHoliday ? "HOLIDAY ALERT" : "UPCOMING HOLIDAY"}
                  </span>

                  <h3 style={{ marginTop: "6px" }}>
                    {stats.tomorrowHoliday
                      ? `Tomorrow is ${stats.tomorrowHoliday.name}`
                      : stats.nearestUpcomingHoliday
                        ? stats.nearestUpcomingHoliday.name
                        : "No Upcoming Holiday"}
                  </h3>

                  {stats.tomorrowHoliday ? (
                    <>
                      <p style={{ marginTop: "8px" }}>
                        📅{" "}
                        {new Date(
                          stats.tomorrowHoliday.holidayDate
                        ).toLocaleDateString()}{" "}
                        • {stats.tomorrowHoliday.type}
                      </p>

                      <p style={{ color: "#92400e", fontWeight: "600" }}>
                        Office closed / holiday configured.
                      </p>
                    </>
                  ) : stats.nearestUpcomingHoliday ? (
                    <>
                      <p style={{ marginTop: "8px" }}>
                        📅{" "}
                        {new Date(
                          stats.nearestUpcomingHoliday.holidayDate
                        ).toLocaleDateString()}{" "}
                        • {stats.nearestUpcomingHoliday.type}
                      </p>

                      <p style={{ color: "#166534", fontWeight: "600" }}>
                        Nearest upcoming company holiday.
                      </p>
                    </>
                  ) : (
                    <p style={{ marginTop: "8px" }}>No upcoming holidays configured.</p>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "42px",
                    width: "72px",
                    height: "72px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: stats.tomorrowHoliday ? "#ffedd5" : "#dcfce7",
                  }}
                >
                  {stats.tomorrowHoliday ? "🎉" : "📅"}
                </div>
              </div>
            </div>
            {stats.todaysBirthdayEmployees?.length > 0 && (
              <div
                className="modern-section-card"
                style={{
                  background: "linear-gradient(135deg, #fdf2f8, #ffffff)",
                  border: "1px solid #fbcfe8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div>
                    <span className="eyebrow">TODAY'S BIRTHDAYS</span>

                    <h3 style={{ marginTop: "6px" }}>
                      🎂 Birthday Celebrations
                    </h3>

                    <div style={{ marginTop: "12px" }}>
                      {stats.todaysBirthdayEmployees.map((employee) => (
                        <div
                          key={employee._id}
                          style={{
                            padding: "10px 0",
                            borderBottom: "1px solid #fce7f3",
                          }}
                        >
                          <strong>{employee.name}</strong>

                          <p style={{ margin: 0, color: "#6b7280" }}>
                            {employee.designation || employee.role} •{" "}
                            {employee.employeeId || "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "42px",
                      width: "72px",
                      height: "72px",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fce7f3",
                    }}
                  >
                    🎂
                  </div>
                </div>
              </div>
            )}

            {["Admin", "HR", "Manager", "TeamLeader"].includes(user?.role) && (
              <div className="modern-section-card">
                <h3>Employees On Leave Today</h3>

                {stats.todayLeaves?.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginTop: "15px",
                    }}
                  >
                    {stats.todayLeaves.map((leave) => (
                      <div
                        key={leave._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          marginBottom: "12px",
                          background: "#ffffff",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: "600",
                            }}
                          >
                            👤 {leave.employeeId?.name}
                          </h4>

                          <p style={{ margin: "4px 0", color: "#6b7280" }}>
                            🏢 {leave.subcategoryId?.name || "N/A"}
                          </p>

                          <p style={{ margin: 0, color: "#6b7280" }}>
                            📅{" "}
                            {new Date(leave.startDate).toLocaleDateString()} -{" "}
                            {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>

                        <div
                          style={{
                            padding: "8px 14px",
                            borderRadius: "20px",
                            background: "#ecfdf5",
                            color: "#166534",
                            fontWeight: "600",
                            fontSize: "13px",
                          }}
                        >
                          {leave.leaveType}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ marginTop: "15px" }}>
                    No employees are on leave today.
                  </p>
                )}
              </div>
            )}
            {isEmployee && (
              <>
                <div className="employee-dashboard-grid">
                  <div className="modern-profile-card">
                    <div className="profile-main-row">
                      <div className="large-avatar">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>

                      <div>
                        <h2>
                          {user?.firstName || user?.name} {user?.lastName || ""}
                        </h2>
                        <p>{user?.email}</p>
                      </div>

                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowEditProfile(true)}
                        >
                          Edit
                        </button>

                        <span className="active-pill">
                          <BadgeCheck size={14} />
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-detail-grid">
                      <div>
                        <span>Employee ID</span>
                        <strong>{user?.employeeId || "Not Updated"}</strong>
                      </div>

                      <div>
                        <span>Phone</span>
                        <strong>{user?.phone || "Not Updated"}</strong>
                      </div>

                      <div>
                        <span>Designation</span>
                        <strong>{user?.designation || "Not Updated"}</strong>
                      </div>

                      <div>
                        <span>Joining Date</span>
                        <strong>
                          {user?.dateOfJoining
                            ? new Date(user.dateOfJoining).toLocaleDateString()
                            : "Not Updated"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="leave-balance-card">
                    <div className="balance-title">
                      <Wallet size={20} />
                      Leave Balance
                    </div>

                    <div className="balance-row">
                      <span>Casual</span>

                      <strong>
                        {stats.leaveBalance?.casual?.remaining ?? 20} /{" "}
                        {stats.leaveBalance?.casual?.total ?? 20}
                      </strong>
                    </div>

                    <div className="balance-bar">
                      <span
                        style={{
                          width: `${((stats.leaveBalance?.casual?.remaining ?? 20) /
                            (stats.leaveBalance?.casual?.total ?? 20)) *
                            100
                            }%`,
                        }}
                      />
                    </div>

                    <div className="balance-row">
                      <span>Sick</span>

                      <strong>
                        {stats.leaveBalance?.sick?.remaining ?? 8} /{" "}
                        {stats.leaveBalance?.sick?.total ?? 8}
                      </strong>
                    </div>

                    <div className="balance-bar">
                      <span
                        style={{
                          width: `${((stats.leaveBalance?.sick?.remaining ?? 8) /
                            (stats.leaveBalance?.sick?.total ?? 8)) *
                            100
                            }%`,
                        }}
                      />
                    </div>


                  </div>
                </div>

                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />
                    <span>Leaves Submitted</span>
                    <h3>{stats.myLeaves || 0}</h3>
                    <p>lifetime</p>
                  </div>
                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />
                    <span>Pending Leaves</span>
                    <h3>{stats.myPendingLeaves || 0}</h3>
                  </div>

                  <div className="mini-stat-card">
                    <BadgeCheck size={23} />
                    <span>Approved Leaves</span>
                    <h3>{stats.myApprovedLeaves || 0}</h3>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />
                    <span>Rejected Leaves</span>
                    <h3>{stats.myRejectedLeaves || 0}</h3>
                  </div>
                  <div className="mini-stat-card">
                    <Receipt size={23} />
                    <span>Claims Submitted</span>
                    <h3>{stats.myReimbursements || 0}</h3>
                    <p>lifetime</p>
                  </div>

                  <div className="mini-stat-card">
                    <Wallet size={23} />
                    <span>Pending Claims</span>
                    <h3>₹0</h3>
                    <p>awaiting review</p>
                  </div>
                  <div className="mini-stat-card">
                    <Receipt size={23} />
                    <span>Pending Reimbursements</span>
                    <h3>{stats.pendingManagerReimbursements || 0}</h3>
                    <p>awaiting your approval</p>
                  </div>

                </div>
                <div className="modern-section-card">
                  <h3>My Activity Overview</h3>


                </div>
              </>
            )}

            {isAdmin && (
              <>
                <div className="employee-dashboard-grid">
                  <div className="modern-profile-card">
                    <div className="profile-main-row">
                      <div className="large-avatar">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>

                      <div>
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                      </div>

                      <span className="active-pill">
                        <BadgeCheck size={14} />
                        Administrator
                      </span>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-detail-grid">
                      <div>
                        <span>Total Employees</span>
                        <strong>{stats.totalEmployees || 0}</strong>
                      </div>

                      <div>
                        <span>Departments</span>
                        <strong>{stats.departments || 0}</strong>
                      </div>

                      <div>
                        <span>Role</span>
                        <strong>Admin</strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>Active</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Users size={23} />
                    <span>Total Employees</span>
                    <h3>{stats.totalEmployees || 0}</h3>
                    <p>active users</p>
                  </div>

                  <div className="mini-stat-card">
                    <Building2 size={23} />
                    <span>Departments</span>
                    <h3>{stats.departments || 0}</h3>
                    <p>company units</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />
                    <span>Pending Leaves</span>
                    <h3>{stats.pendingLeaves || 0}</h3>
                    <p>awaiting approval</p>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />
                    <span>Pending Claims</span>
                    <h3>{stats.pendingReimbursements || 0}</h3>
                    <p>awaiting review</p>
                  </div>
                </div>

                <div className="modern-section-card">
                  <h3>Quick Actions</h3>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      flexWrap: "wrap",
                      marginTop: "15px",
                    }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("users");
                        localStorage.setItem("activePage", "users");
                      }}
                    >
                      Add Employee
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("departments");
                        localStorage.setItem("activePage", "departments");
                      }}
                    >
                      Manage Departments
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("leaveReports");
                        localStorage.setItem("activePage", "leaveReports");
                      }}
                    >
                      Leave Reports
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("reimbursementReports");
                        localStorage.setItem("activePage", "reimbursementReports");
                      }}
                    >
                      Reimbursement Reports
                    </button>
                  </div>
                </div>
              </>
            )}

            {isManagerOrHR && (
              <>
                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Users size={23} />
                    <h3>
                      {user?.role === "HR"
                        ? stats.totalEmployees || 0
                        : stats.managerEmployees?.length || 0}
                    </h3>

                    <h3>
                      {user?.role === "HR"
                        ? stats.totalEmployees || 0
                        : stats.managerTeamCount || 0}
                    </h3>
                    <p>{user?.role === "HR" ? "company users" : "team members"}</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />
                    <span>
                      {user?.role === "HR"
                        ? "Pending HR Leave Approvals"
                        : "Pending Manager Leaves"}
                    </span>
                    <h3>{stats.pendingManagerLeaves || 0}</h3>
                    <p>awaiting your approval</p>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />
                    <span>
                      {user?.role === "HR"
                        ? "Pending HR Reimbursements"
                        : "Pending Manager Reimbursements"}
                    </span>
                    <h3>{stats.pendingManagerReimbursements || 0}</h3>
                    <p>awaiting your approval</p>
                  </div>

                  <div className="mini-stat-card">
                    <Building2 size={23} />
                    <span>Departments</span>
                    <h3>{stats.departments || 0}</h3>
                    <p>active departments</p>
                  </div>
                </div>

                <div className="modern-section-card">
                  {user?.role === "Manager" && (
                    <>
                      <h3>Teams Under Me</h3>

                      <div style={{ marginTop: "15px" }}>
                        {stats.managerTeams?.map((team) => (
                          <div
                            key={team._id}
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            <strong>{team.name}</strong>

                            <p>
                              Employees: {team.employeeCount}
                            </p>

                            <p>
                              Team Leader:
                              {team.teamLeaderId?.name || "Not Assigned"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}


                  {user?.role === "HR" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(200px,1fr))",
                        gap: "15px",
                        marginTop: "20px",
                      }}
                    >
                      <div className="mini-stat-card">
                        <span>Managers</span>
                        <h3>{stats.totalManagers || 0}</h3>
                      </div>

                      <div className="mini-stat-card">
                        <span>Team Leaders</span>
                        <h3>{stats.totalTeamLeaders || 0}</h3>
                      </div>

                      <div className="mini-stat-card">
                        <span>HR</span>
                        <h3>{stats.totalHRs || 0}</h3>
                      </div>

                      <div className="mini-stat-card">
                        <span>Finance</span>
                        <h3>{stats.totalFinance || 0}</h3>
                      </div>
                    </div>
                  )}



                  <h3>
                    {user?.role === "HR" ? "HR Workload" : "Manager Workload"}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => setActivePage("managerApprovals")}
                    >
                      Review Leave Approvals
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => setActivePage("reimbursementApprovals")}
                    >
                      Review Reimbursements
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => setActivePage("leaveCalendar")}
                    >
                      View Leave Calendar
                    </button>
                  </div>
                </div>
              </>
            )}

            {isTeamLeader && (
              <>
                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Users size={23} />
                    <span>My Team Members</span>
                    <h3>{stats.teamMembers?.length || 0}</h3>
                    <p>assigned employees</p>
                  </div>

                  <div className="mini-stat-card">
                    <Building2 size={23} />
                    <span>My Teams</span>
                    <h3>{stats.tlTeams?.length || 0}</h3>
                    <p>teams under you</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />
                    <span>Pending Leave Review</span>
                    <h3>{stats.pendingTLLeaves || 0}</h3>
                    <p>awaiting TL review</p>
                  </div>

                  <div className="mini-stat-card">
                    <Receipt size={23} />
                    <span>Pending Claim Review</span>
                    <h3>{stats.pendingTLReimbursements || 0}</h3>
                    <p>awaiting TL review</p>
                  </div>
                </div>

                <div className="modern-section-card">
                  <h3>Team Leader Quick Actions</h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                      marginTop: "16px",
                    }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("tlApprovals");
                        localStorage.setItem("activePage", "tlApprovals");
                      }}
                    >
                      Review Leave Requests
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("reimbursementApprovals");
                        localStorage.setItem("activePage", "reimbursementApprovals");
                      }}
                    >
                      Review Reimbursements
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("leave");
                        localStorage.setItem("activePage", "leave");
                      }}
                    >
                      Apply / Track My Leave
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActivePage("reimbursements");
                        localStorage.setItem("activePage", "reimbursements");
                      }}
                    >
                      Apply / Track Claims
                    </button>
                  </div>
                </div>

                <div className="modern-section-card">
                  <h3>My Team Members</h3>

                  {stats.teamMembers?.length > 0 ? (
                    <div style={{ marginTop: "15px" }}>
                      {stats.teamMembers.map((member) => (
                        <div
                          key={member._id}
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <strong>{member.name}</strong>
                            <p style={{ margin: "4px 0", color: "#6b7280" }}>
                              {member.designation || "No designation"} • {member.role}
                            </p>
                          </div>

                          <span className="active-pill">
                            {member.teamId?.name || "No Team"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No team members assigned.</p>
                  )}
                </div>
              </>
            )}
            {isFinance && (
              <>
                <div className="modern-stats-grid">
                  <div className="mini-stat-card">
                    <Receipt size={23} />
                    <span>Approved Reimbursements</span>
                    <h3>{stats.approvedReimbursements || 0}</h3>
                    <p>ready for payment</p>
                  </div>

                  <div className="mini-stat-card">
                    <CalendarCheck size={23} />
                    <span>Approved Leaves</span>
                    <h3>{stats.approvedLeaves || 0}</h3>
                    <p>employee records</p>
                  </div>

                  <div className="mini-stat-card">
                    <BadgeCheck size={23} />
                    <span>Finance Role</span>
                    <h3>Finance</h3>
                    <p>authorized</p>
                  </div>
                </div>

                <div className="modern-section-card">
                  <h3>Finance Overview</h3>

                </div>
              </>
            )}

            {!isAdmin && !isFinance && <SignatureUploader />}
          </>
        )}

        {isAdmin && (
          <div
            className={`modern-section-card ${activePage === "departments" ? "page-visible" : "page-hidden"
              }`}
          >
            <AdminSubcategories />
          </div>
        )}
        {isAdmin && (
          <div
            className={`modern-section-card ${activePage === "teams" ? "page-visible" : "page-hidden"
              }`}
          >
            <AdminTeams />
          </div>
        )}
        {isAdmin && (
          <div
            className={`modern-section-card ${activePage === "users" ? "page-visible" : "page-hidden"
              }`}
          >
            <AdminUsers />
          </div>
        )}

        {isTeamLeader && (
          <div
            className={`modern-section-card ${activePage === "tlApprovals"
              ? "page-visible"
              : "page-hidden"
              }`}
          >
            <TLApprovals />
          </div>
        )}

        {(isEmployee || isTeamLeader) && (
          <div
            className={`modern-section-card ${activePage === "leave" ? "page-visible" : "page-hidden"}`}
          >
            <LeaveRequests />
          </div>
        )}

        {(isEmployee || isTeamLeader) && (
          <div
            className={`modern-section-card ${activePage === "reimbursements" ? "page-visible" : "page-hidden"}`}
          >
            <Reimbursements />
          </div>
        )}

        {isManagerOrHR && (
          <div
            className={`modern-section-card ${activePage === "managerApprovals"
              ? "page-visible"
              : "page-hidden"
              }`}
          >
            <ManagerApprovals />
          </div>
        )}

        {(isManagerOrHR || isTeamLeader) && (
          <div
            className={`modern-section-card ${activePage === "reimbursementApprovals"
              ? "page-visible"
              : "page-hidden"
              }`}
          >
            <ReimbursementApprovals />
          </div>
        )}

        {isAdmin && (
          <div
            className={`modern-section-card ${activePage === "leaveReports" ? "page-visible" : "page-hidden"
              }`}
          >
            <AdminLeaveReports />
          </div>
        )}

        {isAdmin && (
          <div
            className={`modern-section-card ${activePage === "reimbursementReports"
              ? "page-visible"
              : "page-hidden"
              }`}
          >
            <AdminReimbursementReports />
          </div>
        )}
        {activePage === "financeLeaves" && isFinance && (
          <div className="modern-section-card">
            <FinanceLeaves />
          </div>
        )}

        {activePage === "financeReimbursements" && isFinance && (
          <div className="modern-section-card">
            <FinanceReimbursements />
          </div>
        )}

        {activePage === "leaveCalendar" && (
          <div className="modern-section-card">
            <LeaveCalendar />
          </div>
        )}
        {activePage === "notifications" && !isAdmin && (
          <div className="modern-section-card">
            <Notifications />
          </div>
        )}

        <div
          className={`modern-section-card ${activePage === "holidays" ? "page-visible" : "page-hidden"
            }`}
        >
          <HolidayManagement />
        </div>
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Change Password</h2>

              <p>
                You must change your password before
                continuing.
              </p>

              <div className="input-group">
                <label>Current Password</label>

                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>New Password</label>

                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>

                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handlePasswordChange}
              >
                Update Password
              </button>
            </div>
          </div>
        )}

        {showEditProfile && (
          <div className="modal-overlay">
            <div className="modal-box profile-modal">
              <div className="modal-header">
                <h2>Edit Profile</h2>

                <button
                  className="modal-close"
                  onClick={() => setShowEditProfile(false)}
                >
                  ×
                </button>
              </div>

              <EditProfile
                onSuccess={() => {
                  setShowEditProfile(false);
                  window.location.reload();
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
