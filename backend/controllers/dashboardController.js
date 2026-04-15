const User    = require('../models/User');
const Hotel   = require('../models/Hotel');
const Bus     = require('../models/Bus');
const Cab     = require('../models/Cab');
const Bike    = require('../models/Bike');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

const getDashboardStats = async (req, res) => {
  try {
    const [users, hotels, buses, cabs, bikes, services, bookings, revenue] = await Promise.all([
      User.countDocuments(),
      Hotel.countDocuments({ isActive: true }),
      Bus.countDocuments({ isActive: true }),
      Cab.countDocuments({ isActive: true }),
      Bike.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // FIX: paginated recent bookings with populate (no N+1 loop)
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate({ path: 'itemId', select: 'name busName packageName city location from to' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const result = recentBookings.map(b => ({ ...b, item: b.itemId }));

    res.json({
      status: true,
      stats: {
        users, hotels, buses, cabs, bikes, services,
        totalBookings: bookings,
        totalRevenue: revenue[0]?.total || 0,
      },
      recentBookings: result,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = { getDashboardStats };
