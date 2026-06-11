import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  ClipboardList,
  X,
} from "lucide-react";

import api from "../api/api";

const ManagerApprovals = () => {
  const [historyRequests, setHistoryRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectLeaveId, setRejectLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/leave/manager-pending");
      setRequests(data.leaveRequests || []);
    } catch (error) {
      console.log(error.response?.data);
    }
  };
  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/leave/manager-history");

      setHistoryRequests(data.leaveRequests || []);
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchHistory();

    const interval = setInterval(() => {
      fetchRequests();
      fetchHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredRequests = requests.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.employeeId?.name?.toLowerCase().includes(search) ||
      item.employeeId?.email?.toLowerCase().includes(search) ||
      item.leaveType?.toLowerCase().includes(search) ||
      item.finalStatus?.toLowerCase().includes(search) ||
      item.tlStatus?.toLowerCase().includes(search)
    );
  });

  const pendingFinalCount = requests.filter(
    (item) => item.finalStatus === "Pending Final Approval"
  ).length;

  const tlApprovedCount = requests.filter(
    (item) => item.tlStatus === "Approved"
  ).length;

  const tlRejectedCount = requests.filter(
    (item) => item.tlStatus === "Rejected"
  ).length;

  const openReasonModal = (title, content) => {
    setModalTitle(title);
    setModalContent(content || "No reason provided.");
    setShowReasonModal(true);
  };

  const openRejectModal = (id) => {
    setRejectLeaveId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const approveLeave = async (id) => {
    try {
      await api.put(`/leave/manager-approve/${id}`);

      alert("Leave approved successfully");
      fetchRequests();
      fetchHistory();
    } catch (error) {
      alert(error.response?.data?.message || "Approval failed");
    }
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }

    try {
      await api.put(`/leave/manager-reject/${rejectLeaveId}`, {
        rejectionReason,
      });

      alert("Leave rejected successfully");

      setShowRejectModal(false);
      setRejectLeaveId(null);
      setRejectionReason("");

      fetchRequests();
      fetchHistory();
    } catch (error) {
      alert(error.response?.data?.message || "Rejection failed");
    }
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Final Leave Approvals</h2>
          <p className="section-subtitle">
            Manager or HR can give the final decision. TL review is advisory only.
          </p>
        </div>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Requests</span>
          <h3>{requests.length}</h3>
          <p>available for final review</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Pending Final Approval</span>
          <h3>{pendingFinalCount}</h3>
          <p>awaiting final decision</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>TL Approved</span>
          <h3>{tlApprovedCount}</h3>
          <p>recommended by TL</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>TL Rejected</span>
          <h3>{tlRejectedCount}</h3>
          <p>not recommended by TL</p>
        </div>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          placeholder="Search by employee, email, leave type or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Working Days</th>
              <th>TL Status</th>
              <th>Reason</th>
              <th>Final Status</th>
              <th>Action</th>
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

                <td>{item.workingDays || 0}</td>

                <td>
                  <span
                    className={
                      item.tlStatus === "Approved"
                        ? "badge badge-success"
                        : item.tlStatus === "Rejected"
                          ? "badge badge-danger"
                          : "badge badge-pending"
                    }
                  >
                    {item.tlStatus}
                  </span>
                </td>

                <td>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() =>
                      openReasonModal("Leave Reason", item.reason)
                    }
                  >
                    View Reason
                  </button>

                  {item.tlRejectionReason && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      style={{ marginLeft: "8px" }}
                      onClick={() =>
                        openReasonModal(
                          "TL Rejection Reason",
                          item.tlRejectionReason
                        )
                      }
                    >
                      TL Reason
                    </button>
                  )}
                </td>

                <td>
                  <span
                    className={
                      ["Approved by Manager", "Approved by HR"].includes(
                        item.finalStatus
                      )
                        ? "badge badge-success"
                        : item.finalStatus?.includes("Rejected")
                          ? "badge badge-danger"
                          : "badge badge-pending"
                    }
                  >
                    {item.finalStatus}
                  </span>
                </td>

                <td>
                  {item.finalStatus === "Pending Final Approval" ? (
                    <div className="action-buttons">
                      <button
                        className="approve-btn"
                        onClick={() => approveLeave(item._id)}
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>

                      <button
                        className="reject-btn"
                        onClick={() => openRejectModal(item._id)}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span>Finalized</span>
                  )}
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
                  No pending final approval requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="section-header" style={{ marginTop: "40px" }}>
        <div>
          <h2 className="card-title">Approval History</h2>
          <p className="section-subtitle">
            Approved and rejected leave requests are stored here.
          </p>
        </div>
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Working Days</th>
              <th>Final Status</th>
            </tr>
          </thead>

          <tbody>
            {historyRequests.map((item) => (
              <tr key={item._id}>
                <td>{item.employeeId?.name || "N/A"}</td>

                <td>{item.leaveType}</td>

                <td>
                  {new Date(item.startDate).toLocaleDateString()} -{" "}
                  {new Date(item.endDate).toLocaleDateString()}
                </td>

                <td>{item.workingDays || 0}</td>

                <td>
                  <span
                    className={
                      item.finalStatus?.includes("Approved")
                        ? "badge badge-success"
                        : "badge badge-danger"
                    }
                  >
                    {item.finalStatus}
                  </span>
                </td>
              </tr>
            ))}

            {historyRequests.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  No approval history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showReasonModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>{modalTitle}</h3>

              <button onClick={() => setShowReasonModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                lineHeight: "1.7",
                maxHeight: "300px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {modalContent}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: "600px",
              width: "90%",
            }}
          >
            <div className="modal-header">
              <h3>Reject Leave Request</h3>

              <button onClick={() => setShowRejectModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <textarea
                rows="4"
                placeholder="Enter rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: "100%" }}
              />

              <button
                className="reject-btn"
                style={{ marginTop: "16px" }}
                onClick={submitRejection}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManagerApprovals;