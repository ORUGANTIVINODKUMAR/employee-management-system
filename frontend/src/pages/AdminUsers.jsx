import { useEffect, useState } from "react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Plus, Users, Trash2, Pencil } from "lucide-react";
import api from "../api/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const USERS_PER_PAGE = 10;

  const [subcategories, setSubcategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    employeeId: "",
    designation: "",
    phone: "",
    dateOfJoining: "",
    email: "",
    password: "",
    role: "Employee",
    subcategoryId: "",
  });

  const fetchUsers = async () => {
    const { data } = await api.get("/admin/users");
    setUsers(data.users);
  };

  const fetchSubcategories = async () => {
    const { data } = await api.get("/admin/subcategories");
    setSubcategories(data.subcategories);
  };

  useEffect(() => {
    fetchUsers();
    fetchSubcategories();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesRole =
      activeFilter === "All" ? true : user.role === activeFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.employeeId?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search);

    return matchesRole && matchesSearch;
  });

  const totalPages =
    Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;

  const startIndex =
    (currentPage - 1) * USERS_PER_PAGE;

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + USERS_PER_PAGE
  );

  const employeeCount = users.filter(
    (user) => user.role === "Employee"
  ).length;

  const managerCount = users.filter(
    (user) => user.role === "Manager"
  ).length;

  const hrCount = users.filter(
    (user) => user.role === "HR"
  ).length;

  const activeUsers = users.filter(
    (user) => user.isActive
  ).length;

  const exportUsersToExcel = () => {
    const exportData = filteredUsers.map((user) => ({
      Name: user.name,
      EmployeeID: user.employeeId || "N/A",
      Email: user.email,
      Phone: user.phone || "N/A",
      Designation: user.designation || "N/A",
      Role: user.role,
      Department: user.subcategoryId?.name || "N/A",
      Status: user.isActive ? "Active" : "Inactive",
      DateOfJoining: user.dateOfJoining
        ? new Date(user.dateOfJoining).toLocaleDateString()
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(fileData, "Users_Report.xlsx");
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

      setFormData({
        ...formData,
        phone: digitsOnly,
      });

      setError("");
      return;
    }

    const updatedData = {
      ...formData,
      [name]: value,
    };

    if (name === "role" && value !== "Employee") {
      updatedData.subcategoryId = "";
    }

    if (name === "firstName" || name === "lastName") {
      updatedData.name =
        `${updatedData.firstName} ${updatedData.lastName}`.trim();
    }

    setFormData(updatedData);
    setError("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      firstName: "",
      lastName: "",
      employeeId: "",
      designation: "",
      phone: "",
      dateOfJoining: "",
      email: "",
      password: "",
      role: "Employee",
      subcategoryId: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formData.phone.length !== 10) {
        setError("Phone number must be exactly 10 digits after +91.");
        return;
      }

      if (formData.role === "Employee" && !formData.subcategoryId) {
        setError("Department is required for Employee role.");
        return;
      }

      const payload = {
        ...formData,
        phone: `+91${formData.phone}`,
        subcategoryId:
          formData.role === "Employee"
            ? formData.subcategoryId
            : "",
      };

      if (editingUser) {
        delete payload.password;

        await api.put(
          `/admin/users/${editingUser._id}`,
          payload
        );
      } else {
        await api.post("/admin/users", payload);
      }

      resetForm();
      setShowModal(false);
      fetchUsers();
      setCurrentPage(1);
      setEditingUser(null);
    } catch (error) {
      setError(error.response?.data?.message || "Unable to create user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };
  const handleEdit = (user) => {
    setEditingUser(user);

    setFormData({
      name: user.name || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      employeeId: user.employeeId || "",
      designation: user.designation || "",
      phone: (user.phone || "").replace("+91", ""),
      dateOfJoining: user.dateOfJoining
        ? user.dateOfJoining.split("T")[0]
        : "",
      email: user.email || "",
      password: "",
      role: user.role || "Employee",
      subcategoryId: user.subcategoryId?._id || "",
      isActive: user.isActive,
    });

    setShowModal(true);
  };
  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">User Management</h2>
          <p className="section-subtitle">
            Create employees, managers and HR users with profile details.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-primary" onClick={exportUsersToExcel}>
            Export Excel
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Users</span>
          <h3>{users.length}</h3>
          <p>registered</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Employees</span>
          <h3>{employeeCount}</h3>
          <p>staff users</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Managers / HR</span>
          <h3>{managerCount + hrCount}</h3>
          <p>approval roles</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Active Users</span>
          <h3>{activeUsers}</h3>
          <p>currently active</p>
        </div>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <input
          type="text"
          placeholder="Search by name, email, employee ID or phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="leave-filter-tabs">
        {["All", "Employee", "Manager", "HR", "Finance"].map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? "active-filter" : ""}
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
          >
            {filter === "All" ? "All Users" : filter}
          </button>
        ))}
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Designation</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <Users size={16} />
                    </div>
                    <strong>{user.name}</strong>
                  </div>
                </td>

                <td>{user.employeeId || "N/A"}</td>
                <td>{user.email}</td>
                <td>{user.designation || "N/A"}</td>

                <td>
                  <span
                    className={
                      user.role === "HR"
                        ? "approval-approved"
                        : user.role === "Manager"
                          ? "approval-pending"
                          : "badge badge-success"
                    }
                  >
                    {user.role}
                  </span>
                </td>

                <td>{user.subcategoryId?.name || "N/A"}</td>

                <td>
                  <span
                    className={
                      user.isActive
                        ? "badge badge-success"
                        : "badge badge-danger"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      className="btn"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    {user.role !== "Admin" ? (
                      <button
                        className="delete-icon-btn"
                        onClick={() => handleDelete(user._id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    ) : (
                      <span className="badge badge-success">
                        Protected
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > USERS_PER_PAGE && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            style={{
              opacity: currentPage === 1 ? 0.6 : 1,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={
                currentPage === index + 1 ? "btn btn-primary" : "btn"
              }
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          <button
            className="btn btn-primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            style={{
              opacity: currentPage === totalPages ? 0.6 : 1,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card user-modal modern-user-modal">
            <div className="modal-header">
              <h3>
                {editingUser
                  ? "Edit User"
                  : "Create New User"}
              </h3>

              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setEditingUser(null);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="input-group">
                  <label>First Name</label>
                  <input
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Last Name</label>
                  <input
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Employee ID</label>
                  <input
                    name="employeeId"
                    placeholder="EMP001"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Date of Joining</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Designation / Post</label>
                  <input
                    name="designation"
                    placeholder="Software Engineer"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Phone</label>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        fontWeight: "600",
                      }}
                    >
                      +91
                    </span>

                    <input
                      name="phone"
                      type="text"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength="10"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    name="password"
                    type="password"
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Create password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                {formData.role === "Employee" && (
                  <div className="input-group">
                    <label>Department</label>

                    <select
                      name="subcategoryId"
                      value={formData.subcategoryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Department</option>

                      {subcategories.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button className="btn btn-primary" type="submit">
                {editingUser ? "Update User" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;