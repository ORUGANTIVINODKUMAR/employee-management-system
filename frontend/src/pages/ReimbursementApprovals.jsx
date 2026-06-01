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
  const [activeFilter, setActiveFilter] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const REQUESTS_PER_PAGE = 10;

  const [showReasonModal, setShowReasonModal] =
    useState(false);

  const [modalTitle, setModalTitle] =
    useState("");

  const [modalContent, setModalContent] =
    useState("");

  const [rejectionModal, setRejectionModal] =
    useState(false);

  const [rejectRequestId, setRejectRequestId] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const safeRequests = requests || [];

  const fetchRequests = async () => {
    try {
      const { data } = await api.get(
        "/reimbursements/pending"
      );

      setRequests(
        data.reimbursementRequests ||
          data.reimbursements ||
          []
      );
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
    safeRequests.filter((item) => {
      const matchesFilter =
        activeFilter === "All"
          ? true
          : item.status ===
            activeFilter;

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
        matchesFilter &&
        matchesSearch
      );
    });

  const totalPages =
    Math.ceil(
      filteredRequests.length /
        REQUESTS_PER_PAGE
    ) || 1;

  const startIndex =
    (currentPage - 1) *
    REQUESTS_PER_PAGE;

  const paginatedRequests =
    filteredRequests.slice(
      startIndex,
      startIndex +
        REQUESTS_PER_PAGE
    );

  const pendingCount =
    safeRequests.filter(
      (item) =>
        item.status === "Pending"
    ).length;

  const approvedCount =
    safeRequests.filter(
      (item) =>
        item.status === "Approved"
    ).length;

  const rejectedCount =
    safeRequests.filter(
      (item) =>
        item.status === "Rejected"
    ).length;

  const totalAmount =
    safeRequests.reduce(
      (sum, item) =>
        sum +
        Number(
          item.totalReimbursement || 0
        ),
      0
    );

  const openReasonModal = (
    title,
    content
  ) => {
    setModalTitle(title);

    setModalContent(
      content ||
        "No reason available."
    );

    setShowReasonModal(true);
  };

  const openRejectModal = (id) => {
    setRejectRequestId(id);

    setRejectionReason("");

    setRejectionModal(true);
  };

  const handleDecision = async (
    id,
    decision,
    customReason = ""
  ) => {
    try {
      if (
        decision === "Rejected" &&
        !customReason.trim()
      ) {
        alert(
          "Rejection reason is required."
        );

        return;
      }

      const { data } =
        await api.put(
          `/reimbursements/approve/${id}`,
          {
            decision,
            rejectionReason:
              customReason,
          }
        );

      const updatedRequest =
        data.reimbursementRequest ||
        data.reimbursement ||
        {};

      alert(
        updatedRequest.status ===
          "Pending"
          ? "Your approval is recorded. Waiting for the other approver."
          : `Reimbursement ${updatedRequest.status}`
      );

      fetchRequests();
    } catch (error) {
      alert(
        error.response?.data
          ?.message ||
          "Approval failed"
      );
    }
  };

  const submitRejection =
    async () => {
      if (
        !rejectionReason.trim()
      ) {
        alert(
          "Rejection reason is required."
        );

        return;
      }

      await handleDecision(
        rejectRequestId,
        "Rejected",
        rejectionReason
      );

      setRejectionModal(false);

      setRejectRequestId(null);

      setRejectionReason("");
    };

  const hasCurrentUserActed = (
    item
  ) => {
    if (
      user?.role === "Manager"
    ) {
      return (
        item.approvals
          ?.managerStatus !==
        "Pending"
      );
    }

    if (user?.role === "HR") {
      return (
        item.approvals
          ?.hrStatus !==
        "Pending"
      );
    }

    return true;
  };

  const getActionLabel = (
    item
  ) => {
    if (
      user?.role ===
      "Manager"
    ) {
      return item.approvals
        ?.managerStatus ===
        "Approved"
        ? "Approved By You"
        : "Rejected By You";
    }

    if (
      user?.role === "HR"
    ) {
      return item.approvals
        ?.hrStatus ===
        "Approved"
        ? "Approved By You"
        : "Rejected By You";
    }

    return "";
  };

  const getActionClass = (
    item
  ) => {
    if (
      user?.role ===
      "Manager"
    ) {
      return item.approvals
        ?.managerStatus ===
        "Approved"
        ? "badge badge-success"
        : "badge badge-danger";
    }

    if (
      user?.role === "HR"
    ) {
      return item.approvals
        ?.hrStatus ===
        "Approved"
        ? "badge badge-success"
        : "badge badge-danger";
    }

    return "badge badge-pending";
  };

  const printReimbursementForm = (
    item
  ) => {
    window.print();
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Reimbursement Approvals
          </h2>

          <p className="section-subtitle">
            Review employee reimbursement claims.
          </p>
        </div>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Claims</span>
          <h3>
            {safeRequests.length}
          </h3>
          <p>submitted</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Pending</span>
          <h3>{pendingCount}</h3>
          <p>
            awaiting review
          </p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Approved</span>
          <h3>{approvedCount}</h3>
          <p>completed</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Rejected</span>
          <h3>{rejectedCount}</h3>
          <p>rejected</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Total Amount</span>
          <h3>₹ {totalAmount}</h3>
          <p>claims value</p>
        </div>
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
              activeFilter ===
              filter
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
            {filter === "All"
              ? "All Claims"
              : filter}
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
                        <Receipt size={16} />
                      </div>

                      <div>
                        <strong>
                          {
                            item
                              .employeeId
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
                            item
                              .employeeId
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
                    {item.receiptFiles
                      ?.length > 0 ? (
                      <div
                        style={{
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          gap: "6px",
                        }}
                      >
                        {item.receiptFiles.map(
                          (
                            file,
                            index
                          ) => (
                            <a
                              key={
                                index
                              }
                              href={
                                file
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              View
                              Receipt{" "}
                              {index +
                                1}
                            </a>
                          )
                        )}
                      </div>
                    ) : (
                      "N/A"
                    )}
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
                    <div className="action-buttons">
                      {hasCurrentUserActed(
                        item
                      ) ? (
                        <span
                          className={getActionClass(
                            item
                          )}
                        >
                          {getActionLabel(
                            item
                          )}
                        </span>
                      ) : (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleDecision(
                                item._id,
                                "Approved"
                              )
                            }
                          >
                            <CheckCircle
                              size={16}
                            />
                            Approve
                          </button>

                          <button
                            className="reject-btn"
                            onClick={() =>
                              openRejectModal(
                                item._id
                              )
                            }
                          >
                            <XCircle
                              size={16}
                            />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                  <td>
                    {["Manager", "HR"].includes(
                      user?.role
                    ) && (
                      <button
                        className="print-btn"
                        onClick={() =>
                          printReimbursementForm(
                            item
                          )
                        }
                      >
                        <Printer
                          size={16}
                        />
                        Print
                      </button>
                    )}
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

                  <td>
                    {item.rejectionReason ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          openReasonModal(
                            "Rejection Reason",
                            item.rejectionReason
                          )
                        }
                      >
                        View Reason
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              )
            )}

            {filteredRequests.length ===
              0 && (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "24px",
                  }}
                >
                  No reimbursement requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredRequests.length >
        REQUESTS_PER_PAGE && (
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

export default ReimbursementApprovals;