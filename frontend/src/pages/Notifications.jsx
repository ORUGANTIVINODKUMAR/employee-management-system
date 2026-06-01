import { useEffect, useState } from "react";
import { Bell, CheckCircle } from "lucide-react";
import api from "../api/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await api.put("/notifications/read-all");
    fetchNotifications();
  };

  const filteredNotifications = notifications.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.title?.toLowerCase().includes(search) ||
      item.message?.toLowerCase().includes(search)
    );
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Notifications</h2>
          <p className="section-subtitle">
            View all system updates, approvals and alerts.
          </p>
        </div>

        <button className="btn btn-primary" onClick={markAllAsRead}>
          Mark All Read
        </button>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Notifications</span>
          <h3>{notifications.length}</h3>
          <p>all time</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Unread</span>
          <h3>{unreadCount}</h3>
          <p>needs attention</p>
        </div>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="modern-section-card">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <div
              key={item._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "12px",
                background: item.isRead ? "#ffffff" : "#eff6ff",
              }}
            >
              <div className="user-cell">
                <div className="avatar-circle">
                  <Bell size={16} />
                </div>

                <div style={{ flex: 1 }}>
                  <strong>{item.title}</strong>
                  <p style={{ marginTop: "6px" }}>{item.message}</p>
                  <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                {!item.isRead && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => markAsRead(item._id)}
                  >
                    <CheckCircle size={15} />
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No notifications found.</p>
        )}
      </div>
    </>
  );
};

export default Notifications;