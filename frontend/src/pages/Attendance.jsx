import { useEffect, useState } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  CalendarCheck,
} from "lucide-react";

import api from "../api/api";

const Attendance = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const todayRes = await api.get("/attendance/today");
      const historyRes = await api.get("/attendance/my-attendance");

      setTodayAttendance(todayRes.data.attendance || null);
      setAttendanceRecords(historyRes.data.attendanceRecords || []);
    } catch (error) {
      console.log(error.response?.data);
      alert(error.response?.data?.message || "Unable to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    try {
      await api.post("/attendance/check-in");
      alert("Checked in successfully.");
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post("/attendance/check-out");
      alert("Checked out successfully.");
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Check-out failed");
    }
  };

  const formatTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="modern-section-card">
        <p>Loading attendance...</p>
      </div>
    );
  }

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Attendance</h2>
          <p className="section-subtitle">
            Check in, check out and track your daily attendance.
          </p>
        </div>
      </div>

      <div className="modern-stats-grid">
        <div className="mini-stat-card">
          <Clock size={23} />
          <span>Today Status</span>
          <h3>{todayAttendance?.status || "Not Checked In"}</h3>
          <p>{formatDate(new Date())}</p>
        </div>

        <div className="mini-stat-card">
          <LogIn size={23} />
          <span>Check In</span>
          <h3>{formatTime(todayAttendance?.checkInTime)}</h3>
          <p>today</p>
        </div>

        <div className="mini-stat-card">
          <LogOut size={23} />
          <span>Check Out</span>
          <h3>{formatTime(todayAttendance?.checkOutTime)}</h3>
          <p>today</p>
        </div>

        <div className="mini-stat-card">
          <CalendarCheck size={23} />
          <span>Total Hours</span>
          <h3>{todayAttendance?.totalHours || 0}</h3>
          <p>worked today</p>
        </div>
      </div>

      <div
        className="modern-section-card"
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-primary"
          onClick={handleCheckIn}
          disabled={!!todayAttendance?.checkInTime}
        >
          <LogIn size={16} />
          Check In
        </button>

        <button
          className="btn btn-primary"
          onClick={handleCheckOut}
          disabled={
            !todayAttendance?.checkInTime ||
            !!todayAttendance?.checkOutTime
          }
        >
          <LogOut size={16} />
          Check Out
        </button>
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Total Hours</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record._id}>
                <td>{formatDate(record.attendanceDate)}</td>
                <td>{formatTime(record.checkInTime)}</td>
                <td>{formatTime(record.checkOutTime)}</td>
                <td>{record.totalHours || 0}</td>
                <td>
                  <span
                    className={
                      record.status === "Present"
                        ? "badge badge-success"
                        : record.status === "Late"
                        ? "badge badge-pending"
                        : "badge badge-danger"
                    }
                  >
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}

            {attendanceRecords.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Attendance;