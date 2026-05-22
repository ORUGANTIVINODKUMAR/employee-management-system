import { useEffect, useState } from "react";
import { Plus, Users, Trash2 } from "lucide-react";

import api from "../api/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [subcategories, setSubcategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
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
  const filteredUsers =
    activeFilter === "All"
      ? users
      : users.filter((user) => user.role === activeFilter);

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
  const handleChange = (e) => {
    const updatedData = {
      ...formData,
      [e.target.name]: e.target.value,
    };

    if (e.target.name === "firstName" || e.target.name === "lastName") {
      updatedData.name = `${updatedData.firstName} ${updatedData.lastName}`.trim();
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
      await api.post("/admin/users", formData);
      resetForm();
      setShowModal(false);
      fetchUsers();
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

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">User Management</h2>
          <p className="section-subtitle">
            Create employees, managers and HR users with profile details.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add User
        </button>
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

      <div className="leave-filter-tabs">
        {["All", "Employee", "Manager", "HR"].map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? "active-filter" : ""}
            onClick={() => setActiveFilter(filter)}
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
            {filteredUsers.map((user) => (
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
                  {user.role !== "Admin" ? (
                    <button
                      className="delete-icon-btn"
                      onClick={() => handleDelete(user._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  ) : (
                    <span className="badge badge-success">Protected</span>
                  )}
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card user-modal">
            <div className="modal-header">
              <h3>Create New User</h3>

              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
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
                  <input
                    name="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
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
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    required
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
                  </select>
                </div>

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
              </div>

              <button className="btn btn-primary" type="submit">
                Create User
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;