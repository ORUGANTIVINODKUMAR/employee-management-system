import { Routes, Route } from "react-router-dom";
import FinanceLeaves from "./pages/FinanceLeaves";
import FinanceReimbursements from "./pages/FinanceReimbursements";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LeaveCalendar from "./pages/LeaveCalendar";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/finance-leaves" element={<FinanceLeaves />} />

      <Route
        path="/finance-reimbursements"
        element={<FinanceReimbursements />}
      />
      <Route
        path="/leave-calendar"
        element={
          <ProtectedRoute>
            <LeaveCalendar />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;