import { useEffect, useState } from "react";
import {
  Users,
  Clock,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

import api from "../api/api";

const AdminAttendanceReports = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const RECORDS_PER_PAGE = 10;

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get("/attendance/all");
      setRecords(data.attendanceRecords || []);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to fetch attendance records"
      );
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredRecords = records.filter((record) => {
    const matchesFilter =
      activeFilter === "All"
        ? true
        : record.status === activeFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      record.employeeId?.name?.toLowerCase().includes(search) ||
      record.employeeId?.email?.toLowerCase().includes(search) ||
      record.employeeId?.employeeId?.toLowerCase().includes(search) ||
      record.status?.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  const totalPages =
    Math.ceil(filteredRecords.length / RECORDS_PER_PAGE) || 1;

  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;

  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + RECORDS_PER_PAGE
  );

  const presentCount = records.filter(
    (item) => item.status === "Present"
  ).length;

  const lateCount = records.filter(
    (item) => item.status === "Late"
  ).length;

  const halfDayCount = records.filter(
    (item) => item.status === "Half Day"
  ).length;

  const totalHours = records.reduce(
    (sum, item) => sum + Number(item.totalHours || 0),
    0
  );

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Attendance Reports</h2>
          <p className="section-subtitle">
            View employee check-in, check-out and attendance records.
          </p>
        </div>
      </div>

      <div className="modern-stats-grid">
        <div className="mini-stat-card">
          <Users size={22} />
          <span>Total Records</span>
          <h3>{records.length}</h3>
          <p>attendance entries</p>
        </div>

        <div className="mini-stat-card">
          <BadgeCheck size={22} />
          <span>Present</span>
          <h3>{presentCount}</h3>
          <p>on time</p>
        </div>

        <div className="mini-stat-card">
          <AlertTriangle size={22} />
          <span>Late</span>
          <h3>{lateCount}</h3>
          <p>late arrivals</p>
        </div>

        <div className="mini-stat-card">
          <Clock size={22} />
          <span>Total Hours</span>
          <h3>{totalHours.toFixed(2)}</h3>
          <p>worked</p>
        </div>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          placeholder="Search by employee, email, employee ID or status..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="leave-filter-tabs">
        {["All", "Present", "Late", "Half Day"].map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? "active-filter" : ""}
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Total Hours</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRecords.map((record) => (
              <tr key={record._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      {record.employeeId?.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <strong>{record.employeeId?.name}</strong>
                      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {record.employeeId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td>{record.employeeId?.employeeId || "N/A"}</td>
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

            {filteredRecords.length === 0 && (
              <tr>
                <td
                  colSpan="7"
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

      {filteredRecords.length > RECORDS_PER_PAGE && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={currentPage === index + 1 ? "btn btn-primary" : "btn"}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="btn btn-primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default AdminAttendanceReports;