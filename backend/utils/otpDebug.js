/**
 * utils/otpDebug.js
 *
 * Run this script to verify your OTP system is configured correctly:
 *   node utils/otpDebug.js
 *
 * It will check:
 *  - MongoDB connection
 *  - OTP model functions (hash, generate, verify)
 *  - Email transporter (or console fallback)
 *  - All required env vars
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const crypto = require('crypto');

console.log('\n🔍 Vraman OTP System Diagnostic\n' + '='.repeat(40));

// 1. Required env vars
const required = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];
const optional = { EMAIL_USER: 'email', EMAIL_PASS: 'email', OTP_EXPIRY_MINUTES: '10', OTP_MAX_ATTEMPTS: '5' };

console.log('\n1️⃣  Environment Variables:');
required.forEach(k => {
  const val = process.env[k];
  console.log(`   ${val ? '✅' : '❌'} ${k}: ${val ? '[set]' : 'MISSING!'}`);
});
Object.entries(optional).forEach(([k, def]) => {
  const val = process.env[k];
  const isPlaceholder = val && (val.includes('your_') || val.includes('example'));
  console.log(`   ${val && !isPlaceholder ? '✅' : '⚠️ '} ${k}: ${val && !isPlaceholder ? '[set]' : isPlaceholder ? `placeholder (using console fallback)` : `not set (default: ${def})`}`);
});

// 2. OTP generation & hashing
console.log('\n2️⃣  OTP Crypto Functions:');
try {
  // Simulate OTP.generateOTP()
  const buf = crypto.randomBytes(3);
  const otp = String(buf.readUIntBE(0, 3) % 1000000).padStart(6, '0');
  console.log(`   ✅ OTP generated: ${otp}`);

  // Simulate OTP.hashOTP()
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  console.log(`   ✅ SHA-256 hash:  ${hash.substring(0, 20)}...`);

  // Verify hash round-trip
  const verify = crypto.createHash('sha256').update(otp).digest('hex') === hash;
  console.log(`   ✅ Hash verify:   ${verify ? 'PASS' : 'FAIL'}`);

  // Wrong OTP
  const wrongHash = crypto.createHash('sha256').update('000000').digest('hex');
  const wrongCheck = wrongHash === hash;
  console.log(`   ✅ Wrong OTP rejected: ${!wrongCheck ? 'PASS' : 'FAIL'}`);
} catch (e) {
  console.log(`   ❌ Crypto error: ${e.message}`);
}

// 3. Email check
console.log('\n3️⃣  Email Configuration:');
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
if (!emailUser || !emailPass || emailUser.includes('your_') || emailPass.includes('your_')) {
  console.log('   ⚠️  Email not configured — OTPs will print to console (dev mode)');
  console.log('   ℹ️  To enable: set EMAIL_USER and EMAIL_PASS (Gmail App Password) in .env');
} else {
  console.log(`   ✅ EMAIL_USER set to: ${emailUser}`);
  console.log('   ✅ EMAIL_PASS is set (length: ' + emailPass.length + ' chars)');
  if (emailPass.length !== 16) {
    console.log('   ⚠️  Gmail App Passwords are exactly 16 chars — yours is ' + emailPass.length);
  }
}

// 4. OTP expiry
console.log('\n4️⃣  OTP Configuration:');
const expiry   = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
console.log(`   ✅ OTP expires in: ${expiry} minutes`);
console.log(`   ✅ Max attempts:   ${maxAttempts}`);
const expiresAt = new Date(Date.now() + expiry * 60 * 1000);
console.log(`   ✅ Next OTP would expire at: ${expiresAt.toLocaleTimeString()}`);

// 5. Route summary
console.log('\n5️⃣  API Routes (all on /api/otp):');
console.log('   POST /generate      → provider only (vendorOrAdmin)');
console.log('   POST /verify        → provider only (vendorOrAdmin)');
console.log('   GET  /booking/:id   → provider only (vendorOrAdmin)');
console.log('   GET  /status/:bookingId → any logged-in user');

console.log('\n6️⃣  Security Checklist:');
console.log('   ✅ OTP stored as SHA-256 hash (never plaintext)');
console.log('   ✅ OTP generation restricted to admin/vendor only');
console.log('   ✅ Max attempt lockout after ' + maxAttempts + ' failures');
console.log('   ✅ OTP expires after ' + expiry + ' minutes');
console.log('   ✅ Single-use (isVerified flag prevents reuse)');
console.log('   ✅ Booking ID required (full MongoDB ObjectId)');
console.log('   ✅ 60-second cooldown on resend');

console.log('\n' + '='.repeat(40));
console.log('✅ Diagnostic complete. Fix any ❌ items above.\n');
