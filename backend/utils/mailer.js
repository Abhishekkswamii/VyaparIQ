"use strict";

const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getFrom() {
  return `"VyaparIQ" <${process.env.SMTP_USER || "noreply@vyapariq.com"}>`;
}

// ── Forgot-password email ──────────────────────────────────────────────────────

async function sendPasswordResetEmail({ to, firstName, resetUrl }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: getFrom(),
    to,
    subject: "Reset your VyaparIQ password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <div style="background:#F97316;padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">VyaparIQ</h1>
          <p style="color:#fed7aa;margin:4px 0 0;font-size:13px">Smart Budget Shopping</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          <p style="font-size:16px;color:#111827;margin-top:0">Hi ${firstName},</p>
          <p style="color:#6b7280">We received a request to reset your VyaparIQ password.
             Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}"
               style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;
                      text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Reset Password
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

// ── Order confirmation email ───────────────────────────────────────────────────

async function sendOrderConfirmationEmail({ to, firstName, order }) {
  const transporter = getTransporter();

  const itemRows = (order.items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">
            ${it.name}${it.category ? `<br><span style="font-size:11px;color:#9ca3af">${it.category}</span>` : ""}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center">
            ${it.quantity}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:right">
            ₹${parseFloat(it.price).toFixed(2)}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;text-align:right">
            ₹${parseFloat(it.line_total || it.price * it.quantity).toFixed(2)}
          </td>
        </tr>`
    )
    .join("");

  const addr = order.address || {};
  const addrLine = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const payLabel = order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method;

  const subtotal  = parseFloat(order.subtotal  || order.total_amount).toFixed(2);
  const discount  = parseFloat(order.discount  || 0).toFixed(2);
  const total     = parseFloat(order.total_amount).toFixed(2);

  await transporter.sendMail({
    from: getFrom(),
    to,
    subject: `✅ Order Confirmed #${order.id} — VyaparIQ`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#111827">

        <!-- Header -->
        <div style="background:#F97316;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:-0.5px">VyaparIQ</h1>
          <p style="color:#fed7aa;margin:4px 0 0;font-size:13px">Smart Budget Shopping</p>
        </div>

        <!-- Body -->
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">

          <!-- Greeting -->
          <p style="font-size:17px;font-weight:700;margin-top:0">Hi ${firstName} 👋</p>
          <p style="color:#6b7280;margin-top:-8px">
            Your order has been <strong style="color:#16a34a">placed successfully!</strong>
            We'll keep you updated as it progresses.
          </p>

          <!-- Order Summary Box -->
          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:10px;margin:20px 0;overflow:hidden">
            <tr>
              <td style="padding:11px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">Order ID</td>
              <td style="padding:11px 16px;font-size:13px;font-weight:700;color:#F97316;text-align:right;border-bottom:1px solid #f3f4f6">#${order.id}</td>
            </tr>
            <tr>
              <td style="padding:11px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">Order Date</td>
              <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6">${orderDate}</td>
            </tr>
            <tr>
              <td style="padding:11px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6">Payment Method</td>
              <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6">${payLabel}</td>
            </tr>
            <tr>
              <td style="padding:11px 16px;font-size:13px;color:#6b7280">Status</td>
              <td style="padding:11px 16px;text-align:right">
                <span style="background:#fff7ed;color:#ea580c;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #fed7aa">PENDING</span>
              </td>
            </tr>
          </table>

          ${addrLine ? `
          <!-- Delivery Address -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-bottom:20px">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px">📦 Delivery Address</p>
            <p style="margin:0;font-size:13px;color:#374151">${addrLine}</p>
            ${addr.name ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280">Recipient: ${addr.name}</p>` : ""}
          </div>` : ""}

          <!-- Items Table -->
          <p style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🛒 Order Items</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:#1C1C1E">
                <th style="padding:10px 8px;font-size:11px;color:#fff;text-align:left;font-weight:600">ITEM</th>
                <th style="padding:10px 8px;font-size:11px;color:#fff;text-align:center;font-weight:600">QTY</th>
                <th style="padding:10px 8px;font-size:11px;color:#fff;text-align:right;font-weight:600">UNIT</th>
                <th style="padding:10px 8px;font-size:11px;color:#fff;text-align:right;font-weight:600">TOTAL</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <!-- Price Breakdown -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#6b7280">Subtotal</td>
              <td style="padding:6px 0;font-size:13px;color:#111827;text-align:right">₹${subtotal}</td>
            </tr>
            ${parseFloat(discount) > 0 ? `
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#16a34a">Discount</td>
              <td style="padding:6px 0;font-size:13px;color:#16a34a;text-align:right">– ₹${discount}</td>
            </tr>` : ""}
            <tr style="border-top:2px solid #f3f4f6">
              <td style="padding:12px 0 6px;font-size:16px;font-weight:800;color:#111827">Total Paid</td>
              <td style="padding:12px 0 6px;font-size:18px;font-weight:800;color:#F97316;text-align:right">₹${total}</td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin:24px 0 16px">
            <a href="https://vyapariq.web.app/orders"
               style="background:#F97316;color:#fff;padding:13px 32px;border-radius:8px;
                      text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
              Track My Order →
            </a>
          </div>

          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:16px">
            Thank you for shopping with VyaparIQ! 🧡<br>
            If you have questions, reply to this email.
          </p>
        </div>
      </div>
    `,
  });
}

