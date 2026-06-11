import { useEffect, useState } from "react";
import api from "../api/api";

const LeaveCalendar = () => {
  const [events, setEvents] = useState([]);
  const [todayLeaves, setTodayLeaves] = useState([]);
  const [activeView, setActiveView] = useState("Monthly");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateLeaves, setSelectedDateLeaves] = useState([]);

  const fetchCalendarData = async () => {
    try {
      const calendarRes = await api.get("/leave/calendar");
      const todayRes = await api.get("/leave/today-leaves");

      setEvents(calendarRes.data.calendarEvents || []);
      setTodayLeaves(todayRes.data.leaveRequests || []);
    } catch (error) {
      console.log(error.response?.data);
      alert(error.response?.data?.message || "Unable to load leave calendar");
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getLeaveColor = (leaveType) => {
    if (leaveType === "Sick") return "#ef4444";
    if (leaveType === "Vacation") return "#2563eb";
    if (leaveType === "Personal") return "#16a34a";
    if (leaveType === "Travel") return "#f59e0b";
    return "#64748b";
  };

  const isDateInLeaveRange = (date, event) => {
    const checkDate = new Date(date);
    const start = new Date(event.start);
    const end = new Date(event.end);

    checkDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return checkDate >= start && checkDate <= end;
  };

  const getWeekRange = () => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const filteredEvents = events.filter((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (activeView === "Daily") {
      return today >= start && today <= end;
    }

    if (activeView === "Weekly") {
      const { start: weekStart, end: weekEnd } = getWeekRange();
      return start <= weekEnd && end >= weekStart;
    }

    if (activeView === "Monthly") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      return start <= monthEnd && end >= monthStart;
    }

    return true;
  });

  const getMonthDays = () => {
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const openDateModal = (date) => {
    if (!date) return;

    const leaves = events.filter((event) =>
      isDateInLeaveRange(date, event)
    );

    setSelectedDate(date);
    setSelectedDateLeaves(leaves);
  };

  const monthDays = getMonthDays();

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Organization Leave Calendar</h2>
          <p className="section-subtitle">
            View manager-approved employee leaves across the organization.
          </p>
        </div>
      </div>

      <div className="modern-section-card">
        <h3>Today&apos;s Leaves</h3>

        {todayLeaves.length > 0 ? (
          <div className="modern-stats-grid">
            {todayLeaves.map((leave) => (
              <div className="mini-stat-card" key={leave._id}>
                <span>{leave.employeeId?.name}</span>
                <h3>{leave.leaveType}</h3>
                <p>
                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No employees are on leave today.</p>
        )}
      </div>

      <div className="leave-filter-tabs">
        {["Daily", "Weekly", "Monthly"].map((view) => (
          <button
            key={view}
            className={activeView === view ? "active-filter" : ""}
            onClick={() => setActiveView(view)}
          >
            {view}
          </button>
        ))}
      </div>

      <div className="modern-section-card">
        <h3>
          {activeView} View - {filteredEvents.length} Approved Leave
          {filteredEvents.length !== 1 ? "s" : ""}
        </h3>
      </div>

      {activeView === "Monthly" && (
        <div className="modern-section-card">
          <h3>
            {today.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                style={{
                  fontWeight: "700",
                  textAlign: "center",
                  padding: "10px",
                  color: "#64748b",
                }}
              >
                {day}
              </div>
            ))}

            {monthDays.map((date, index) => {
              const dayLeaves = date
                ? events.filter((event) => isDateInLeaveRange(date, event))
                : [];

              const isToday =
                date &&
                date.toDateString() === today.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => openDateModal(date)}
                  style={{
                    minHeight: "110px",
                    border: isToday
                      ? "2px solid #2563eb"
                      : "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "10px",
                    background: date ? "#ffffff" : "#f8fafc",
                    cursor: date ? "pointer" : "default",
                    boxShadow: date ? "0 8px 18px rgba(15,23,42,0.06)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "700",
                      marginBottom: "8px",
                      color: isToday ? "#2563eb" : "#0f172a",
                    }}
                  >
                    {date ? date.getDate() : ""}
                  </div>

                  {dayLeaves.slice(0, 3).map((event) => (
                    <div
                      key={`${event.id}-${event.employeeName}`}
                      style={{
                        background: getLeaveColor(event.leaveType),
                        color: "white",
                        borderRadius: "8px",
                        padding: "4px 6px",
                        fontSize: "12px",
                        marginBottom: "5px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={`${event.employeeName} - ${event.leaveType}`}
                    >
                      {event.employeeName}
                    </div>
                  ))}

                  {dayLeaves.length > 3 && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginTop: "4px",
                      }}
                    >
                      +{dayLeaves.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.employeeName}</td>
                <td>{event.department || "N/A"}</td>
                <td>{event.leaveType}</td>
                <td>{formatDate(event.start)}</td>
                <td>{formatDate(event.end)}</td>
                <td>
                  <span className="badge badge-success">
                    Approved by Manager
                  </span>
                </td>
              </tr>
            ))}

            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                  No approved leaves found for {activeView.toLowerCase()} view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDate && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: "600px",
              width: "90%",
            }}
          >
            <div className="modal-header">
              <h3>Leaves on {formatDate(selectedDate)}</h3>

              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedDateLeaves([]);
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {selectedDateLeaves.length > 0 ? (
                selectedDateLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "14px",
                      marginBottom: "12px",
                    }}
                  >
                    <strong>{leave.employeeName}</strong>
                    <p>{leave.leaveType}</p>
                    <p>
                      {formatDate(leave.start)} - {formatDate(leave.end)}
                    </p>
                    <span className="badge badge-success">
                      {leave.status}
                    </span>
                  </div>
                ))
              ) : (
                <p>No employees on leave for this date.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveCalendar;