import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Receipt,
  Printer,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const ReimbursementApprovals = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/reimbursements/pending");
      setRequests(data.reimbursements);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to fetch reimbursement approvals"
      );
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

  const totalAmount = requests.reduce(
    (sum, item) =>
      sum + Number(item.totalReimbursement || 0),
    0
  );
  const handleDecision = async (id, decision) => {
    try {
      const { data } = await api.put(`/reimbursements/approve/${id}`, {
        decision,
      });

      alert(
        data.reimbursement.status === "Pending"
          ? "Your approval is recorded. Waiting for the other approver."
          : `Reimbursement ${data.reimbursement.status}`
      );

      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Approval failed");
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

  const getActionLabel = (item) => {
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

  const getActionClass = (item) => {
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

  const printReimbursementForm = (item) => {
    const employeeSignature = item.employeeId?.signatureFile
      ? `http://localhost:5000${item.employeeId.signatureFile}`
      : "";

    const managerSignature =
      item.approvals?.managerApprovedBy?.signatureFile
        ? `http://localhost:5000${item.approvals.managerApprovedBy.signatureFile}`
        : "";

    const hrSignature =
      item.approvals?.hrApprovedBy?.signatureFile
        ? `http://localhost:5000${item.approvals.hrApprovedBy.signatureFile}`
        : "";



    const itemRows =
      item.items
        ?.map(
          (expense) => `
        <tr>
          <td>${expense.description}</td>
          <td>${expense.category}</td>
          <td>₹ ${expense.cost}</td>
        </tr>
      `
        )
        .join("") || "";

    const win = window.open("", "_blank");

    win.document.write(`
    <html>
      <head>
        <title>Expense Reimbursement Form</title>

        <style>
          @page {
            size: A4 portrait;
            margin: 20mm;
          }

          body {
            font-family: Arial, sans-serif;
            color: #111827;
            padding: 30px;
          }

          .header-title {
            font-size: 42px;
            color: #6d7dbb;
            font-weight: bold;
            margin-bottom: 40px;
          }

          .top-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }

          .employee-box {
            width: 60%;
          }

          .period-box {
            width: 30%;
          }

          .line-row {
            display: flex;
            margin-bottom: 10px;
            align-items: center;
          }

          .line-row label {
            width: 130px;
            font-size: 15px;
          }

          .line-value {
            border: 1px solid #222;
            padding: 6px 10px;
            flex: 1;
            min-height: 18px;
          }

          .period-table {
            width: 100%;
            border-collapse: collapse;
          }

          .period-table th {
            background: #5c6ca8;
            color: white;
            padding: 8px;
            font-size: 14px;
          }

          .period-table td {
            border: 1px solid #222;
            padding: 8px;
            text-align: center;
          }

          .purpose-box {
            margin-top: 20px;
            margin-bottom: 40px;
          }

          .purpose-box label {
            display: block;
            margin-bottom: 8px;
          }

          .purpose-value {
            border: 1px solid #222;
            min-height: 50px;
            padding: 10px;
          }

          .section-title {
            font-size: 26px;
            margin-bottom: 10px;
          }

          .expense-table {
            width: 100%;
            border-collapse: collapse;
          }

          .expense-table th {
            background: #4f5f9c;
            color: white;
            padding: 10px;
            font-size: 14px;
          }

          .expense-table td {
            border: 1px solid #222;
            padding: 8px;
            font-size: 14px;
          }

          .summary-box {
            width: 320px;
            margin-left: auto;
            margin-top: 20px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 16px;
          }

          .summary-total {
            font-size: 22px;
            font-weight: bold;
          }

          .receipt-note {
            margin-top: 10px;
            font-weight: bold;
            text-align: right;
          }

          .signature-section {
            margin-top: 70px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 35px;
            align-items: end;
          }

          .signature-box {
            text-align: center;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }

          .signature-box img {
            max-width: 180px;
            max-height: 65px;
            object-fit: contain;
            margin: 0 auto 12px auto;
          }

          .signature-line {
            border-top: 1px solid #111;
            padding-top: 8px;
            font-weight: bold;
          }

          .receipt-section {
            margin-top: 80px;
            page-break-before: always;
          }

          .receipt-title {
            font-size: 28px;
            margin-bottom: 30px;
            color: #0f3d2e;
            font-weight: bold;
          }

          .receipt-preview {
            width: 100%;
            border: 1px solid #cbd5e1;
            padding: 20px;
            border-radius: 10px;
          }

          .receipt-preview img {
            width: 100%;
            object-fit: contain;
          }

          .receipt-link {
            font-size: 18px;
            color: #2563eb;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>

        <div class="header-title">
          Expense Reimbursement Form
        </div>

        <div class="top-section">

          <div class="employee-box">

            <div class="line-row">
              <label>Employee Name:</label>
              <div class="line-value">
                ${item.employeeId?.name || ""}
              </div>
            </div>

            <div class="line-row">
              <label>Employee ID:</label>
              <div class="line-value">
                ${item.employeeId?.employeeId || ""}
              </div>
            </div>

          </div>

          <div class="period-box">

            <table class="period-table">
              <tr>
                <th colspan="2">Expense Period</th>
              </tr>

              <tr>
                <td>From:</td>
                <td>
                  ${new Date(item.expenseFrom).toLocaleDateString()}
                </td>
              </tr>

              <tr>
                <td>To:</td>
                <td>
                  ${new Date(item.expenseTo).toLocaleDateString()}
                </td>
              </tr>
            </table>

          </div>
        </div>

        <div class="purpose-box">
          <label>Business Purpose:</label>

          <div class="purpose-value">
            ${item.businessPurpose || ""}
          </div>
        </div>

        <div class="section-title">
          Itemized Expenses
        </div>

        <table class="expense-table">

          <tr>
            <th>DESCRIPTION</th>
            <th>CATEGORY</th>
            <th>COST</th>
          </tr>

          ${itemRows}

        </table>

        <div class="summary-box">

          <div class="summary-row">
            <span>SUBTOTAL</span>
            <span>₹ ${item.subtotal}</span>
          </div>

          <div class="summary-row">
            <span>Less Cash Advance</span>
            <span>₹ ${item.lessCashAdvance || 0}</span>
          </div>

          <div class="summary-row summary-total">
            <span>TOTAL REIMBURSEMENT</span>
            <span>₹ ${item.totalReimbursement}</span>
          </div>

          <div class="receipt-note">
            Don't forget to attach receipts!
          </div>

        </div>

        <div class="signature-section">

          <div class="signature-box">
            ${employeeSignature
        ? `<img src="${employeeSignature}" />`
        : ""
      }

            <div class="signature-line">
              Employee Signature
            </div>
          </div>

          <div class="signature-box">
            ${managerSignature
        ? `<img src="${managerSignature}" />`
        : ""
      }

            <div class="signature-line">
              Manager Signature
            </div>
          </div>

          <div class="signature-box">
            ${hrSignature
        ? `<img src="${hrSignature}" />`
        : ""
      }

            <div class="signature-line">
              HR Signature
            </div>
          </div>

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
          <h2 className="card-title">Reimbursement Approvals</h2>
          <p className="section-subtitle">
            Review employee reimbursement claims.
          </p>
        </div>
      </div>
      <div className="reimbursement-summary-grid">

        <div className="reimbursement-summary-card">
          <span>Total Claims</span>
          <h3>{requests.length}</h3>
          <p>submitted</p>
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
          <span>Total Amount</span>
          <h3>₹ {totalAmount}</h3>
          <p>claims value</p>
        </div>

      </div>

      <div className="leave-filter-tabs">
        {["All", "Pending", "Approved", "Rejected"].map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? "active-filter" : ""}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === "All" ? "All Claims" : filter}
          </button>
        ))}
      </div>
      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Purpose</th>
              <th>Total</th>
              <th>Receipt</th>
              <th>Status</th>
              <th>Your Action</th>
              <th>Print</th>
              <th>Approval Flow</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <Receipt size={16} />
                    </div>

                    <div>
                      <strong>{item.employeeId?.name}</strong>
                      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {item.employeeId?.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td>{item.businessPurpose}</td>

                <td>₹ {item.totalReimbursement}</td>

                <td>
                  {item.receiptFile ? (
                    <a
                      href={`http://localhost:5000${item.receiptFile}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      View Receipt
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
                      <span className={getActionClass(item)}>
                        {getActionLabel(item)}
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
                  {["Manager", "HR"].includes(user?.role) && (
                    <button
                      className="print-btn"
                      onClick={() => printReimbursementForm(item)}
                    >
                      <Printer size={16} />
                      Print Form
                    </button>
                  )}
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
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No reimbursement requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ReimbursementApprovals;