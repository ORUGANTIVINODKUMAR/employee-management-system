import { useEffect, useState } from "react";
import {
  ClipboardList,
} from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import api from "../api/api";

const AdminLeaveReports = () => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const REPORTS_PER_PAGE = 10;

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

  const filteredRequests = requests.filter(
    (item) => {
      const matchesFilter =
        activeFilter === "All"
          ? true
          : item.status === activeFilter;

      const search =
        searchTerm.toLowerCase();

      const matchesSearch =
        item.employeeId?.name
          ?.toLowerCase()
          .includes(search) ||
        item.employeeId?.email
          ?.toLowerCase()
          .includes(search) ||
        item.subcategoryId?.name
          ?.toLowerCase()
          .includes(search);

      return (
        matchesFilter && matchesSearch
      );
    }
  );

  const totalPages =
    Math.ceil(
      filteredRequests.length /
        REPORTS_PER_PAGE
    ) || 1;

  const startIndex =
    (currentPage - 1) *
    REPORTS_PER_PAGE;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      startIndex + REPORTS_PER_PAGE
    );

  const exportToExcel = () => {
    const exportData =
      filteredRequests.map((item) => ({
        Employee:
          item.employeeId?.name ||
          "N/A",

        Email:
          item.employeeId?.email ||
          "N/A",

        Department:
          item.subcategoryId?.name ||
          "N/A",

        LeaveType: item.leaveType,

        StartDate: new Date(
          item.startDate
        ).toLocaleDateString(),

        EndDate: new Date(
          item.endDate
        ).toLocaleDateString(),

        Status: item.status,

        ManagerApproval:
          item.approvals
            ?.managerStatus,

        HRApproval:
          item.approvals?.hrStatus,
      }));

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Leave Reports"
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

    const fileData = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }
    );

    saveAs(
      fileData,
      "Leave_Reports.xlsx"
    );
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Leave Reports
          </h2>

          <p className="section-subtitle">
            View all employee leave
            requests.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={exportToExcel}
        >
          Export Excel
        </button>
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <input
          type="text"
          placeholder="Search by employee, email or department..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(
              e.target.value
            );

            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border:
              "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
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
            onClick={() => {
              setActiveFilter(
                filter
              );

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
              <th>Department</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Approval Flow</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRequests.map(
              (item) => (
                <tr key={item._id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-circle">
                        <ClipboardList size={16} />
                      </div>

                      <div>
                        <strong>
                          {
                            item.employeeId
                              ?.name
                          }
                        </strong>

                        <p
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "var(--muted)",
                          }}
                        >
                          {
                            item.employeeId
                              ?.email
                          }
                        </p>
                      </div>
                    </div>
                  </td>

                  <td>
                    {item
                      .subcategoryId
                      ?.name ||
                      "N/A"}
                  </td>

                  <td>
                    {item.leaveType}
                  </td>

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
                        item.status ===
                        "Approved"
                          ? "badge badge-success"
                          : item.status ===
                            "Rejected"
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
                          item
                            .approvals
                            ?.managerStatus ===
                          "Approved"
                            ? "approval-approved"
                            : item
                                .approvals
                                ?.managerStatus ===
                              "Rejected"
                            ? "approval-rejected"
                            : "approval-pending"
                        }
                      >
                        Manager:{" "}
                        {item
                          .approvals
                          ?.managerStatus ||
                          "Pending"}
                      </span>

                      <span
                        className={
                          item
                            .approvals
                            ?.hrStatus ===
                          "Approved"
                            ? "approval-approved"
                            : item
                                .approvals
                                ?.hrStatus ===
                              "Rejected"
                            ? "approval-rejected"
                            : "approval-pending"
                        }
                      >
                        HR:{" "}
                        {item
                          .approvals
                          ?.hrStatus ||
                          "Pending"}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            )}

            {filteredRequests.length ===
              0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "24px",
                  }}
                >
                  No leave reports
                  found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredRequests.length >
        REPORTS_PER_PAGE && (
        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            alignItems: "center",
            gap: "10px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-primary"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              setCurrentPage(
                (prev) =>
                  prev - 1
              )
            }
          >
            Previous
          </button>

          {Array.from(
            {
              length: totalPages,
            },
            (_, index) => (
              <button
                key={index + 1}
                className={
                  currentPage ===
                  index + 1
                    ? "btn btn-primary"
                    : "btn"
                }
                onClick={() =>
                  setCurrentPage(
                    index + 1
                  )
                }
              >
                {index + 1}
              </button>
            )
          )}

          <button
            className="btn btn-primary"
            disabled={
              currentPage ===
              totalPages
            }
            onClick={() =>
              setCurrentPage(
                (prev) =>
                  prev + 1
              )
            }
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default AdminLeaveReports;