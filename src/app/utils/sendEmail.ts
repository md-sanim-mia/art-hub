import config from "../config";
import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  resetPassLink?: string,
  confirmLink?: string
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const clickableResetPass = `<a href="${resetPassLink}" style="color: #28C76F; text-decoration: underline;">here</a>`;
  const clickableConfirm = `<a href="${confirmLink}" style="color: #28C76F; text-decoration: underline;">here</a>`;

  const html = `
  <div style="max-width: 600px; margin: 0 auto; background-color: #F6F7F9; color: #000; border-radius: 8px; padding: 24px;">
    <table style="width: 100%;">
      <tr>
        <td>
          <div style="padding: 5px; text-align: center;">
            <img src="https://res.cloudinary.com/shariful10/image/upload/v1751971147/logo_cfqynn.png" alt="logo" style="height: 40px; margin-bottom: 16px;" />
          </div>
        </td>
        <td style="text-align: right; color: #999;">${formattedDate}</td>
      </tr>
    </table>

    
    ${
      confirmLink
        ? `<h3 style="text-align: center; color: #000;">Verify Your Email Within 10 Minutes</h3>
       <div style="padding: 0 1em;">
         <p style="text-align: left; line-height: 28px; color: #000;">
           <strong style="color: #000;">Verification Link:</strong> Click ${clickableConfirm} to verify your email.
         </p>
       </div>`
        : `<h3 style="text-align: center; color: #000;">Reset Your Password Within 10 Minutes</h3>
       <div style="padding: 0 1em;">
         <p style="text-align: left; line-height: 28px; color: #000;">
           <strong style="color: #000;">Reset Link:</strong> Click ${clickableResetPass} to reset your password.
         </p>
       </div>`
    }
  </div>
  `;

  await transporter.sendMail({
    from: `"manifex" <${config.sendEmail.email_from}>`,
    to,
    subject:resetPassLink ,
    text: "Hello world?",
    html:confirmLink
  });
};

export const sendContactEmail = async (to: string, payload: { fullName: string; email: string; subject?: string |undefined; description: string }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const html = `
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f7f9fc; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background-color: #007bff; padding: 20px; color: #fff; text-align: center;">
      <h2 style="margin: 0;">New Contact Form Submission</h2>
    </div>
    <div style="padding: 20px; color: #333; line-height: 1.5;">
      <p><strong>Full Name:</strong> ${payload.fullName}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Subject:</strong> ${payload?.subject||"Admin Role Invitation Sent"}</p>
      <p><strong>Message:</strong><br/>${payload.description.replace(/\n/g, "<br/>")}</p>
    </div>
    <div style="background-color: #f1f3f6; padding: 15px; text-align: center; color: #555; font-size: 12px;">
      &copy; ${new Date().getFullYear()} Super Job. All rights reserved.
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: ` ${payload.fullName} <${config.sendEmail.email_from}>`,
    to:to||"hasansanim562@gmail.com",
    subject: `New Contact: ${payload?.subject|| "Admin Role Invitation Sent"}`,
    text: `Full Name: ${payload.fullName}\nEmail: ${payload.email}\nSubject: ${payload.subject}\nMessage: ${payload.description}`,
    html,
  });
};

