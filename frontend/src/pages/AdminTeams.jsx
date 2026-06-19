import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Pencil } from "lucide-react";
import api from "../api/api";

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [error, setError] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    departmentId: "",
    managerIds: [],
    hrIds: [],
    teamLeaderId: "",
  });

  const fetchTeams = async () => {
    const { data } = await api.get("/admin/teams");
    setTeams(data.teams || []);
  };

  const fetchDepartments = async () => {
    const { data } = await api.get("/admin/subcategories");
    setDepartments(data.subcategories || []);
  };

  const fetchUsers = async () => {
    const { data } = await api.get("/admin/users");

    setManagers(
      (data.users || []).filter(
        (user) => user.role === "Manager" && user.isActive
      )
    );

    setHrs(
      (data.users || []).filter(
        (user) => user.role === "HR" && user.isActive
      )
    );
    setTeamLeaders(
      (data.users || []).filter(
        (user) => user.role === "TeamLeader" && user.isActive
      )
    );
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchTeams(),
        fetchDepartments(),
        fetchUsers(),
      ]);
    };

    loadData();

    const handleUsersUpdated = () => {
      fetchUsers();
      fetchTeams();
    };

    const handleDepartmentsUpdated = () => {
      fetchDepartments();
    };
    window.addEventListener(
      "users-updated",
      handleUsersUpdated
    );
    window.addEventListener(
      "departments-updated",
      handleDepartmentsUpdated
    );


    return () => {
      window.removeEventListener(
        "users-updated",
        handleUsersUpdated
      );
      window.removeEventListener(
        "departments-updated",
        handleDepartmentsUpdated
      );


    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      departmentId: "",
      managerIds: [],
      hrIds: [],
      teamLeaderId: "",
    });

    setEditingTeam(null);
    setError("");
  };

  const handleEdit = (team) => {
    setEditingTeam(team);

    setFormData({
      name: team.name || "",
      departmentId: team.departmentId?._id || "",
      teamLeaderId: team?.teamLeaderId?._id || "",
      managerIds: team.managerIds?.map((m) => m._id) || [],
      hrIds: team.hrIds?.map((hr) => hr._id) || [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      if (!formData.name || !formData.departmentId) {
        setError("Team name and department are required");
        return;
      }

      if (editingTeam) {
        await api.put(`/admin/teams/${editingTeam._id}`, formData);
        window.dispatchEvent(
          new CustomEvent("department-data-updated")
        );
      } else {
        await api.post("/admin/teams", formData);
      }

      await Promise.all([
        fetchTeams(),
        fetchUsers(),
        fetchDepartments(),
      ]);

      window.dispatchEvent(
        new CustomEvent("teams-updated")
      );

      window.dispatchEvent(
        new CustomEvent("department-data-updated")
      );

      alert(
        editingTeam
          ? "Team updated successfully"
          : "Team created successfully"
      );

      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || "Unable to save team");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this team?")) return;

    try {
      await api.delete(`/admin/teams/${id}`);
      await Promise.all([
        fetchTeams(),
        fetchDepartments(),
      ]);

      window.dispatchEvent(
        new CustomEvent("teams-updated")
      );

      window.dispatchEvent(
        new CustomEvent("department-data-updated")
      );
      alert("Team deleted successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const selectManager = (managerId) => {
    setFormData((prev) => ({
      ...prev,
      managerIds: managerId ? [managerId] : [],
    }));
  };


  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="card-title">Team Management</h2>
          <p className="section-subtitle">
            Create teams and assign Managers and HR users.
          </p>
        </div>
      </div>

      <div className="card">
        <h3>{editingTeam ? "Edit Team" : "Create New Team"}</h3>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="input-group">
              <label>Team Name</label>
              <input
                name="name"
                placeholder="Example: Tax Team"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="input-group">
              <label>Department</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    departmentId: e.target.value,
                  })
                }
                required
              >
                <option value="">Select Department</option>

                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label>Assign Managers</label>

              <select
                value={formData.managerIds[0] || ""}
                onChange={(e) => selectManager(e.target.value)}
              >
                <option value="">Select Manager</option>

                {managers.map((manager) => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Assign HR</label>

              <select
                value={formData.hrIds[0] || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hrIds: e.target.value ? [e.target.value] : [],
                  })
                }
              >
                <option value="">Select HR</option>

                {hrs.map((hr) => (
                  <option key={hr._id} value={hr._id}>
                    {hr.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label>Assign Team Leader</label>

                <select
                  name="teamLeaderId"
                  value={formData.teamLeaderId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      teamLeaderId: e.target.value,
                    })
                  }
                >
                  <option value="">No Team Leader Assigned</option>

                  {teamLeaders.map((tl) => (
                    <option key={tl._id} value={tl._id}>
                      {tl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button className="btn btn-primary" type="submit">
              <Plus size={18} />
              {editingTeam ? "Update Team" : "Create Team"}
            </button>

            {editingTeam && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-wrapper modern-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Department</th>
              <th>Managers</th>
              <th>HR</th>
              <th>Team Leader</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {teams.map((team) => (
              <tr key={team._id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-circle">
                      <Users size={16} />
                    </div>
                    <strong>{team.name}</strong>
                  </div>
                </td>

                <td>{team.departmentId?.name || "N/A"}</td>

                <td>
                  {team.managerIds?.length > 0
                    ? team.managerIds.map((m) => m.name).join(", ")
                    : "Not Assigned"}
                </td>

                <td>
                  {team.hrIds?.length > 0
                    ? team.hrIds.map((hr) => hr.name).join(", ")
                    : "Not Assigned"}
                </td>
                <td>
                  {team.teamLeaderId
                    ? `${team.teamLeaderId.name} (${team.teamLeaderId.role})`
                    : "Not Assigned"}
                </td>

                <td>
                  <span
                    className={
                      team.isActive
                        ? "badge badge-success"
                        : "badge badge-danger"
                    }
                  >
                    {team.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn" onClick={() => handleEdit(team)}>
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      className="delete-icon-btn"
                      onClick={() => handleDelete(team._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {teams.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No teams found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminTeams;