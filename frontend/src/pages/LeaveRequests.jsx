import { useEffect, useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";

import api from "../api/api";
const ENABLE_LEAVE_BALANCE_BLOCK = true;
const LeaveRequests = () => {
  const [showModal, setShowModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [formData, setFormData] = useState({
    leaveType: "Sick",
    startDate: "",
    endDate: "",
    reason: "",
    leaveExplanation: "",
    proofFile: null,
  });

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/leave/my-requests");
      setLeaveRequests(data.leaveRequests);
    } catch (error) {
      console.log(error.response?.data);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getWorkingDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    let count = 0;
    const current = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    while (current <= end) {
      const day = current.getDay();

      if (day !== 0 && day !== 6) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const showExtraFields = getWorkingDays() > 2;
  const todayDate = new Date().toISOString().split("T")[0];
  const filteredLeaves =
    activeFilter === "All"
      ? leaveRequests
      : leaveRequests.filter((item) => item.status === activeFilter);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      leaveType: "Sick",
      startDate: "",
      endDate: "",
      reason: "",
      leaveExplanation: "",
      proofFile: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start < today) {
      alert("Leave start date cannot be before today's date.");
      return;
    }

    if (end < start) {
      alert("Leave end date cannot be before start date.");
      return;
    }
    if (ENABLE_LEAVE_BALANCE_BLOCK) {
      const leaveBalance = JSON.parse(
        localStorage.getItem("leaveBalance") || "{}"
      );

      const requestedDays = getWorkingDays();

      if (
        formData.leaveType === "Sick" &&
        requestedDays > (leaveBalance?.sick?.remaining ?? 8)
      ) {
        alert("Insufficient sick leave balance.");
        return;
      }

      if (
        ["Vacation", "Personal"].includes(formData.leaveType) &&
        requestedDays > (leaveBalance?.casual?.remaining ?? 20)
      ) {
        alert("Insufficient casual leave balance.");
        return;
      }
    }
    try {

      const payload = new FormData();

      payload.append("leaveType", formData.leaveType);
      payload.append("startDate", formData.startDate);
      payload.append("endDate", formData.endDate);
      payload.append("reason", formData.reason);

      payload.append(
        "leaveExplanation",
        showExtraFields ? formData.reason : ""
      );

      if (formData.proofFile) {
        payload.append("proofFile", formData.proofFile);
      }

      await api.post("/leave/request", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setShowModal(false);
      resetForm();
      fetchRequests();

      alert("Leave request submitted successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Leave request failed");
      console.log(error.response?.data);
    }
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Leave Requests</h2>
          <p className="section-subtitle">
            Apply and track employee leave applications.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Apply Leave
        </button>
      </div>
      <div className="leave-summary-grid">

        <div className="leave-summary-card">
          <span>Casual Leave</span>
          <h3>12</h3>
          <p>Available</p>
        </div>

        <div className="leave-summary-card">
          <span>Sick Leave</span>
          <h3>10</h3>
          <p>Available</p>
        </div>

        <div className="leave-summary-card">
          <span>Earned Leave</span>
          <h3>15</h3>
          <p>Available</p>
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
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Working Days</th>
              <th>Reason</th>
              <th>Proof</th>
              <th>Status</th>
              <th>Approval Flow</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeaves.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <CalendarDays size={16} />
                    </div>
                    <strong>{item.leaveType}</strong>
                  </div>
                </td>

                <td>
                  {new Date(item.startDate).toLocaleDateString()} -{" "}
                  {new Date(item.endDate).toLocaleDateString()}
                </td>

                <td>{item.workingDays || 0}</td>

                <td>{item.reason}</td>

                <td>
                  {item.proofFile ? (
                    <a
                      href={`http://localhost:5000${item.proofFile}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      View File
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

            {filteredLeaves.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "24px" }}
                >
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card leave-modal">
            <div className="modal-header">
              <h3>Apply Leave Request</h3>

              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Leave Type</label>

                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  required
                >
                  <option value="Sick">Sick</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Start Date</label>

                  <input
                    type="date"
                    name="startDate"
                    min={todayDate}
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>End Date</label>

                  <input
                    type="date"
                    name="endDate"
                    min={formData.startDate || todayDate}
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="working-days-box">
                Working days counted: <strong>{getWorkingDays()}</strong>
                <span> Saturday and Sunday are excluded.</span>
              </div>

              {!showExtraFields && (
                <div className="input-group">
                  <label>Leave Reason</label>

                  <textarea
                    rows="4"
                    name="reason"
                    placeholder="Enter leave reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {showExtraFields && (
                <>
                  <div className="alert alert-info">
                    More than 2 working days selected. Explanation and proof
                    upload are mandatory.
                  </div>

                  <div className="input-group">
                    <label>Leave Reason / Explanation</label>

                    <textarea
                      rows="4"
                      name="reason"
                      placeholder="Provide detailed explanation for extended leave"
                      value={formData.reason}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Upload Proof / Receipts</label>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proofFile: e.target.files[0],
                        })
                      }
                      required
                    />
                  </div>
                </>
              )}

              <button className="btn btn-primary" type="submit">
                Submit Leave Request
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequests;