const Booking = require('../models/Booking');
const Hotel   = require('../models/Hotel');
const Bus     = require('../models/Bus');
const Cab     = require('../models/Cab');
const Bike    = require('../models/Bike');
const Service = require('../models/Service');

const MODEL_MAP      = { hotel: Hotel, bus: Bus, cab: Cab, bike: Bike, service: Service };
const MODEL_NAME_MAP = { hotel: 'Hotel', bus: 'Bus', cab: 'Cab', bike: 'Bike', service: 'Service' };

// ── helpers ────────────────────────────────────────────────────────────────
const calcNights = (start, end) =>
  start && end ? Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000)) : 1;

// FIX: Atomic availability decrement — prevents race-condition double-booking.
// Uses findOneAndUpdate with a $gte guard so the check + decrement are a single DB op.
const atomicDecrement = async (type, itemId, qty) => {
  switch (type) {
    case 'hotel': {
      const item = await Hotel.findOneAndUpdate(
        { _id: itemId, availableRooms: { $gte: qty } },
        { $inc: { availableRooms: -qty } },
        { new: true }
      );
      if (!item) throw new Error('Not enough rooms available');
      return item;
    }
    case 'bus': {
      const item = await Bus.findOneAndUpdate(
        { _id: itemId, availableSeats: { $gte: qty } },
        { $inc: { availableSeats: -qty } },
        { new: true }
      );
      if (!item) throw new Error('Not enough seats available');
      return item;
    }
    case 'cab': {
      const item = await Cab.findOneAndUpdate(
        { _id: itemId, status: 'available' },
        { $set: { status: 'booked' } },
        { new: true }
      );
      if (!item) throw new Error('Cab not available');
      return item;
    }
    case 'bike': {
      const item = await Bike.findOneAndUpdate(
        { _id: itemId, status: 'available' },
        { $set: { status: 'booked' } },
        { new: true }
      );
      if (!item) throw new Error('Bike not available');
      return item;
    }
    case 'service': {
      const item = await Service.findOneAndUpdate(
        { _id: itemId, availableBookingSeat: { $gte: qty } },
        { $inc: { availableBookingSeat: -qty } },
        { new: true }
      );
      if (!item) throw new Error('Not enough seats available for this package');
      return item;
    }
    default:
      throw new Error('Invalid booking type');
  }
};

