const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 5000,   // fail fast — 5s to connect
  greetingTimeout: 5000,
  socketTimeout: 10000
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"BrainLink" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email error:', err.message);
    return { success: false, error: err.message };
  }
};

const sendOTP = async (email, otp, purpose = 'verification') => {
  // In development, always print OTP to console so you can test without email
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n============================`);
    console.log(`  OTP for ${email}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`  OTP CODE: ${otp}`);
    console.log(`============================\n`);
  }

  return sendEmail({
    to: email,
    subject: `OTP for ${purpose} - BrainLink`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#1e40af;">Your OTP Code</h2>
        <p>Your OTP for <strong>${purpose}</strong> is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af;margin:24px 0;background:#f0f4ff;padding:16px;border-radius:8px;text-align:center;">${otp}</div>
        <p style="color:#6b7280;font-size:13px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `
  });
};

const sendInvoiceEmail = async (user, payment) => {
  const planDetails = {
    bronze: { name: 'Bronze Plan', price: '₹100/month', limit: '5 questions/day' },
    silver: { name: 'Silver Plan', price: '₹300/month', limit: '10 questions/day' },
    gold:   { name: 'Gold Plan',   price: '₹1000/month', limit: 'Unlimited questions/day' }
  };
  const plan = planDetails[payment.plan];
  return sendEmail({
    to: user.email,
    subject: `Invoice #${payment.invoiceNumber} - Subscription Activated`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#1e40af;">🎉 Subscription Activated!</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your payment was successful. Here are your subscription details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f3f4f6;"><td style="padding:10px;border:1px solid #d1d5db;"><strong>Invoice #</strong></td><td style="padding:10px;border:1px solid #d1d5db;">${payment.invoiceNumber}</td></tr>
          <tr><td style="padding:10px;border:1px solid #d1d5db;"><strong>Plan</strong></td><td style="padding:10px;border:1px solid #d1d5db;">${plan.name}</td></tr>
          <tr style="background:#f3f4f6;"><td style="padding:10px;border:1px solid #d1d5db;"><strong>Price</strong></td><td style="padding:10px;border:1px solid #d1d5db;">${plan.price}</td></tr>
          <tr><td style="padding:10px;border:1px solid #d1d5db;"><strong>Question Limit</strong></td><td style="padding:10px;border:1px solid #d1d5db;">${plan.limit}</td></tr>
          <tr style="background:#f3f4f6;"><td style="padding:10px;border:1px solid #d1d5db;"><strong>Payment ID</strong></td><td style="padding:10px;border:1px solid #d1d5db;">${payment.razorpayPaymentId || 'N/A'}</td></tr>
          <tr><td style="padding:10px;border:1px solid #d1d5db;"><strong>Amount Paid</strong></td><td style="padding:10px;border:1px solid #d1d5db;">₹${payment.amount / 100}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px;">Valid for 30 days from purchase date.</p>
        <p>Thank you for subscribing to BrainLink!</p>
      </div>
    `
  });
};

module.exports = { sendEmail, sendOTP, sendInvoiceEmail };
