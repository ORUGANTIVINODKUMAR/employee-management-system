{user?.role === "Finance" && (
  <>
    <li>
      <Link to="/finance-leaves">Finance Leaves</Link>
    </li>

    <li>
      <Link to="/finance-reimbursements">
        Finance Reimbursements
      </Link>
    </li>
  </>
)}

{["Manager", "HR", "Finance", "Admin"].includes(
  user?.role
) && (
  <li>
    <Link to="/leave-calendar">
      Leave Calendar
    </Link>
  </li>
)}

{/* Add this */}
<li>
  <Link to="/edit-profile">
    Edit Profile
  </Link>
</li>