// ── Google account notice email ───────────────────────────────────────────────

async function sendGoogleAccountEmail({ to, firstName }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: getFrom(),
    to,
    subject: "VyaparIQ — Your account uses Google Sign-In",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <div style="background:#F97316;padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">VyaparIQ</h1>
          <p style="color:#fed7aa;margin:4px 0 0;font-size:13px">Smart Budget Shopping</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          <p style="font-size:16px;color:#111827;margin-top:0">Hi ${firstName},</p>
          <p style="color:#6b7280">
            We received a password reset request for this email address. However,
            your VyaparIQ account is linked to <strong>Google Sign-In</strong> —
            it doesn't have a separate password.
          </p>
          <p style="color:#6b7280">To sign in, just use the <strong>"Continue with Google"</strong> button on the login page.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="https://vyapariq.web.app/login"
               style="background:#F97316;color:#fff;padding:12px 28px;border-radius:8px;
                      text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
              Go to Sign In
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

// ── Account deletion confirmation email ──────────────────────────────────────

async function sendAccountDeletionEmail({ to, firstName }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: getFrom(),
    to,
    subject: "Your VyaparIQ account has been deleted",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <div style="background:#1C1C1E;padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#F97316;margin:0;font-size:24px">VyaparIQ</h1>
          <p style="color:#9ca3af;margin:4px 0 0;font-size:13px">Smart Budget Shopping</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          <p style="font-size:16px;color:#111827;margin-top:0">Hi ${firstName},</p>
          <p style="color:#6b7280">
            Your VyaparIQ account has been <strong style="color:#dc2626">permanently deleted</strong> as requested.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0;font-size:13px;color:#7f1d1d;font-weight:600">The following data has been removed:</p>
            <ul style="margin:8px 0 0;padding-left:16px;font-size:13px;color:#991b1b">
              <li>Account &amp; profile information</li>
              <li>All orders and order history</li>
              <li>Saved addresses</li>
              <li>Budget settings and expense logs</li>
              <li>Cart and shopping sessions</li>
            </ul>
          </div>
          <p style="color:#6b7280;font-size:13px">
            If you didn't request this deletion or believe this was a mistake,
            please contact us immediately by replying to this email.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px">
            Thank you for being a VyaparIQ customer. We're sorry to see you go. 🧡
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendOrderConfirmationEmail, sendGoogleAccountEmail, sendAccountDeletionEmail };
