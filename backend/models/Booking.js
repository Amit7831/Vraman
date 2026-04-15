const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['hotel','flight','bus','cab','bike','service'], required: true },
  itemId:    { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemModel' },
  itemModel: { type: String, required: true, enum: ['Hotel','Bus','Cab','Bike','Service'] },

  flightDetails: {
    flightId:     { type: String },
    airline:      { type: String },
    origin:       { type: String },
    destination:  { type: String },
    departureTime:{ type: String },
    arrivalTime:  { type: String },
    cabin:        { type: String },
    price:        { type: Number },
  },

  startDate:   { type: Date, default: Date.now },
  endDate:     { type: Date },
  guests:      { type: Number, default: 1 },
  seatsBooked: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },

  passengerName: { type: String },
  passengerPhone:{ type: String },

  // ── Status: added 'verified' for OTP-confirmed service usage ──
  status:        {
    type: String,
    enum: ['pending','confirmed','verified','cancelled','completed'],
    default: 'confirmed',
  },
  paymentStatus: { type: String, enum: ['pending','paid','refunded'], default: 'pending' },
  notes:           { type: String },

  razorpayOrderId: { type: String },
  paymentId:       { type: String },

  // ── OTP tracking ──────────────────────────────────────────────
  otpSent:         { type: Boolean, default: false },   // has OTP email been sent?
  verifiedAt:      { type: Date },                      // when OTP was verified
}, { timestamps: true });

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
