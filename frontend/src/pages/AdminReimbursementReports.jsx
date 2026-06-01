import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import api from "../api/api";

const AdminReimbursementReports = () => {
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
        "/admin/reimbursement-reports"
      );

      setRequests(data.reimbursements || []);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to fetch reimbursement reports"
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
        item.businessPurpose
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
      filteredRequests.map(
        (item) => ({
          Employee:
            item.employeeId?.name ||
            "N/A",

          Email:
            item.employeeId?.email ||
            "N/A",

          BusinessPurpose:
            item.businessPurpose,

          TotalAmount:
            item.totalReimbursement,

          Status: item.status,

          FinanceStatus:
            item.financeStatus,

          ManagerApproval:
            item.approvals
              ?.managerStatus,

          HRApproval:
            item.approvals?.hrStatus,

          SubmittedDate: new Date(
            item.createdAt
          ).toLocaleDateString(),
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Reimbursement Reports"
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
      "Reimbursement_Reports.xlsx"
    );
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Reimbursement Reports
          </h2>

          <p className="section-subtitle">
            View all employee reimbursement requests.
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
          placeholder="Search by employee, email or business purpose..."
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
              <th>Business Purpose</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Finance</th>
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
                        <Receipt size={16} />
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
                    {
                      item.businessPurpose
                    }
                  </td>

                  <td>
                    ₹{" "}
                    {
                      item.totalReimbursement
                    }
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
                    <span
                      className={
                        item.financeStatus ===
                        "Paid"
                          ? "badge badge-success"
                          : item.financeStatus ===
                            "Pending Payment"
                          ? "badge badge-pending"
                          : "badge badge-danger"
                      }
                    >
                      {
                        item.financeStatus
                      }
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
                          item.approvals
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
                        {item.approvals
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
                  No reimbursement reports found.
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

export default AdminReimbursementReports;