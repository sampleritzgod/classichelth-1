import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const SMTP_USER = process.env.SMTP_EMAIL || process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "u1stcreation1993@gmail.com";

// Validate SMTP config. If not configured, print warnings and run in mock mode
const isMailConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;

if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn(
    "⚠️ Mailer warning: SMTP credentials are not configured. Running mailer in MOCK mode (logging to console)."
  );
}

/**
 * Base email layout wrapper to maintain cream/green premium wellness aesthetic
 */
const getHtmlTemplate = (title, contentHtml) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            background-color: #fbfaf7;
            color: #2c3e2b;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: #fbfaf7;
            padding: 40px 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e9e6df;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(28, 51, 37, 0.03);
          }
          .header {
            background-color: #1c3325;
            padding: 32px;
            text-align: center;
          }
          .header h1 {
            color: #fbfaf7;
            font-family: Georgia, serif;
            font-size: 24px;
            margin: 0;
            letter-spacing: 0.05em;
          }
          .content {
            padding: 40px 32px;
            line-height: 1.6;
            font-size: 15px;
          }
          .footer {
            background-color: #f5f3ed;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #6e7a70;
            border-top: 1px solid #e9e6df;
          }
          .btn {
            display: inline-block;
            background-color: #1c3325;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            letter-spacing: 0.02em;
          }
          .divider {
            height: 1px;
            background-color: #e9e6df;
            margin: 24px 0;
          }
          .quote-box {
            background-color: #fbfaf7;
            border-left: 3px solid #8fad88;
            padding: 16px;
            border-radius: 4px;
            font-style: italic;
            margin: 16px 0;
            color: #4a5d4d;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>U 1st Creation</h1>
            </div>
            <div class="content">
              ${contentHtml}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} U 1st Creation Wellness Clinic. All rights reserved.</p>
              <p>123 Wellness Way, Sanctuary Suite • support@u1stcreation.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Send an email (mock fallback if credentials are not specified)
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (isMailConfigured && transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM || `"U 1st Creation" <${SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`✉️ Email successfully sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  } else {
    console.log("\n================ [MOCK EMAIL OUTBOX] ================");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:\n${text}`);
    console.log("=====================================================\n");
    return { mock: true, messageId: `mock_${Date.now()}` };
  }
};

/**
 * Send Inquiry Reply Email
 */
export const sendInquiryReply = async (email, name, originalMessage, replyText) => {
  const subject = `Re: Your Inquiry at U 1st Creation`;
  const text = `Hello ${name},\n\nThank you for reaching out to U 1st Creation. Here is our response to your inquiry:\n\n"${replyText}"\n\nOriginal message:\n"${originalMessage}"\n\nBest regards,\nU 1st Creation Wellness Clinic`;

  const html = getHtmlTemplate(
    "Response to Your Inquiry",
    `
    <p>Dear ${name},</p>
    <p>Thank you for connecting with U 1st Creation. We appreciate your inquiry and are committed to assisting you on your wellness journey.</p>
    <p>Our clinical response to your message is outlined below:</p>
    
    <div style="background-color: #f0f4f1; border-left: 3px solid #1c3325; padding: 20px; border-radius: 8px; font-weight: 500; color: #1c3325; margin: 20px 0;">
      ${replyText.replace(/\n/g, "<br>")}
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 13px; color: #6e7a70;">Regarding your original inquiry:</p>
    <div class="quote-box">
      "${originalMessage}"
    </div>
    
    <p>If you have any further questions or would like to schedule a personal consultation, please let us know or click below to visit our online portal.</p>
    <div style="text-align: center;">
      <a href="https://your-first-creation.vercel.app" class="btn">Visit U 1st Creation</a>
    </div>
    `
  );

  return sendMail({ to: email, subject, html, text });
};

/**
 * Send Booking Confirmation Email
 */
export const sendBookingConfirmation = async (email, name, appointment) => {
  const subject = `Your Booking at U 1st Creation is Confirmed`;
  
  const dateStr = new Date(appointment.date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const timeStr = appointment.time;
  const service = appointment.service || "Wellness Consultation";

  const text = `Hello ${name},\n\nYour appointment for ${service} has been successfully scheduled.\n\nDate: ${dateStr}\nTime: ${timeStr}\nStatus: Confirmed\n\nThank you for choosing U 1st Creation. We look forward to seeing you.`;

  const html = getHtmlTemplate(
    "Appointment Scheduled Successfully",
    `
    <p>Dear ${name},</p>
    <p>Your upcoming appointment at U 1st Creation has been successfully scheduled. We look forward to welcoming you to our clinic.</p>
    
    <div style="background-color: #fbfaf7; border: 1px solid #e9e6df; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70; width: 35%;">Service:</td>
          <td style="padding: 6px 0; color: #1c3325; font-weight: bold;">${service}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Date:</td>
          <td style="padding: 6px 0; color: #1c3325;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Time:</td>
          <td style="padding: 6px 0; color: #1c3325;">${timeStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Status:</td>
          <td style="padding: 6px 0;"><span style="background-color: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Confirmed</span></td>
        </tr>
      </table>
    </div>
    
    <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance by replying directly to this email or calling our clinic.</p>
    `
  );

  return sendMail({ to: email, subject, html, text });
};

/**
 * Send Booking Status Update Email
 */
export const sendBookingStatusUpdate = async (email, name, appointment) => {
  const status = appointment.status || "Pending";
  const service = appointment.service || "Wellness Consultation";
  const dateStr = new Date(appointment.date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = appointment.time;

  const subject = `Update: Your Appointment at U 1st Creation is ${status}`;
  
  let statusBadgeStyle = "background-color: #fff3e0; color: #ef6c00;";
  if (status.toLowerCase() === "confirmed") {
    statusBadgeStyle = "background-color: #e8f5e9; color: #2e7d32;";
  } else if (status.toLowerCase() === "cancelled") {
    statusBadgeStyle = "background-color: #ffebee; color: #c62828;";
  } else if (status.toLowerCase() === "completed") {
    statusBadgeStyle = "background-color: #e3f2fd; color: #1565c0;";
  }

  const text = `Hello ${name},\n\nThe status of your appointment for ${service} has been updated to: ${status}.\n\nDate: ${dateStr}\nTime: ${timeStr}\n\nBest regards,\nU 1st Creation`;

  const html = getHtmlTemplate(
    "Appointment Status Updated",
    `
    <p>Dear ${name},</p>
    <p>We are writing to update you on the status of your appointment at U 1st Creation.</p>
    
    <div style="background-color: #fbfaf7; border: 1px solid #e9e6df; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70; width: 35%;">Service:</td>
          <td style="padding: 6px 0; color: #1c3325; font-weight: bold;">${service}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Date:</td>
          <td style="padding: 6px 0; color: #1c3325;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Time:</td>
          <td style="padding: 6px 0; color: #1c3325;">${timeStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Current Status:</td>
          <td style="padding: 6px 0;">
            <span style="${statusBadgeStyle} padding: 4px 10px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              ${status}
            </span>
          </td>
        </tr>
      </table>
    </div>

    ${
      status.toLowerCase() === "cancelled"
        ? "<p>We apologize for any inconvenience this may cause. If you would like to book a different time slot, please visit our website or call us directly.</p>"
        : "<p>If you have any questions or need to make further adjustments, please feel free to reach out.</p>"
    }
    `
  );

  return sendMail({ to: email, subject, html, text });
};

/**
 * Send Admin Appointment Notification Email
 */
export const sendAdminAppointmentNotification = async (appointment) => {
  const adminEmail = process.env.SMTP_EMAIL || "u1stcreation1993@gmail.com";
  const subject = `[New Booking] Appointment with ${appointment.name}`;
  
  const dateStr = new Date(appointment.date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const text = `New Appointment Booking Details:\n\n` +
    `Patient Name: ${appointment.name}\n` +
    `Email: ${appointment.email}\n` +
    `Phone: ${appointment.phone}\n` +
    `Service: ${appointment.service || "General Wellness Consultation"}\n` +
    `Date: ${dateStr}\n` +
    `Time Slot: ${appointment.timeSlot || appointment.time}\n` +
    `Symptoms/Concern: ${appointment.condition || "Not specified"}\n` +
    `Message: ${appointment.message || "No message left"}\n`;

  const html = getHtmlTemplate(
    "New Booking Notification",
    `
    <p>Dear Administrator,</p>
    <p>A new appointment has been scheduled through the U 1st Creation website. Below are the booking details:</p>
    
    <div style="background-color: #fbfaf7; border: 1px solid #e9e6df; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70; width: 35%;">Patient Name:</td>
          <td style="padding: 6px 0; color: #1c3325; font-weight: bold;">${appointment.name}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Email:</td>
          <td style="padding: 6px 0; color: #1c3325;">${appointment.email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Phone:</td>
          <td style="padding: 6px 0; color: #1c3325;">${appointment.phone}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Service:</td>
          <td style="padding: 6px 0; color: #1c3325; font-weight: bold;">${appointment.service || "General Wellness Consultation"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Date:</td>
          <td style="padding: 6px 0; color: #1c3325;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Time Slot:</td>
          <td style="padding: 6px 0; color: #1c3325;">${appointment.timeSlot || appointment.time}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Concern:</td>
          <td style="padding: 6px 0; color: #1c3325;">${appointment.condition || "Not specified"}</td>
        </tr>
      </table>
    </div>

    <div class="divider"></div>
    <p style="font-size: 13px; color: #6e7a70;">Message from patient:</p>
    <div class="quote-box">
      "${appointment.message || "No booking message left by the client."}"
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://your-first-creation.vercel.app/admin/appointments" class="btn">Manage in Admin Board</a>
    </div>
    `
  );

  return sendMail({ to: adminEmail, subject, html, text });
};

/**
 * Send Admin Message/Inquiry Notification Email
 */
export const sendAdminMessageNotification = async (message) => {
  const adminEmail = process.env.SMTP_EMAIL || "u1stcreation1993@gmail.com";
  const subject = `[New Contact Inquiry] from ${message.name}`;

  const text = `New Contact Form Inquiry Details:\n\n` +
    `Sender Name: ${message.name}\n` +
    `Email: ${message.email}\n` +
    `Message:\n${message.message}\n`;

  const html = getHtmlTemplate(
    "New Contact Form Submission",
    `
    <p>Dear Administrator,</p>
    <p>A visitor has submitted a new inquiry through the contact form on your website.</p>
    
    <div style="background-color: #fbfaf7; border: 1px solid #e9e6df; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70; width: 35%;">Sender Name:</td>
          <td style="padding: 6px 0; color: #1c3325; font-weight: bold;">${message.name}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 600; color: #6e7a70;">Email:</td>
          <td style="padding: 6px 0; color: #1c3325;">${message.email}</td>
        </tr>
      </table>
    </div>

    <div class="divider"></div>
    <p style="font-size: 13px; color: #6e7a70;">Message body:</p>
    <div class="quote-box">
      "${message.message}"
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://your-first-creation.vercel.app/admin/messages" class="btn">View & Reply in Inbox</a>
    </div>
    `
  );

  return sendMail({ to: adminEmail, subject, html, text });
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = `Reset Your Password - U 1st Creation`;
  const text = `Hello ${name},\n\nYou requested a password reset. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

  const html = getHtmlTemplate(
    "Reset Your Password",
    `
    <p>Dear ${name},</p>
    <p>We received a request to reset the password associated with your account at U 1st Creation.</p>
    <p>Please click the button below to choose a new password. This link is valid for the next 10 minutes:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="btn" style="background-color: #1c3325; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 600;">Reset Password</a>
    </div>
    
    <p style="font-size: 13px; color: #6e7a70;">If the button above does not work, copy and paste the following URL into your web browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #8fad88;">${resetUrl}</p>
    
    <div class="divider"></div>
    
    <p>If you did not request a password reset, please ignore this email or contact support if you have security concerns.</p>
    `
  );

  return sendMail({ to: email, subject, html, text });
};

