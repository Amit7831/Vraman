/**
 * middleware/authMiddleware.js
 *
 * Guards:
 *   protect          — any authenticated user
 *   adminOnly        — admin role only
 *   vendorOrAdmin    — vendor or admin
 *   vendorApproved   — approved vendor or admin
 *   vendorNotFlight  — vendor cannot create/modify flight-type services
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required' });
};

const vendorOrAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'vendor') return next();
  res.status(403).json({ message: 'Vendor or admin access required' });
};

const vendorApproved = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  if (req.user?.role === 'vendor' && req.user?.vendorInfo?.isApproved) return next();
  if (req.user?.role === 'vendor' && !req.user?.vendorInfo?.isApproved) {
    return res.status(403).json({ message: 'Your vendor account is pending admin approval.' });
  }
  res.status(403).json({ message: 'Vendor access required' });
};

/**
 * vendorNotFlight — blocks vendors from creating/modifying flights.
 * Checks req.body.type OR a :type route param.
 * Must be used AFTER protect + vendorApproved.
 * Admins always pass through.
 */
const vendorNotFlight = (req, res, next) => {
  if (req.user?.role === 'admin') return next(); // admins can do anything

  // Check body field OR route param
  const serviceType = (req.body.type || req.params.type || '').toLowerCase();
  if (serviceType === 'flight') {
    return res.status(403).json({
      message: 'Vendors are not permitted to manage flight services.',
      code:    'VENDOR_FLIGHT_RESTRICTED',
    });
  }
  next();
};

module.exports = { protect, adminOnly, vendorOrAdmin, vendorApproved, vendorNotFlight };
