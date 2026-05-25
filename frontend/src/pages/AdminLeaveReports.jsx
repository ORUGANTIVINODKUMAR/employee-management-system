import { useEffect, useState } from "react";
import {
  ClipboardList,
  CalendarCheck,
} from "lucide-react";

import api from "../api/api";

const AdminLeaveReports = () => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchReports = async () => {
    try {
      const { data } = await api.get(
        "/admin/leave-reports"
      );

      setRequests(data.leaveRequests);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to fetch leave reports"
      );
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredRequests =
    activeFilter === "All"
      ? requests
      : requests.filter(
          (item) => item.status === activeFilter
        );

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Leave Reports
          </h2>

          <p className="section-subtitle">
            View all employee leave requests.
          </p>
        </div>
      </div>

      <div className="leave-filter-tabs">
        {[
          "All",
          "Pending",
          "Approved",
          "Rejected",
        ].map((filter) => (
          <button
            key={filter}
            className={
              activeFilter === filter
                ? "active-filter"
                : ""
            }
            onClick={() =>
              setActiveFilter(filter)
            }
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
              <th>Department</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Approval Flow</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <ClipboardList size={16} />
                    </div>

                    <div>
                      <strong>
                        {item.employeeId?.name}
                      </strong>

                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--muted)",
                        }}
                      >
                        {item.employeeId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td>
                  {item.subcategoryId?.name ||
                    "N/A"}
                </td>

                <td>{item.leaveType}</td>

                <td>
                  {new Date(
                    item.startDate
                  ).toLocaleDateString()}
                  {" - "}
                  {new Date(
                    item.endDate
                  ).toLocaleDateString()}
                </td>

                <td>
                  <span
                    className={
                      item.status === "Approved"
                        ? "badge badge-success"
                        : item.status === "Rejected"
                        ? "badge badge-danger"
                        : "badge badge-pending"
                    }
                  >
                    {item.status}
                  </span>
                </td>

                <td>
                  <div className="approval-flow">
                    <span
                      className={
                        item.approvals
                          ?.managerStatus ===
                        "Approved"
                          ? "approval-approved"
                          : item.approvals
                              ?.managerStatus ===
                            "Rejected"
                          ? "approval-rejected"
                          : "approval-pending"
                      }
                    >
                      Manager:{" "}
                      {item.approvals
                        ?.managerStatus ||
                        "Pending"}
                    </span>

                    <span
                      className={
                        item.approvals?.hrStatus ===
                        "Approved"
                          ? "approval-approved"
                          : item.approvals
                              ?.hrStatus ===
                            "Rejected"
                          ? "approval-rejected"
                          : "approval-pending"
                      }
                    >
                      HR:{" "}
                      {item.approvals?.hrStatus ||
                        "Pending"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {filteredRequests.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No leave reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminLeaveReports;