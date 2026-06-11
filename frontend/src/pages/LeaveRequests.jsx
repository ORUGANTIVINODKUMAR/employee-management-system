import { useEffect, useState } from "react";
import {
  Plus,
  CalendarDays,
  X,
  ClipboardList,
} from "lucide-react";

import api from "../api/api";

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const REQUESTS_PER_PAGE = 10;

  const [showModal, setShowModal] =
    useState(false);

  const [showReasonModal, setShowReasonModal] =
    useState(false);

  const [modalTitle, setModalTitle] =
    useState("");

  const [modalContent, setModalContent] =
    useState("");

  const [formData, setFormData] =
    useState({
      leaveType: "Sick",
      startDate: "",
      endDate: "",
      reason: "",
    });

  const safeRequests = requests || [];

  const todayDate = new Date()
    .toISOString()
    .split("T")[0];

  const fetchRequests = async () => {
    try {
      const { data } = await api.get(
        "/leave/my-requests"
      );

      setRequests(
        data.leaveRequests ||
        data.requests ||
        []
      );
    } catch (error) {
      console.log(
        error.response?.data
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
          : item.finalStatus ===
          activeFilter;

      const search =
        searchTerm.toLowerCase();

      const matchesSearch =
        item.leaveType
          ?.toLowerCase()
          .includes(search) ||
        item.finalStatus
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
        item.finalStatus ===
        "Pending Final Approval"
    ).length;

  const approvedCount =
    safeRequests.filter((item) =>
      [
        "Approved by Manager",
        "Approved by HR",
      ].includes(item.finalStatus)
    ).length;

  const rejectedCount =
    safeRequests.filter((item) =>
      [
        "Rejected by Manager",
        "Rejected by HR",
      ].includes(item.finalStatus)
    ).length;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      leaveType: "Sick",
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  const calculateWorkingDays = (
    startDate,
    endDate
  ) => {
    let count = 0;

    const current = new Date(
      startDate
    );

    const end = new Date(
      endDate
    );

    while (current <= end) {
      const day =
        current.getDay();

      if (
        day !== 0 &&
        day !== 6
      ) {
        count++;
      }

      current.setDate(
        current.getDate() + 1
      );
    }

    return count;
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      const workingDays =
        calculateWorkingDays(
          formData.startDate,
          formData.endDate
        );

      const payload = {
        leaveType:
          formData.leaveType,
        startDate:
          formData.startDate,
        endDate:
          formData.endDate,
        reason:
          formData.reason,
        workingDays,
      };

      await api.post(
        "/leave/request",
        payload
      );

      alert(
        "Leave request submitted successfully"
      );

      setShowModal(false);

      resetForm();

      fetchRequests();

      setCurrentPage(1);
    } catch (error) {
      alert(
        error.response?.data
          ?.message ||
        "Submission failed"
      );

      console.log(
        error.response?.data
      );
    }
  };

  const openReasonModal = (
    title,
    content
  ) => {
    setModalTitle(title);

    setModalContent(
      content ||
      "No details available."
    );

    setShowReasonModal(true);
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Leave Requests
          </h2>

          <p className="section-subtitle">
            Submit and track your leave requests.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() =>
            setShowModal(true)
          }
        >
          <Plus size={18} />
          New Request
        </button>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Requests</span>
          <h3>
            {safeRequests.length}
          </h3>
          <p>leave applications</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Pending</span>
          <h3>{pendingCount}</h3>
          <p>under review</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Approved</span>
          <h3>{approvedCount}</h3>
          <p>accepted</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Rejected</span>
          <h3>{rejectedCount}</h3>
          <p>declined</p>
        </div>
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <input
          type="text"
          placeholder="Search by leave type or status..."
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
          "Pending Final Approval",
          "Approved by Manager",
          "Approved by HR",
          "Rejected by Manager",
          "Rejected by HR",
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
              ? "All Requests"
              : filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Working Days</th>
              <th>Reason</th>
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

                      <strong>
                        {item.leaveType}
                      </strong>
                    </div>
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
                    {
                      item.workingDays
                    }
                  </td>

                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        openReasonModal(
                          "Leave Reason",
                          item.reason
                        )
                      }
                    >
                      View Reason
                    </button>
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
                  <div>
                    <div>
                      TL: {item.tlStatus}
                    </div>

                    <div>
                      Manager: {item.managerStatus}
                    </div>

                    <div>
                      HR: {item.hrStatus}
                    </div>
                  </div>
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
                    colSpan="7"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "24px",
                    }}
                  >
                    No leave requests found.
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                Leave Request Form
              </h3>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <div className="input-group">
                <label>
                  Leave Type
                </label>

                <select
                  name="leaveType"
                  value={
                    formData.leaveType
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="Sick">
                    Sick
                  </option>

                  <option value="Vacation">
                    Vacation
                  </option>

                  <option value="Personal">
                    Personal
                  </option>

                  <option value="Travel">
                    Travel
                  </option>
                </select>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    min={todayDate}
                    value={
                      formData.startDate
                    }
                    onChange={(e) => {
                      const selectedStartDate =
                        e.target.value;

                      setFormData({
                        ...formData,
                        startDate:
                          selectedStartDate,
                        endDate:
                          formData.endDate &&
                            formData.endDate <
                            selectedStartDate
                            ? ""
                            : formData.endDate,
                      });
                    }}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    End Date
                  </label>

                  <input
                    type="date"
                    name="endDate"
                    min={
                      formData.startDate ||
                      todayDate
                    }
                    disabled={
                      !formData.startDate
                    }
                    value={
                      formData.endDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>
                  Reason
                </label>

                <textarea
                  rows="3"
                  name="reason"
                  placeholder="Enter leave reason"
                  value={
                    formData.reason
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
              >
                <CalendarDays size={16} />
                Submit Leave Request
              </button>
            </form>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{
              maxWidth: "500px",
            }}
          >
            <div className="modal-header">
              <h3>{modalTitle}</h3>

              <button
                onClick={() =>
                  setShowReasonModal(
                    false
                  )
                }
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                lineHeight: "1.7",
                whiteSpace:
                  "pre-wrap",
              }}
            >
              {modalContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequests;