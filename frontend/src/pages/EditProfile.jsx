import { useEffect, useState } from "react";
import api from "../api/api";

const EditProfile = () => {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/profile/me");
      setProfile(data.user);
      setPhone(data.user.phone || "");
    } catch (error) {
      setError("Unable to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateMobile = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      await api.put("/profile/mobile", { phone });

      setMessage("Mobile number updated successfully");
      fetchProfile();
    } catch (error) {
      setError(error.response?.data?.message || "Mobile update failed");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      if (newPassword !== confirmPassword) {
        setError("New password and confirm password do not match");
        return;
      }

      await api.put("/profile/password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Password changed successfully. Admin has been notified.");
    } catch (error) {
      setError(error.response?.data?.message || "Password change failed");
    }
  };

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="card-title">Edit Profile</h2>
          <p className="section-subtitle">
            You can update only your mobile number and password.
          </p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h3>Employee Details</h3>

        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Employee ID:</strong> {profile.employeeId}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Designation:</strong> {profile.designation}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>Department:</strong> {profile.subcategoryId?.name || "N/A"}</p>
        <p>
          <strong>Date of Joining:</strong>{" "}
          {profile.dateOfJoining
            ? new Date(profile.dateOfJoining).toLocaleDateString()
            : "N/A"}
        </p>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Update Mobile Number</h3>

        <form className="auth-form" onSubmit={updateMobile}>
          <div className="input-group">
            <label>Mobile Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit">
            Save Mobile
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3>Change Password</h3>

        <form className="auth-form" onSubmit={changePassword}>
          <div className="input-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;