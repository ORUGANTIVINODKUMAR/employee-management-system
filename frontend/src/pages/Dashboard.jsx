import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Receipt,
  LogOut,
  BadgeCheck,
  IdCard,
  Bell,
  Wallet,
  Moon,
  Sun,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../api/api";

import AdminSubcategories from "./AdminSubcategories";
import AdminUsers from "./AdminUsers";
import AdminLeaveReports from "./AdminLeaveReports";
import AdminReimbursementReports from "./AdminReimbursementReports";
import LeaveRequests from "./LeaveRequests";
import ApprovalRequests from "./ApprovalRequests";
import Reimbursements from "./Reimbursements";
import ReimbursementApprovals from "./ReimbursementApprovals";
import SignatureUploader from "../components/SignatureUploader";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const isAdmin = user?.role === "Admin";
  const isEmployee = user?.role === "Employee";
  const isManagerOrHR = ["Manager", "HR"].includes(user?.role);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data.stats);
        const notificationRes = await api.get("/notifications");
        setNotifications(notificationRes.data.notifications || []);

        localStorage.setItem(
          "leaveBalance",
          JSON.stringify(data.stats.leaveBalance)
        );
      } catch (error) {
        console.log(error.response?.data);
      }
    };

    fetchStats();
  }, []);
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const menuButton = (key, icon, label) => (
    <button
      className={activePage === key ? "active-menu" : ""}
      onClick={() => setActivePage(key)}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="dashboard-layout portal-redesign">
      <aside className="sidebar modern-sidebar">
        <div>
          <div className="brand-block">
            <div className="brand-icon">U</div>
            <div>
              <h2>Upsilon</h2>
              <span>WORKPLACE</span>
            </div>
          </div>

          <div className="sidebar-menu">
            {menuButton("dashboard", <LayoutDashboard size={18} />, "Dashboard")}

            {isAdmin && (
              <>
                {menuButton("departments", <Building2 size={18} />, "Departments")}
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

            {isEmployee &&
              menuButton("leave", <CalendarCheck size={18} />, "Leaves")}

            {isEmployee &&
              menuButton("reimbursements", <Receipt size={18} />, "Reimbursements")}

            {isManagerOrHR &&
              menuButton("approvals", <CalendarCheck size={18} />, "Leave Approvals")}

            {isManagerOrHR &&
              menuButton(
                "reimbursementApprovals",
                <Receipt size={18} />,
                "Reimbursement Approvals"
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
            {isEmployee ? "PERSONAL" : isAdmin ? "ADMIN" : "APPROVALS"}
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

                      <span className="active-pill">
                        <BadgeCheck size={14} />
                        Active
                      </span>
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

                    <div className="balance-row">
                      <span>Earned</span>

                      <strong>
                        {stats.leaveBalance?.earned?.remaining ?? 0} /{" "}
                        {stats.leaveBalance?.earned?.total ?? 0}
                      </strong>
                    </div>

                    <div className="balance-bar">
                      <span
                        style={{
                          width: `${((stats.leaveBalance?.earned?.remaining ?? 0) /
                            ((stats.leaveBalance?.earned?.total ?? 1))
                          ) * 100
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


                </div>
              </>
            )}

            {isAdmin && (
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
              </div>
            )}

            {isManagerOrHR && (
              <div className="modern-stats-grid">
                <div className="mini-stat-card">
                  <Users size={23} />
                  <span>Total Employees</span>
                  <h3>{stats.totalEmployees || 0}</h3>
                  <p>team members</p>
                </div>

                <div className="mini-stat-card">
                  <CalendarCheck size={23} />
                  <span>Leave Approvals</span>
                  <h3>{stats.pendingLeaves || 0}</h3>
                  <p>pending</p>
                </div>

                <div className="mini-stat-card">
                  <Receipt size={23} />
                  <span>Reimbursement Approvals</span>
                  <h3>{stats.pendingReimbursements || 0}</h3>
                  <p>pending</p>
                </div>

                <div className="mini-stat-card">
                  <BadgeCheck size={23} />
                  <span>Approval Role</span>
                  <h3>{user?.role}</h3>
                  <p>authorized</p>
                </div>
              </div>
            )}

            {!isAdmin && <SignatureUploader />}
          </>
        )}

        {activePage === "departments" && isAdmin && (
          <div className="modern-section-card">
            <AdminSubcategories />
          </div>
        )}

        {activePage === "users" && isAdmin && (
          <div className="modern-section-card">
            <AdminUsers />
          </div>
        )}

        {activePage === "leave" && isEmployee && (
          <div className="modern-section-card">
            <LeaveRequests />
          </div>
        )}

        {activePage === "reimbursements" && isEmployee && (
          <div className="modern-section-card">
            <Reimbursements />
          </div>
        )}

        {activePage === "approvals" && isManagerOrHR && (
          <div className="modern-section-card">
            <ApprovalRequests />
          </div>
        )}

        {activePage === "reimbursementApprovals" && isManagerOrHR && (
          <div className="modern-section-card">
            <ReimbursementApprovals />
          </div>
        )}
        {activePage === "leaveReports" && isAdmin && (
          <div className="modern-section-card">
            <AdminLeaveReports />
          </div>
        )}

        {activePage === "reimbursementReports" && isAdmin && (
          <div className="modern-section-card">
            <AdminReimbursementReports />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;