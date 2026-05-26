import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  ClipboardList,

} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const ApprovalRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/leave/pending");
      setRequests(data.leaveRequests);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to fetch approvals"
      );
      console.log(error.response?.data);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);
  const filteredRequests =
    activeFilter === "All"
      ? requests
      : requests.filter((item) => item.status === activeFilter);

  const pendingCount = requests.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "Rejected"
  ).length;

  const handleDecision = async (id, decision) => {
    try {
      const { data } = await api.put(`/leave/approve/${id}`, {
        decision,
      });

      alert(
        data.leaveRequest.status === "Pending"
          ? "Your approval is recorded. Waiting for the other approver."
          : `Leave ${data.leaveRequest.status}`
      );

      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Approval failed");
      console.log(error.response?.data);
    }
  };

  const hasCurrentUserActed = (item) => {
    if (user?.role === "Manager") {
      return item.approvals?.managerStatus !== "Pending";
    }

    if (user?.role === "HR") {
      return item.approvals?.hrStatus !== "Pending";
    }

    return true;
  };

  const getCurrentUserActionLabel = (item) => {
    if (user?.role === "Manager") {
      return item.approvals?.managerStatus === "Approved"
        ? "Approved By You"
        : "Rejected By You";
    }

    if (user?.role === "HR") {
      return item.approvals?.hrStatus === "Approved"
        ? "Approved By You"
        : "Rejected By You";
    }

    return "";
  };

  const getCurrentUserActionClass = (item) => {
    if (user?.role === "Manager") {
      return item.approvals?.managerStatus === "Approved"
        ? "badge badge-success"
        : "badge badge-danger";
    }

    if (user?.role === "HR") {
      return item.approvals?.hrStatus === "Approved"
        ? "badge badge-success"
        : "badge badge-danger";
    }

    return "badge badge-pending";
  };

  const printLeaveForm = (item) => {
    const win = window.open("", "_blank");

    win.document.write(`
      <html>
        <head>
          <title>Leave Request Form</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #0f172a;
            }

            h1 {
              color: #0f3d2e;
              margin-bottom: 5px;
            }

            .subtitle {
              color: #64748b;
              margin-bottom: 30px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th {
              background: #0f3d2e;
              color: white;
              text-align: left;
              padding: 12px;
            }

            td {
              border: 1px solid #cbd5e1;
              padding: 12px;
            }

            .section-title {
              margin-top: 30px;
              font-size: 18px;
              color: #0f3d2e;
              font-weight: bold;
            }

            .footer {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }

            .signature {
              width: 220px;
              border-top: 1px solid #0f172a;
              padding-top: 8px;
              text-align: center;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <h1>Upsilon Services</h1>
          <p class="subtitle">Employee Leave Request Form</p>

          <div class="section-title">Employee Information</div>

          <table>
            <tr>
              <th>Field</th>
              <th>Details</th>
            </tr>

            <tr>
              <td>Employee Name</td>
              <td>${item.employeeId?.name || "N/A"}</td>
            </tr>

            <tr>
              <td>Email</td>
              <td>${item.employeeId?.email || "N/A"}</td>
            </tr>

            <tr>
              <td>Employee ID</td>
              <td>${item.employeeId?.employeeId || "N/A"}</td>
            </tr>

            <tr>
              <td>Designation</td>
              <td>${item.employeeId?.designation || "N/A"}</td>
            </tr>

            <tr>
              <td>Department</td>
              <td>${item.subcategoryId?.name || "N/A"}</td>
            </tr>
          </table>

          <div class="section-title">Leave Details</div>

          <table>
            <tr>
              <td>Leave Type</td>
              <td>${item.leaveType}</td>
            </tr>

            <tr>
              <td>Start Date</td>
              <td>${new Date(item.startDate).toLocaleDateString()}</td>
            </tr>

            <tr>
              <td>End Date</td>
              <td>${new Date(item.endDate).toLocaleDateString()}</td>
            </tr>

            <tr>
              <td>Working Days</td>
              <td>${item.workingDays || 0}</td>
            </tr>

            <tr>
              <td>Reason</td>
              <td>${item.reason || "N/A"}</td>
            </tr>

            <tr>
              <td>Proof / Receipt</td>
              <td>${item.proofFile ? "Attached" : "N/A"}</td>
            </tr>
          </table>

          <div class="section-title">Approval Status</div>

          <table>
            <tr>
              <td>Manager Approval</td>
              <td>${item.approvals?.managerStatus || "Pending"}</td>
            </tr>

            <tr>
              <td>HR Approval</td>
              <td>${item.approvals?.hrStatus || "Pending"}</td>
            </tr>

            <tr>
              <td>Final Status</td>
              <td>${item.status}</td>
            </tr>
          </table>

          <div class="footer">
            <div class="signature">Manager Signature</div>
            <div class="signature">HR Signature</div>
            <div class="signature">Date</div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Approval Requests</h2>
          <p className="section-subtitle">
            Review pending and completed leave applications.
          </p>
        </div>
      </div>
      <div className="reimbursement-summary-grid">

        <div className="reimbursement-summary-card">
          <span>Total Requests</span>
          <h3>{requests.length}</h3>
          <p>leave applications</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Pending</span>
          <h3>{pendingCount}</h3>
          <p>awaiting review</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Approved</span>
          <h3>{approvedCount}</h3>
          <p>completed</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Rejected</span>
          <h3>{rejectedCount}</h3>
          <p>declined</p>
        </div>

      </div>

      <div className="leave-filter-tabs">
        {["All", "Pending", "Approved", "Rejected"].map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? "active-filter" : ""}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === "All" ? "All Requests" : filter}
          </button>
        ))}
      </div>
      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Proof</th>
              <th>Status</th>
              <th>Your Action</th>
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
                      <strong>{item.employeeId?.name}</strong>
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

                <td>{item.leaveType}</td>

                <td>
                  {new Date(item.startDate).toLocaleDateString()} -{" "}
                  {new Date(item.endDate).toLocaleDateString()}
                </td>
                <td>
                  {item.proofFile ? (
                    <a
                      href={item.proofFile}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      View Proof
                    </a>
                  ) : (
                    "N/A"
                  )}
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
                  <div className="action-buttons">
                    {hasCurrentUserActed(item) ? (
                      <span className={getCurrentUserActionClass(item)}>
                        {getCurrentUserActionLabel(item)}
                      </span>
                    ) : (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() =>
                            handleDecision(item._id, "Approved")
                          }
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() =>
                            handleDecision(item._id, "Rejected")
                          }
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  <div className="approval-flow">
                    <span
                      className={
                        item.approvals?.managerStatus === "Approved"
                          ? "approval-approved"
                          : item.approvals?.managerStatus === "Rejected"
                            ? "approval-rejected"
                            : "approval-pending"
                      }
                    >
                      Manager: {item.approvals?.managerStatus || "Pending"}
                    </span>

                    <span
                      className={
                        item.approvals?.hrStatus === "Approved"
                          ? "approval-approved"
                          : item.approvals?.hrStatus === "Rejected"
                            ? "approval-rejected"
                            : "approval-pending"
                      }
                    >
                      HR: {item.approvals?.hrStatus || "Pending"}
                    </span>
                  </div>
                </td>

              </tr>
            ))}

            {filteredRequests.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No leave approval requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ApprovalRequests;