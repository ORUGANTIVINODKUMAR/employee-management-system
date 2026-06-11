import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, CalendarCheck, Receipt, Clock } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(formData.email, formData.password);

      localStorage.removeItem("activePage");
      localStorage.setItem("activePage", "dashboard");

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        background:
          "linear-gradient(135deg, #063f2c 0%, #0b5a3b 50%, #0f172a 100%)",
      }}
    >
      <div
        style={{
          padding: "70px",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <img
          src={logo}
          alt="Upsilon"
          style={{
            width: "150px",
            marginBottom: "35px",
          }}
        />

        <h1
          style={{
            fontSize: "52px",
            lineHeight: "1.1",
            marginBottom: "20px",
          }}
        >
          Welcome to Upsilon Services
        </h1>

        <p
          style={{
            fontSize: "18px",
            maxWidth: "620px",
            lineHeight: "1.7",
            color: "#d1fae5",
          }}
        >
          Manage employees, attendance, leaves, reimbursements and approvals
          through one secure HRMS workspace.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "18px",
            marginTop: "40px",
            maxWidth: "620px",
          }}
        >
          <div style={featureBoxStyle}>
            <CalendarCheck size={22} />
            <span>Leave Management</span>
          </div>

          <div style={featureBoxStyle}>
            <Receipt size={22} />
            <span>Reimbursements</span>
          </div>

          <div style={featureBoxStyle}>
            <Clock size={22} />
            <span>Attendance Tracking</span>
          </div>

          <div style={featureBoxStyle}>
            <ShieldCheck size={22} />
            <span>Role Based Access</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          className="auth-card"
          style={{
            width: "430px",
            padding: "42px",
            borderRadius: "24px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
          }}
        >
          <div className="auth-logo" style={{ textAlign: "center" }}>
            <img
              src={logo}
              alt="Upsilon"
              style={{
                width: "95px",
                marginBottom: "14px",
              }}
            />

            <h1>Sign in to Upsilon</h1>

            <p>Employee Management Portal</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const featureBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "16px 18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(8px)",
  fontWeight: "700",
};

export default Login;
