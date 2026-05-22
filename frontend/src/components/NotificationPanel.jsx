import { useEffect, useState } from "react";

import {
  Bell,
  CheckCircle2,
} from "lucide-react";

import api from "../api/api";

const NotificationPanel = () => {
  const [notifications, setNotifications] =
    useState([]);

  const fetchNotifications =
    async () => {
      try {
        const { data } = await api.get(
          "/notifications"
        );

        setNotifications(
          data.notifications
        );
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(
        `/notifications/${id}/read`
      );

      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Notifications
          </h2>

          <p className="section-subtitle">
            Recent workflow updates.
          </p>
        </div>

        <Bell size={22} />
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            No notifications available.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              className={`notification-item ${
                item.isRead
                  ? "read-notification"
                  : ""
              }`}
            >
              <div>
                <h4>{item.title}</h4>

                <p>{item.message}</p>

                <small>
                  {new Date(
                    item.createdAt
                  ).toLocaleString()}
                </small>
              </div>

              {!item.isRead && (
                <button
                  className="mark-read-btn"
                  onClick={() =>
                    markAsRead(item._id)
                  }
                >
                  <CheckCircle2
                    size={16}
                  />
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;