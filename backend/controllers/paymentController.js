/**
 * controllers/paymentController.js
 * Razorpay TEST MODE — order creation + HMAC-SHA256 signature verification.
 *
 * Required .env:
 *   RAZORPAY_KEY_ID     = rzp_test_...
 *   RAZORPAY_KEY_SECRET = ...
 *
 * Install: npm install razorpay
 */
const crypto  = require('crypto');
const Booking = require('../models/Booking');

// Lazy-load so server starts even if 'razorpay' package isn't installed yet
let Razorpay;
try { Razorpay = require('razorpay'); } catch (_) { Razorpay = null; }

function getRazorpayInstance() {
  if (!Razorpay)
    throw new Error('razorpay package not installed — run: npm install razorpay');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ── GET /api/payment/key ────────────────────────────────────────────────────
// Returns the PUBLIC key_id so the frontend can initialise Razorpay Checkout.
const getKey = (_req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
};

// ── POST /api/payment/create-order ─────────────────────────────────────────
// Creates a Razorpay order for a specific booking. Auth required.
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId)
      return res.status(400).json({ message: 'bookingId is required' });

    // Security: only the owner can pay
    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ message: 'This booking is already paid' });

    const rzp = getRazorpayInstance();

    // Razorpay amounts are in the smallest currency unit (paise for INR)
    const amountPaise = Math.round(booking.totalAmount * 100);
    if (amountPaise < 100)
      return res.status(400).json({ message: 'Minimum payable amount is ₹1' });

    const order = await rzp.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `rcpt_${bookingId.slice(-8)}_${Date.now()}`,
      notes: {
        bookingId:   bookingId,
        bookingType: booking.type,
        userId:      req.user.id,
      },
    });

    res.json({
      success:   true,
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId:     process.env.RAZORPAY_KEY_ID,
      bookingId,
      prefill: {
        name:    req.user.name  || '',
        email:   req.user.email || '',
        contact: req.user.phone || '',
      },
    });
  } catch (err) {
    console.error('[PaymentController] createOrder error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/payment/verify ───────────────────────────────────────────────
// Verifies Razorpay HMAC signature and marks the booking as paid.
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId)
      return res.status(400).json({ message: 'Missing required payment verification fields' });

    // HMAC-SHA256: body = "orderId|paymentId"
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ message: 'Invalid payment signature — verification failed' });

    // Security: ensure booking belongs to this user
    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    // Mark booking as paid — idempotent
    const updated = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus:   'paid',
        paymentId:       razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
      { new: true }
    );

    res.json({ success: true, message: 'Payment verified and booking confirmed!', booking: updated });
  } catch (err) {
    console.error('[PaymentController] verifyPayment error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getKey, createOrder, verifyPayment };
