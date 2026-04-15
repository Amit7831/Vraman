/**
 * utils/emailService.js — v2 FIXED
 *
 * BUGS FIXED:
 *  1. Added placeholder credential detection — if .env still has the example values
 *     ("your_gmail@gmail.com"), skip creating transporter and fall back to console.
 *     Previously the bad credentials would be passed to nodemailer causing an SMTP
 *     authentication error on every OTP generation, even though the OTP itself was valid.
 *
 *  2. Added transporter.verify() on creation to surface auth errors at startup,
 *     not silently at runtime during OTP send.
 *
 *  3. Improved console fallback format — shows devOTP clearly for local testing.
 *
 * Nodemailer Gmail SMTP setup:
 *   1. Enable 2-Factor Authentication on your Gmail account
 *   2. Go to: Google Account → Security → 2-Step Verification → App Passwords
 *   3. Create an App Password for "Mail" → copy the 16-char code (no spaces)
 *   4. Set in .env:
 *        EMAIL_USER=youraddress@gmail.com
 *        EMAIL_PASS=abcdabcdabcdabcd     ← 16-char App Password, NO spaces
 *        EMAIL_FROM=Vraman Travel <youraddress@gmail.com>
 */
const nodemailer = require('nodemailer');

let transporter    = null;
let transportReady = false;

/** Detect if the .env still has placeholder/example values */
function isPlaceholder(val) {
  if (!val) return true;
  const placeholders = [
    'your_gmail@gmail.com',
    'your_16_char_app_password',
    'youremail@gmail.com',
    'example@gmail.com',
    'CHANGE_ME',
  ];
  return placeholders.some(p => val.includes(p));
}

async function getTransporter() {
  if (transportReady) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // ✅ FIX: Detect placeholder credentials before creating transporter
  if (isPlaceholder(emailUser) || isPlaceholder(emailPass)) {
    console.warn('⚠️  Email credentials are placeholders — OTP emails will be logged to console.');
    console.warn('    To enable real email: set EMAIL_USER and EMAIL_PASS (App Password) in .env');
    transportReady = true;  // mark as "checked" so we don't log every time
    transporter = null;
    return null;
  }

  try {
    const t = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      // Extra reliability settings
      pool:             true,
      maxConnections:   3,
      rateDelta:        20000,
      rateLimit:        5,
    });

    // ✅ FIX: Verify credentials at startup, not silently at send-time
    await t.verify();
    transporter    = t;
    transportReady = true;
    console.log(`✉️  Email transporter ready → ${emailUser}`);
  } catch (err) {
    console.error('❌ Email transporter setup failed:', err.message);
    console.error('   Check EMAIL_USER and EMAIL_PASS in your .env');
    console.error('   Make sure EMAIL_PASS is a Gmail App Password (not your login password)');
    transporter    = null;
    transportReady = true;  // mark checked so we don't retry every time
  }

  return transporter;
}

/**
 * sendOTPEmail — sends the formatted OTP email to the user.
 * Falls back to console.log if email is not configured (safe for dev).
 */
