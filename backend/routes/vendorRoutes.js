const express = require('express');
const router  = express.Router();
const {
  registerVendor, getVendorProfile,
  getMyServices, getMyListings,
  addVendorService, updateVendorService, deleteVendorService,
  addVendorListing, updateVendorListing, deleteVendorListing,
  getAllVendors, approveVendor, rejectVendor,
  getPendingServices, getPendingListings,
  approveService, rejectService,
  approveListingByType, rejectListingByType,
  updateOTPMaxAttempts,
} = require('../controllers/vendorController');

const { protect, adminOnly, vendorOrAdmin, vendorApproved, vendorNotFlight } = require('../middleware/authMiddleware');
const { uploadAny } = require('../middleware/uploadMiddleware');

// ── Public ────────────────────────────────────────────────────
router.post('/register', registerVendor);

// ── Vendor ────────────────────────────────────────────────────
router.get('/me',                   protect, vendorOrAdmin, getVendorProfile);
router.get('/my-services',          protect, vendorApproved, getMyServices);
router.get('/my-listings',          protect, vendorApproved, getMyListings);

// Multi-type listing CRUD (hotel/bus/cab/bike/service — NO flight)
router.post('/listings',            protect, vendorApproved, vendorNotFlight, uploadAny, addVendorListing);
router.put('/listings/:type/:id',   protect, vendorApproved, vendorNotFlight, uploadAny, updateVendorListing);
router.delete('/listings/:type/:id',protect, vendorApproved, deleteVendorListing);

// Legacy service-only routes (keep backward compat)
router.post('/services',            protect, vendorApproved, vendorNotFlight, uploadAny, addVendorService);
router.put('/services/:id',         protect, vendorApproved, vendorNotFlight, uploadAny, updateVendorService);
router.delete('/services/:id',      protect, vendorApproved, deleteVendorService);

// ── Admin ─────────────────────────────────────────────────────
router.get('/all',                      protect, adminOnly, getAllVendors);
router.put('/approve/:id',              protect, adminOnly, approveVendor);
router.put('/reject/:id',               protect, adminOnly, rejectVendor);

// Pending listings (all types combined)
router.get('/pending-listings',         protect, adminOnly, getPendingListings);
// Legacy (service only)
router.get('/pending-services',         protect, adminOnly, getPendingServices);

// Approve/reject by type
router.put('/listings/:type/:id/approve', protect, adminOnly, approveListingByType);
router.put('/listings/:type/:id/reject',  protect, adminOnly, rejectListingByType);
// Legacy service approve/reject
router.put('/services/:id/approve',    protect, adminOnly, approveService);
router.put('/services/:id/reject',     protect, adminOnly, rejectService);

// OTP max attempts config
router.put('/otp-config',              protect, adminOnly, updateOTPMaxAttempts);

module.exports = router;
