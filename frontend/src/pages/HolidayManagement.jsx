import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CalendarDays,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const HolidayManagement = () => {
  const { user } = useAuth();

  const [holidays, setHolidays] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const canManageHolidays = ["Admin", "Manager", "HR"].includes(user?.role);

  const [formData, setFormData] = useState({
    name: "",
    holidayDate: "",
    type: "Company",
    description: "",
  });

  const fetchHolidays = async () => {
    try {
      const { data } = await api.get("/holidays");
      setHolidays(data.holidays || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to fetch holidays");
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      holidayDate: "",
      type: "Company",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageHolidays) {
      alert("You are not allowed to add holidays.");
      return;
    }

    try {
      await api.post("/holidays", formData);
      alert("Holiday added successfully");

      resetForm();
      setShowModal(false);
      fetchHolidays();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to add holiday");
    }
  };

  const handleDelete = async (id) => {
    if (!canManageHolidays) {
      alert("You are not allowed to delete holidays.");
      return;
    }

    if (!window.confirm("Delete this holiday?")) return;

    try {
      await api.delete(`/holidays/${id}`);
      fetchHolidays();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete holiday");
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getDay = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
    });

  const getMonth = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      month: "short",
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingHolidays = holidays.filter((item) => {
    const holidayDate = new Date(item.holidayDate);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  });

  const nextHoliday = upcomingHolidays[0];

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Holiday Calendar</h2>
          <p className="section-subtitle">
            View company, national and festival holidays.
          </p>
        </div>

        {canManageHolidays && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            Add Holiday
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #064e3b, #16a34a)",
            borderRadius: "24px",
            padding: "28px",
            color: "white",
            minHeight: "190px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 20px 50px rgba(22, 163, 74, 0.22)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                opacity: 0.85,
              }}
            >
              Next Holiday
            </span>

            <h2 style={{ fontSize: "36px", margin: "12px 0 8px" }}>
              {nextHoliday?.name || "No Upcoming Holiday"}
            </h2>

            <p style={{ fontSize: "16px", opacity: 0.9 }}>
              {nextHoliday
                ? `${formatDate(nextHoliday.holidayDate)} • ${nextHoliday.type}`
                : "No upcoming holiday configured yet."}
            </p>
          </div>

          <div
            style={{
              width: "105px",
              height: "105px",
              borderRadius: "28px",
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            <strong style={{ fontSize: "34px" }}>
              {nextHoliday ? getDay(nextHoliday.holidayDate) : "--"}
            </strong>
            <span style={{ fontSize: "15px", fontWeight: "700" }}>
              {nextHoliday ? getMonth(nextHoliday.holidayDate) : "---"}
            </span>
          </div>
        </div>

        <div className="reimbursement-summary-card">
          <span>Your Access</span>
          <h3>{canManageHolidays ? "Manage" : "View Only"}</h3>
          <p>{user?.role}</p>

          <div style={{ marginTop: "18px" }}>
            <ShieldCheck size={22} />
            <p>
              {canManageHolidays
                ? "You can add and remove holidays."
                : "You can view the holiday calendar."}
            </p>
          </div>
        </div>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Holidays</span>
          <h3>{holidays.length}</h3>
          <p>configured</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Upcoming Holidays</span>
          <h3>{upcomingHolidays.length}</h3>
          <p>from today</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Calendar Type</span>
          <h3>Company</h3>
          <p>shared across roles</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "18px",
          marginTop: "24px",
        }}
      >
        {holidays.map((holiday) => (
          <div
            key={holiday._id}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "18px",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "58px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "#ecfdf5",
                  color: "#047857",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <strong style={{ fontSize: "22px" }}>
                  {getDay(holiday.holidayDate)}
                </strong>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>
                  {getMonth(holiday.holidayDate)}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: "18px" }}>
                  {holiday.name}
                </h3>

                <span className="badge badge-success">{holiday.type}</span>
              </div>

              <Sparkles size={18} color="#16a34a" />
            </div>

            <p
              style={{
                marginTop: "16px",
                color: "#64748b",
                minHeight: "36px",
              }}
            >
              {holiday.description || "No description added."}
            </p>

            <div
              style={{
                marginTop: "14px",
                paddingTop: "14px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <small style={{ color: "#64748b" }}>
                Created by {holiday.createdBy?.name || "N/A"}
              </small>

              {canManageHolidays ? (
                <button
                  className="delete-icon-btn"
                  onClick={() => handleDelete(holiday._id)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              ) : (
                <span className="badge badge-success">View Only</span>
              )}
            </div>
          </div>
        ))}

        {holidays.length === 0 && (
          <div className="modern-section-card">
            <CalendarDays size={28} />
            <h3>No holidays found</h3>
            <p>Add company holidays to display them here.</p>
          </div>
        )}
      </div>

      {showModal && canManageHolidays && (
        <div className="modal-overlay">
          <div className="modal-card modern-department-modal">
            <div className="modal-header">
              <h3>Add Holiday</h3>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Holiday Name</label>

                <input
                  name="name"
                  placeholder="Example: Diwali"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Holiday Date</label>

                <input
                  type="date"
                  name="holidayDate"
                  value={formData.holidayDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Holiday Type</label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="Company">Company</option>
                  <option value="National">National</option>
                  <option value="Festival">Festival</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>

              <div className="input-group">
                <label>Description</label>

                <textarea
                  name="description"
                  rows="3"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <button className="btn btn-primary" type="submit">
                Create Holiday
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default HolidayManagement;