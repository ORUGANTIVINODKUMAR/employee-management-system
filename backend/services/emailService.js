import createTransporter from "../config/mail.js";

export const sendLeaveRequestEmail = async ({
  to,
  employeeName,
  leaveType,
  startDate,
  endDate,
}) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "New Leave Request Pending Approval",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4fdf7; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:14px; padding:30px; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
          <h2 style="color:#0f3d2e;">New Leave Request</h2>
          <p style="color:#334155;">A new leave request has been submitted and is pending your review.</p>

          <table style="width:100%; margin-top:20px; border-collapse:collapse;">
            <tr>
              <td style="padding:10px; font-weight:bold;">Employee</td>
              <td style="padding:10px;">${employeeName}</td>
            </tr>
            <tr>
              <td style="padding:10px; font-weight:bold;">Leave Type</td>
              <td style="padding:10px;">${leaveType}</td>
            </tr>
            <tr>
              <td style="padding:10px; font-weight:bold;">Start Date</td>
              <td style="padding:10px;">${new Date(startDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding:10px; font-weight:bold;">End Date</td>
              <td style="padding:10px;">${new Date(endDate).toLocaleDateString()}</td>
            </tr>
          </table>

          <div style="margin-top:30px;">
            <a href="${process.env.CLIENT_URL}/dashboard" style="background:#22c55e; color:white; padding:14px 22px; border-radius:10px; text-decoration:none; font-weight:bold;">
              Review Request
            </a>
          </div>
        </div>
      </div>
    `,
  });
};


export const sendReimbursementRequestEmail = async ({
  to,
  employeeName,
  businessPurpose,
  totalReimbursement,
}) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "New Reimbursement Request Pending Approval",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4fdf7; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:14px; padding:30px; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
          <h2 style="color:#0f3d2e;">New Reimbursement Request</h2>

          <p style="color:#334155;">
            A new reimbursement request has been submitted and is pending your review.
          </p>

          <table style="width:100%; margin-top:20px; border-collapse:collapse;">
            <tr>
              <td style="padding:10px; font-weight:bold;">Employee</td>
              <td style="padding:10px;">${employeeName}</td>
            </tr>

            <tr>
              <td style="padding:10px; font-weight:bold;">Business Purpose</td>
              <td style="padding:10px;">${businessPurpose}</td>
            </tr>

            <tr>
              <td style="padding:10px; font-weight:bold;">Total Reimbursement</td>
              <td style="padding:10px;">₹ ${totalReimbursement}</td>
            </tr>
          </table>

          <div style="margin-top:30px;">
            <a href="${process.env.CLIENT_URL}/dashboard" style="background:#22c55e; color:white; padding:14px 22px; border-radius:10px; text-decoration:none; font-weight:bold;">
              Review Request
            </a>
          </div>
        </div>
      </div>
    `,
  });
};