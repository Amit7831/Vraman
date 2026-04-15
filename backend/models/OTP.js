/**
 * models/OTP.js
 * Stores hashed OTP per booking with expiry, attempt tracking, and verified flag.
 */
const mongoose = require('mongoose');
const crypto   = require('crypto');

const otpSchema = new mongoose.Schema({
  bookingId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  otpHash:      { type: String, required: true },          // SHA-256 hash of the 6-digit OTP
  expiresAt:    { type: Date,   required: true },
  isVerified:   { type: Boolean, default: false },
  attempts:     { type: Number,  default: 0 },             // failed attempt counter
  maxAttempts:  { type: Number,  default: 5 },
  lastSentAt:   { type: Date,   default: Date.now },       // for rate-limiting resends
}, { timestamps: true });

// Auto-expire documents 1 hour after expiresAt (MongoDB TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
otpSchema.index({ bookingId: 1 });

/** Hash a plaintext OTP string using SHA-256 */
otpSchema.statics.hashOTP = (plainOTP) =>
  crypto.createHash('sha256').update(String(plainOTP)).digest('hex');

/** Generate a cryptographically secure 6-digit OTP */
otpSchema.statics.generateOTP = () => {
  const buf = crypto.randomBytes(3);          // 3 bytes → max 16,777,215
  return String(buf.readUIntBE(0, 3) % 1000000).padStart(6, '0');
};

/** Check if OTP is expired */
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

/** Check if attempt limit exceeded */
otpSchema.methods.isLocked = function () {
  return this.attempts >= this.maxAttempts;
};

/** Verify plaintext OTP against stored hash */
otpSchema.methods.checkOTP = function (plainOTP) {
  const hash = mongoose.model('OTP').hashOTP(plainOTP);
  return this.otpHash === hash;
};

module.exports = mongoose.model('OTP', otpSchema);
