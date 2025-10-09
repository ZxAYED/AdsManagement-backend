// getInTouchService.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Or use "host" and "port" for custom SMTP
  auth: {
    user: `${process.env.SMTP_USER}`,
    pass: `${process.env.SMTP_PASS}`, // Use an app password or real password (if less secure apps are allowed)
  },
});

const sendGetInTouchMessage = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}) => {
  console.log("get in touch...", payload);

  const mailOptions = {
    from: `"${payload.firstName} ${payload.lastName}" <${payload.email}>`,
    to: `${process.env.SMTP_USER}`,
    subject: "📩 New Get In Touch Message Received",
    text: `You have received a new message from ${payload.firstName} ${payload.lastName}.`, // Fallback for non-HTML clients
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px;">
        <h2 style="color: #333;">New Contact Message</h2>
        <p>You have received a new message through the "Get In Touch" form. Here are the details:</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; padding: 8px 0;">Name:</td>
            <td>${payload.firstName} ${payload.lastName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px 0;">Email:</td>
            <td><a href="mailto:${payload.email}">${payload.email}</a></td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px 0;">Phone:</td>
            <td>${payload.phone || "N/A"}</td>
          </tr>
        </table>

        <div style="margin-top: 20px;">
          <p style="font-weight: bold;">Message:</p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007BFF;">
            <p style="white-space: pre-wrap; margin: 0;">${payload.message}</p>
          </div>
        </div>

        <p style="margin-top: 30px; font-size: 0.9em; color: #888;">
          This email was generated automatically by your website's contact form.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};


export const getInTouchService = {
  sendGetInTouchMessage,
};
