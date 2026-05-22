import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Receipt,
  X,
  Trash2,
} from "lucide-react";

import api from "../api/api";

const defaultCategories = [
  "Business Cards",
  "Business Meals",
  "Dues",
  "Legal Fees",
  "License Fees",
  "Mileage",
  "Office Supplies",
  "Passport fee",
  "Postage",
  "Printer Cartridges",
  "Printer Paper",
  "Software",
  "Stationery",
  "Subscriptions",
  "Telephones",
  "Tools",
  "Training Fees",
  "Travel",
  "Work Clothing",
  "Other",
];

const Reimbursements = () => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal] =
    useState(false);

  const [categories, setCategories] =
    useState(defaultCategories);
  const todayDate = new Date().toISOString().split("T")[0];
  const filteredRequests =
    activeFilter === "All"
      ? requests
      : requests.filter((item) => item.status === activeFilter);

  const totalSubmitted = requests.length;

  const approvedAmount = requests
    .filter((item) => item.status === "Approved")
    .reduce((sum, item) => sum + Number(item.totalReimbursement || 0), 0);

  const pendingAmount = requests
    .filter((item) => item.status === "Pending")
    .reduce((sum, item) => sum + Number(item.totalReimbursement || 0), 0);

  const rejectedCount = requests.filter(
    (item) => item.status === "Rejected"
  ).length;
  const [formData, setFormData] =
    useState({
      expenseFrom: "",
      expenseTo: "",
      businessPurpose: "",
      lessCashAdvance: 0,
      receiptFile: null,

      items: [
        {
          description: "",
          category: "Travel",
          cost: "",
        },
      ],
    });

  const subtotal = useMemo(() => {
    return formData.items.reduce(
      (sum, item) =>
        sum + Number(item.cost || 0),
      0
    );
  }, [formData.items]);

  const totalReimbursement =
    subtotal -
    Number(
      formData.lessCashAdvance || 0
    );

  const fetchRequests = async () => {
    try {
      const { data } =
        await api.get(
          "/reimbursements/my-requests"
        );

      setRequests(data.reimbursements);
    } catch (error) {
      console.log(
        error.response?.data
      );
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleMainChange = (
    e
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    const updatedItems = [
      ...formData.items,
    ];

    updatedItems[index][field] =
      value;

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleCategoryChange = (
    index,
    value
  ) => {
    if (value === "__custom__") {
      const customCategory =
        window.prompt(
          "Enter custom category"
        );

      if (
        !customCategory?.trim()
      )
        return;

      const cleanCategory =
        customCategory.trim();

      if (
        !categories.includes(
          cleanCategory
        )
      ) {
        setCategories([
          ...categories,
          cleanCategory,
        ]);
      }

      handleItemChange(
        index,
        "category",
        cleanCategory
      );

      return;
    }

    handleItemChange(
      index,
      "category",
      value
    );
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: "",
          category: "Travel",
          cost: "",
        },
      ],
    });
  };

  const removeItemRow = (
    index
  ) => {
    const updatedItems =
      formData.items.filter(
        (_, i) => i !== index
      );

    setFormData({
      ...formData,
      items:
        updatedItems.length > 0
          ? updatedItems
          : [
            {
              description: "",
              category:
                "Travel",
              cost: "",
            },
          ],
    });
  };

  const resetForm = () => {
    setFormData({
      expenseFrom: "",
      expenseTo: "",
      businessPurpose: "",
      lessCashAdvance: 0,
      receiptFile: null,

      items: [
        {
          description: "",
          category: "Travel",
          cost: "",
        },
      ],
    });
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expenseFrom = new Date(formData.expenseFrom);
    const expenseTo = new Date(formData.expenseTo);

    if (expenseFrom > today || expenseTo > today) {
      alert("Reimbursement expense dates cannot be after today's date.");
      return;
    }

    if (expenseTo < expenseFrom) {
      alert("Expense To date cannot be before Expense From date.");
      return;
    }
    if (!formData.receiptFile) {
      alert("Receipt / Invoice upload is required.");
      return;
    }
    try {
      const payload =
        new FormData();

      payload.append(
        "expenseFrom",
        formData.expenseFrom
      );

      payload.append(
        "expenseTo",
        formData.expenseTo
      );

      payload.append(
        "businessPurpose",
        formData.businessPurpose
      );

      payload.append(
        "lessCashAdvance",
        formData.lessCashAdvance
      );

      payload.append(
        "items",
        JSON.stringify(
          formData.items
        )
      );

      payload.append(
        "receiptFile",
        formData.receiptFile
      );

      await api.post(
        "/reimbursements/request",
        payload,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setShowModal(false);

      resetForm();

      fetchRequests();

      alert(
        "Reimbursement submitted successfully"
      );
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

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">
            Reimbursements
          </h2>

          <p className="section-subtitle">
            Submit and track
            reimbursement claims.
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
          <span>Total Submitted</span>
          <h3>{totalSubmitted}</h3>
          <p>claims</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Approved</span>
          <h3>₹ {approvedAmount}</h3>
          <p>total paid</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Pending</span>
          <h3>₹ {pendingAmount}</h3>
          <p>awaiting review</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Rejected</span>
          <h3>{rejectedCount}</h3>
          <p>claims</p>
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
              <th>Purpose</th>
              <th>Period</th>
              <th>Total</th>
              <th>Receipt</th>
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
                      <Receipt size={16} />
                    </div>

                    <strong>{item.businessPurpose}</strong>
                  </div>
                </td>

                <td>
                  {new Date(item.expenseFrom).toLocaleDateString()} -{" "}
                  {new Date(item.expenseTo).toLocaleDateString()}
                </td>

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
                <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                  No reimbursement requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card reimbursement-modal">
            <div className="modal-header">
              <h3>
                Expense Reimbursement
                Form
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
                  Upload Receipt /
                  Invoice
                </label>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiptFile:
                        e.target
                          .files[0],
                    })
                  }
                  required
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>
                    Expense From
                  </label>

                  <input
                    type="date"
                    name="expenseFrom"
                    max={todayDate}
                    value={
                      formData.expenseFrom
                    }
                    onChange={
                      handleMainChange
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    Expense To
                  </label>

                  <input
                    type="date"
                    name="expenseTo"
                    min={formData.expenseFrom || ""}
                    max={todayDate}
                    value={
                      formData.expenseTo
                    }
                    onChange={
                      handleMainChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>
                  Business Purpose
                </label>

                <textarea
                  rows="3"
                  name="businessPurpose"
                  placeholder="Enter business purpose"
                  value={
                    formData.businessPurpose
                  }
                  onChange={
                    handleMainChange
                  }
                  required
                />
              </div>

              <div className="reimbursement-toolbar">
                <h4>
                  Itemized Expenses
                </h4>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    addItemRow
                  }
                >
                  <Plus size={16} />
                  Add Row
                </button>
              </div>

              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>
                        Description
                      </th>
                      <th>
                        Category
                      </th>
                      <th>Cost</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {formData.items.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                        >
                          <td>
                            <input
                              className="table-input"
                              placeholder="Expense description"
                              value={
                                item.description
                              }
                              onChange={(
                                e
                              ) =>
                                handleItemChange(
                                  index,
                                  "description",
                                  e
                                    .target
                                    .value
                                )
                              }
                              required
                            />
                          </td>

                          <td>
                            <select
                              className="table-input"
                              value={
                                item.category
                              }
                              onChange={(
                                e
                              ) =>
                                handleCategoryChange(
                                  index,
                                  e
                                    .target
                                    .value
                                )
                              }
                              required
                            >
                              {categories.map(
                                (
                                  category
                                ) => (
                                  <option
                                    key={
                                      category
                                    }
                                    value={
                                      category
                                    }
                                  >
                                    {
                                      category
                                    }
                                  </option>
                                )
                              )}

                              <option value="__custom__">
                                +
                                Add
                                Custom
                                Category
                              </option>
                            </select>
                          </td>

                          <td>
                            <input
                              className="table-input"
                              type="number"
                              min="0"
                              placeholder="0"
                              value={
                                item.cost
                              }
                              onChange={(
                                e
                              ) =>
                                handleItemChange(
                                  index,
                                  "cost",
                                  e
                                    .target
                                    .value
                                )
                              }
                              required
                            />
                          </td>

                          <td>
                            <button
                              type="button"
                              className="delete-icon-btn"
                              onClick={() =>
                                removeItemRow(
                                  index
                                )
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="reimbursement-summary">
                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹{" "}
                    {
                      subtotal
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Less Cash
                    Advance
                  </span>

                  <input
                    type="number"
                    name="lessCashAdvance"
                    value={
                      formData.lessCashAdvance
                    }
                    onChange={
                      handleMainChange
                    }
                  />
                </div>

                <div className="total-line">
                  <span>
                    Total
                    Reimbursement
                  </span>

                  <strong>
                    ₹{" "}
                    {
                      totalReimbursement
                    }
                  </strong>
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
              >
                Submit
                Reimbursement
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Reimbursements;