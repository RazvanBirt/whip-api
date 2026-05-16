// src/infra/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

type SendPasswordResetEmailParams = {
    to: string;
    resetUrl: string;
};

export async function sendPasswordResetEmail({
    to,
    resetUrl,
}: SendPasswordResetEmailParams) {
    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: "Reset your password",
        text: `You requested a password reset.

Click this link to reset your password:

${resetUrl}

This link will expire soon.

If you did not request this, you can ignore this email.`,
        html: `
      <p>You requested a password reset.</p>

      <p>
        <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">
          Reset your password
        </a>
      </p>

      <p>This link will expire soon.</p>

      <p>If you did not request this, you can ignore this email.</p>
    `,
    });
}