import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'True',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Your Premier Draft Analytics OTP',
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h1 style="color: #2563eb;">Account Verification</h1>
        <p style="font-size: 16px;">Use the following One-Time Password to verify your account:</p>
        <div style="background-color: #f3f4f6; padding: 20px; font-size: 32px; font-weight: 900; letter-spacing: 10px; border-radius: 8px; margin: 20px 0;">
          ${token}
        </div>
        <p style="font-size: 14px; color: #6b7280;">This code will expire shortly. Do not share it with anyone.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${url}">${url}</a>
    `,
  });
};
