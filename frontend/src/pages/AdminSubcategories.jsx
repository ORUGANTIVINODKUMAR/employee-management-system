import { useEffect, useState } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import api from "../api/api";

const AdminSubcategories = () => {
  const [name, setName] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const fetchSubcategories = async () => {
    const { data } = await api.get("/admin/subcategories");
    setSubcategories(data.subcategories || []);
  };

  useEffect(() => {
    fetchSubcategories();

    const handleUsersUpdated = () => {
      fetchSubcategories();
    };

    const handleDepartmentRefresh = () => {
      fetchSubcategories();
    };

    window.addEventListener(
      "users-updated",
      handleUsersUpdated
    );

    window.addEventListener(
      "department-data-updated",
      handleDepartmentRefresh
    );

    return () => {
      window.removeEventListener(
        "users-updated",
        handleUsersUpdated
      );

      window.removeEventListener(
        "department-data-updated",
        handleDepartmentRefresh
      );
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/admin/subcategories", {
      name,
    });

    setName("");
    setShowModal(false);

    await fetchSubcategories();

    window.dispatchEvent(
      new CustomEvent("departments-updated")
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await api.delete(`/admin/subcategories/${id}`);
      await fetchSubcategories();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Users are associated with this department. You cannot delete it."
      );
    }
  };

  const totalEmployees = subcategories.reduce(
    (sum, item) => sum + (item.employeeCount || 0),
    0
  );

  const totalTeamLeaders = subcategories.reduce(
    (sum, item) => sum + (item.teamLeaderCount || 0),
    0
  );

  const totalManagers = subcategories.reduce(
    (sum, item) => sum + (item.managerCount || 0),
    0
  );

  const totalHRs = subcategories.reduce(
    (sum, item) => sum + (item.hrCount || 0),
    0
  );

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Department Management</h2>
          <p className="section-subtitle">
            Manage departments and view employees, team leaders, managers and HRs.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Department
        </button>
      </div>

      <div className="reimbursement-summary-grid">
        <div className="reimbursement-summary-card">
          <span>Total Departments</span>
          <h3>{subcategories.length}</h3>
          <p>active units</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Employees</span>
          <h3>{totalEmployees}</h3>
          <p>assigned employees</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Team Leaders</span>
          <h3>{totalTeamLeaders}</h3>
          <p>department TLs</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Managers / HR</span>
          <h3>{totalManagers + totalHRs}</h3>
          <p>approval users</p>
        </div>
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Employees</th>
              <th>TL</th>
              <th>Managers</th>
              <th>HR</th>
              <th>Total Users</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {subcategories.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <Building2 size={16} />
                    </div>

                    <strong>{item.name}</strong>
                  </div>
                </td>

                <td>
                  <span className="badge badge-success">
                    {item.employeeCount || 0}
                  </span>
                </td>

                <td>
                  <span className="badge badge-pending">
                    {item.teamLeaderCount || 0}
                  </span>
                </td>

                <td>
                  <span className="badge badge-pending">
                    {item.managerCount || 0}
                  </span>
                </td>

                <td>
                  <span className="badge badge-pending">
                    {item.hrCount || 0}
                  </span>
                </td>

                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="badge badge-success">
                      {item.userCount || 0}
                    </span>

                    {item.userCount > 0 && (
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          const { data } = await api.get("/admin/subcategories");

                          setSubcategories(data.subcategories || []);

                          const updated = data.subcategories.find(
                            (d) => d._id === item._id
                          );

                          setSelectedDepartment(updated || item);
                        }}
                      >
                        View
                      </button>
                    )}
                  </div>
                </td>

                <td>{new Date(item.createdAt).toLocaleDateString()}</td>

                <td>
                  <span className="badge badge-success">Active</span>
                </td>

                <td>
                  <button
                    className="delete-icon-btn"
                    onClick={() => handleDelete(item._id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {subcategories.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "24px" }}>
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDepartment && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "850px", width: "95%" }}>
            <div className="modal-header">
              <h3>{selectedDepartment.name} Users</h3>

              <button onClick={() => setSelectedDepartment(null)}>
                ✕
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div className="reimbursement-summary-grid">
                <div className="reimbursement-summary-card">
                  <span>Employees</span>
                  <h3>{selectedDepartment.employeeCount || 0}</h3>
                </div>

                <div className="reimbursement-summary-card">
                  <span>Team Leaders</span>
                  <h3>{selectedDepartment.teamLeaderCount || 0}</h3>
                </div>

                <div className="reimbursement-summary-card">
                  <span>Managers</span>
                  <h3>{selectedDepartment.managerCount || 0}</h3>
                </div>

                <div className="reimbursement-summary-card">
                  <span>HR</span>
                  <h3>{selectedDepartment.hrCount || 0}</h3>
                </div>
              </div>

              <h3 style={{ margin: "24px 0 16px" }}>
                Department Teams
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: "20px",
                }}
              >
                {selectedDepartment.teams?.map((team) => (
                  <div
                    key={team._id}
                    className="team-hierarchy-card"
                  >
                    <div className="team-card-header">
                      <h4>{team.name}</h4>
                    </div>

                    <div className="team-card-body">
                      <p>
                        👨 <strong>Manager:</strong>{" "}
                        {team.manager?.name || "Not Assigned"}
                      </p>

                      <p>
                        👩 <strong>HR:</strong>{" "}
                        {team.hr?.name || "Not Assigned"}
                      </p>

                      <p>
                        🎯 <strong>Team Leader:</strong>{" "}
                        {team.teamLeader?.name || "Not Assigned"}
                      </p>

                      <p>
                        👥 <strong>Employees:</strong>{" "}
                        {team.employeeCount || 0}
                      </p>
                      {team.employees?.length > 0 && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "10px",
                            background: "#f8fafc",
                            borderRadius: "10px",
                          }}
                        >
                          {team.employees.map((emp) => (
                            <div
                              key={emp._id}
                              style={{
                                fontSize: "13px",
                                marginBottom: "6px",
                              }}
                            >
                              👤 {emp.name}{" "}
                              <span style={{ color: "#64748b" }}>
                                ({emp.employeeId || "N/A"})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card modern-department-modal">
            <div className="modal-header">
              <h3>Create Department</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Department Name</label>

                <input
                  type="text"
                  placeholder="Enter department name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-primary" type="submit">
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSubcategories;