import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

console.log("SMTP HOST:", process.env.SMTP_HOST);
console.log("SMTP PORT:", process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export default transporter;

