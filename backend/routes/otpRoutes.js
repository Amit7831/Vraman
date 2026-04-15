/**
 * routes/otpRoutes.js — v2
 *
 * All OTP generation requires admin or vendor authentication.
 * Users only have read-only status access.
 */
const express = require('express');
const router  = express.Router();
const { generateOTP, verifyOTP, getBookingForProvider, getOTPStatus } = require('../controllers/otpController');
const { protect, adminOnly, vendorOrAdmin } = require('../middleware/authMiddleware');

// ── Provider routes (admin/vendor only) ─────────────────────────────────
// Generate OTP and send to user email — PROVIDER ONLY
router.post('/generate',          protect, vendorOrAdmin, generateOTP);

// Verify OTP entered by user — PROVIDER ONLY
router.post('/verify',            protect, vendorOrAdmin, verifyOTP);

// Look up booking details for provider dashboard
router.get('/booking/:id',        protect, vendorOrAdmin, getBookingForProvider);

// ── User routes (read-only) ─────────────────────────────────────────────
// User checks if their booking has been OTP-verified (no send ability)
router.get('/status/:bookingId',  protect, getOTPStatus);

module.exports = router;