async function sendOTPEmail({
  to, name, otp, bookingId, serviceName, serviceType, expiresInMinutes = 10,
}) {
  const tp = await getTransporter();

  const subject = `Your Vraman OTP — ${otp} (expires in ${expiresInMinutes} min)`;

  const typeLabel = {
    hotel:   '🏨 Hotel',
    bike:    '🏍 Bike Rental',
    cab:     '🚗 Cab',
    service: '🌏 Travel Package',
    bus:     '🚌 Bus',
    flight:  '✈️ Flight',
  }[serviceType] || '🎫 Service';

  const shortBookingId = `#${String(bookingId).slice(-8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vraman OTP</title>
</head>
<body style="margin:0;padding:0;background:#EEF0F6;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,29,59,0.12);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1A1D3B,#2A2F5E);padding:32px 36px;text-align:center;">
      <div style="display:inline-block;background:linear-gradient(135deg,#5B5FCF,#2DCBA4);border-radius:14px;padding:10px 22px;margin-bottom:16px;">
        <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">✈ Vraman</span>
      </div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Service Verification OTP</h1>
    </div>

    <!-- Body -->
    <div style="padding:36px;">
      <p style="color:#1A1D3B;font-size:15px;margin:0 0 24px;line-height:1.6;">
        Hi <strong>${name || 'Traveller'}</strong>,<br><br>
        Your booking for <strong>${typeLabel}: ${serviceName || 'your service'}</strong> is confirmed.
        Please tell this OTP to the service provider when you arrive.
      </p>

      <!-- OTP Box -->
      <div style="background:#EEF0F6;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
        <p style="color:#5B5FCF;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">
          Your One-Time Password
        </p>
        <div style="background:#1A1D3B;border-radius:12px;padding:20px 32px;display:inline-block;letter-spacing:14px;font-size:42px;font-weight:800;color:#fff;font-family:'Courier New',monospace;">
          ${otp}
        </div>
        <p style="color:#888;font-size:12px;margin:14px 0 0;">
          ⏰ Expires in <strong>${expiresInMinutes} minutes</strong>
        </p>
      </div>

      <!-- Booking Info -->
      <div style="background:#f8f9ff;border-radius:12px;padding:18px 20px;margin:0 0 24px;border-left:4px solid #5B5FCF;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#888;font-size:12px;padding:5px 0;">Booking ID</td>
            <td style="color:#1A1D3B;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">${shortBookingId}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:12px;padding:5px 0;">Service</td>
            <td style="color:#1A1D3B;font-size:12px;font-weight:600;text-align:right;">${serviceName || '—'}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:12px;padding:5px 0;">Type</td>
            <td style="color:#1A1D3B;font-size:12px;text-align:right;">${typeLabel}</td>
          </tr>
        </table>
      </div>

      <!-- Instructions -->
      <div style="background:#fff9e6;border-radius:12px;padding:16px 18px;border:1px solid #fde68a;">
        <p style="color:#92400e;font-size:13px;margin:0 0 8px;font-weight:700;">📋 How to use this OTP</p>
        <ol style="color:#78350f;font-size:13px;margin:0;padding-left:20px;line-height:2;">
          <li>Arrive at the service location</li>
          <li>Show this OTP (verbally or visually) to the service provider</li>
          <li>The provider enters it into their system to verify your booking</li>
          <li>Once verified, you get access ✅</li>
        </ol>
      </div>

      <p style="color:#aaa;font-size:11px;text-align:center;margin:24px 0 0;line-height:1.7;">
        ⚠ Do not share this OTP with anyone else.<br>
        Vraman never asks for your OTP via call or chat.<br>
        This email was sent automatically — please do not reply.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#EEF0F6;padding:16px;text-align:center;">
      <p style="color:#888;font-size:11px;margin:0;">© 2025 Vraman Travel Platform · India</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Vraman OTP Verification
=======================
Hi ${name || 'Traveller'},

Your OTP for ${serviceName || 'your booking'} (${shortBookingId}) is:

  ${otp}

This OTP expires in ${expiresInMinutes} minutes.

Show this OTP to the service provider when you arrive.
Do NOT share this OTP with anyone else.
  `.trim();

  if (!tp) {
    // ✅ Dev fallback — clear console output for local testing
    console.log('\n' + '='.repeat(55));
    console.log('📧  OTP EMAIL (email not configured — console mode)');
    console.log('='.repeat(55));
    console.log(`   To:         ${to}`);
    console.log(`   Subject:    ${subject}`);
    console.log(`   OTP:        ${otp}  ← use this to test verification`);
    console.log(`   Booking:    ${shortBookingId}`);
    console.log(`   Service:    ${serviceName || typeLabel}`);
    console.log(`   Expires in: ${expiresInMinutes} minutes`);
    console.log('='.repeat(55) + '\n');
    return { messageId: 'console-dev-mode', devMode: true };
  }

  const info = await tp.sendMail({
    from:    process.env.EMAIL_FROM || `Vraman Travel <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });

  console.log(`✉️  OTP email sent → ${to} (messageId: ${info.messageId})`);
  return info;
}

module.exports = { sendOTPEmail };
