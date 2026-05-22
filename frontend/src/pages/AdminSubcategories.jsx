import { useEffect, useState } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import api from "../api/api";

const AdminSubcategories = () => {
  const [name, setName] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchSubcategories = async () => {
    const { data } = await api.get("/admin/subcategories");
    setSubcategories(data.subcategories);
  };

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/admin/subcategories", {
      name,
    });

    setName("");
    setShowModal(false);
    fetchSubcategories();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await api.delete(`/admin/subcategories/${id}`);
      fetchSubcategories();
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Department Management</h2>
          <p className="section-subtitle">
            Manage departments and organizational units.
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
          <span>Created Recently</span>
          <h3>
            {
              subcategories.filter((item) => {
                const created = new Date(item.createdAt);
                const now = new Date();
                const diffDays = (now - created) / (1000 * 60 * 60 * 24);
                return diffDays <= 30;
              }).length
            }
          </h3>
          <p>last 30 days</p>
        </div>

        <div className="reimbursement-summary-card">
          <span>Status</span>
          <h3>Active</h3>
          <p>department setup</p>
        </div>
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Department</th>
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
                <td colSpan="4" style={{ textAlign: "center", padding: "24px" }}>
                  No departments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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