// ── createBooking ──────────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const {
      type, itemId,
      startDate, endDate,
      guests = 1, seatsBooked = 1,
      passengerName, passengerPhone,
      flightDetails, notes,
    } = req.body;

    if (!type || !itemId)
      return res.status(400).json({ message: 'type and itemId are required' });

    // FIX: validate numeric fields
    const guestsN = Math.max(1, parseInt(guests, 10) || 1);
    const seatsN  = Math.max(1, parseInt(seatsBooked, 10) || 1);

    // ── Flight booking (external Amadeus data, no local inventory) ──
    if (type === 'flight') {
      if (!flightDetails)
        return res.status(400).json({ message: 'flightDetails required for flight booking' });
      const totalAmount = Number(flightDetails.price || 0) * seatsN;
      const booking = await Booking.create({
        user: req.user.id, type, itemId, itemModel: 'Service',
        flightDetails, seatsBooked: seatsN, totalAmount,
        startDate, endDate, passengerName, passengerPhone, notes,
        status: 'confirmed', paymentStatus: 'pending',
      });
      return res.status(201).json({ success: true, message: 'Flight booked!', booking });
    }

    const Model = MODEL_MAP[type];
    if (!Model) return res.status(400).json({ message: 'Invalid booking type' });

    // FIX: check item exists before atomic decrement
    const exists = await Model.findById(itemId).lean();
    if (!exists) return res.status(404).json({ message: `${type} not found` });

    // ── Atomic availability decrement ──────────────────────────────
    let qty = 1;
    if (type === 'hotel')   qty = guestsN;
    if (type === 'bus')     qty = seatsN;
    if (type === 'service') qty = seatsN;

    let item;
    try {
      item = await atomicDecrement(type, itemId, qty);
    } catch (availErr) {
      return res.status(400).json({ message: availErr.message });
    }

    // ── Calculate total ────────────────────────────────────────────
    let totalAmount = 0;
    if (type === 'hotel')   totalAmount = item.pricePerNight * calcNights(startDate, endDate) * guestsN;
    if (type === 'bus')     totalAmount = item.pricePerSeat  * seatsN;
    if (type === 'cab')     totalAmount = item.pricePerDay   * calcNights(startDate, endDate);
    if (type === 'bike')    totalAmount = item.pricePerDay   * calcNights(startDate, endDate);
    if (type === 'service') totalAmount = (item.pricePerPerson || 0) * seatsN;

    const booking = await Booking.create({
      user: req.user.id, type, itemId, itemModel: MODEL_NAME_MAP[type],
      startDate, endDate,
      guests: guestsN, seatsBooked: seatsN,
      totalAmount, passengerName, passengerPhone, notes,
      status: 'confirmed', paymentStatus: 'pending',
    });

    res.status(201).json({ success: true, message: `${type} booked successfully!`, booking });
  } catch (err) {
    console.error('createBooking:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── getMyBookings ──────────────────────────────────────────────────────────
// FIX: removed N+1 loop — uses dynamic populate via refPath defined on Booking schema
const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find({ user: req.user.id })
        .populate({ path: 'itemId', select: 'name busName packageName city location from to image images' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments({ user: req.user.id }),
    ]);

    // Normalise: expose populated doc as `item` for frontend compatibility
    const result = bookings.map(b => ({ ...b, item: b.itemId }));

    res.json({ success: true, count: result.length, total, page: Number(page), bookings: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── getAllBookings (admin) ──────────────────────────────────────────────────
// FIX: paginated + uses populate, no N+1
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 30, type, status } = req.query;
    const filter = {};
    if (type)   filter.type   = type;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate({ path: 'itemId', select: 'name busName packageName city location from to' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const result = bookings.map(b => ({ ...b, item: b.itemId }));
    res.json({ success: true, count: result.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)), bookings: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── cancelBooking ──────────────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    if (booking.status === 'cancelled')
      return res.status(400).json({ message: 'Already cancelled' });

    booking.status = 'cancelled';
    await booking.save();

    // Restore availability atomically
    const { type, itemId, guests, seatsBooked } = booking;
    if (type === 'hotel')
      await Hotel.findByIdAndUpdate(itemId, { $inc: { availableRooms: Number(guests || 1) } });
    else if (type === 'bus')
      await Bus.findByIdAndUpdate(itemId, { $inc: { availableSeats: Number(seatsBooked || 1) } });
    else if (type === 'cab')
      await Cab.findByIdAndUpdate(itemId, { $set: { status: 'available' } });
    else if (type === 'bike')
      await Bike.findByIdAndUpdate(itemId, { $set: { status: 'available' } });
    else if (type === 'service')
      await Service.findByIdAndUpdate(itemId, { $inc: { availableBookingSeat: Number(seatsBooked || 1) } });

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── deleteBooking (admin) ──────────────────────────────────────────────────
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createBooking, getMyBookings, getAllBookings, cancelBooking, deleteBooking };

// ── Auto-send OTP after booking creation ────────────────────────────────────
// Called internally from createBooking after a successful booking is created.
// Non-blocking — errors are logged but don't fail the booking.
async function autoSendOTP(booking, userEmail, userName) {
  try {
    const OTP     = require('../models/OTP');
    const { sendOTPEmail } = require('../utils/emailService');

    const OTP_EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
    const plainOTP  = OTP.generateOTP();
    const otpHash   = OTP.hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

    await OTP.findOneAndUpdate(
      { bookingId: booking._id },
      { otpHash, expiresAt, isVerified: false, attempts: 0, lastSentAt: new Date() },
      { upsert: true, new: true }
    );
    await Booking.findByIdAndUpdate(booking._id, { otpSent: true });

    await sendOTPEmail({
      to:              userEmail,
      name:            userName,
      otp:             plainOTP,
      bookingId:       booking._id,
      serviceName:     booking._resolvedName || booking.type,
      serviceType:     booking.type,
      expiresInMinutes: OTP_EXPIRY_MIN,
    });

    console.log(`✅ Auto-OTP sent for booking ${booking._id}`);
  } catch (err) {
    console.error('Auto-OTP send failed (non-fatal):', err.message);
  }
}
