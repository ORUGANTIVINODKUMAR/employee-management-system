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
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("All");
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
  const employees = [
    ...new Map(
      requests
        .filter((item) => item.employeeId?._id)
        .map((item) => [
          item.employeeId._id,
          item.employeeId,
        ])
    ).values(),
  ];
  const filteredRequests = requests.filter((item) => {
    const matchesFilter =
      activeFilter === "All" ? true : item.finalStatus === activeFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      item.employeeId?.name?.toLowerCase().includes(search) ||
      item.employeeId?.email?.toLowerCase().includes(search) ||
      item.subcategoryId?.name?.toLowerCase().includes(search);

    const matchesEmployee =
      selectedEmployee === "All"
        ? true
        : item.employeeId?._id === selectedEmployee;

    const itemMonth = item.startDate
      ? new Date(item.startDate).toISOString().slice(0, 7)
      : "";

    const matchesMonth =
      selectedMonth === "" ? true : itemMonth === selectedMonth;

    return matchesFilter && matchesSearch && matchesEmployee && matchesMonth;
  });

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
        HRStatus: item.hrStatus,
        FinalStatus: item.finalStatus,
        TLStatus: item.tlStatus,
        ManagerStatus: item.managerStatus,

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
      `Leave_Reports${selectedMonth ? `_${selectedMonth}` : ""}.xlsx`
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


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Filter by Month
          </label>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              marginTop: "6px",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: "600" }}>
            Filter by Employee
          </label>

          <select
            value={selectedEmployee}
            onChange={(e) => {
              setSelectedEmployee(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              marginTop: "6px",
            }}
          >
            <option value="All">All Employees</option>

            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name} - {employee.email}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "end" }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedMonth("");
              setSelectedEmployee("All");
              setSearchTerm("");
              setActiveFilter("All");
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>





      <div className="leave-filter-tabs">
        {[
          "All",
          "Pending Final Approval",
          "Approved by Manager",
          "Approved by HR",
          "Rejected by Manager",
          "Rejected by HR",
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
              <th>Rejection Reason</th>
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
                        [
                          "Approved by Manager",
                          "Approved by HR",
                        ].includes(item.finalStatus)
                          ? "badge badge-success"
                          : item.finalStatus?.includes(
                            "Rejected"
                          )
                            ? "badge badge-danger"
                            : "badge badge-pending"
                      }
                    >
                      {item.finalStatus}
                    </span>
                  </td>

                  <td>
                    <div className="approval-flow">
                      <span>
                        TL: {item.tlStatus}
                      </span>

                      <span>
                        Manager: {item.managerStatus}
                      </span>

                      <span>
                        HR: {item.hrStatus}
                      </span>
                    </div>
                  </td>
                  <td>
                    {item.rejectionReason || "-"}
                  </td>
                </tr>
              )
            )}

            {filteredRequests.length ===
              0 && (
                <tr>
                  <td
                    colSpan="7"
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
