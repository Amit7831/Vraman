/**
 * controllers/vendorController.js — v2 (Multi-Service Vendor)
 *
 * Vendors can now manage: Hotel, Bike, Cab, Bus, Service (packages)
 * Flights remain admin-only.
 */
const User    = require('../models/User');
const Hotel   = require('../models/Hotel');
const Bus     = require('../models/Bus');
const Cab     = require('../models/Cab');
const Bike    = require('../models/Bike');
const Service = require('../models/Service');
const OTP     = require('../models/OTP');
const bcrypt  = require('bcrypt');
const { generateToken } = require('../utils/token');

const MODEL_MAP = { hotel: Hotel, bus: Bus, cab: Cab, bike: Bike, service: Service };

function extractImages(req) {
  const imgs = [];
  if (req.files?.images?.length) imgs.push(...req.files.images.map(f => f.path));
  else if (req.files?.image?.length) imgs.push(...req.files.image.map(f => f.path));
  else if (Array.isArray(req.files) && req.files.length) imgs.push(...req.files.map(f => f.path));
  else if (req.file) imgs.push(req.file.path);
  return imgs;
}

function extractExisting(req) {
  const raw = req.body['existingImages[]'];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

const registerVendor = async (req, res) => {
  try {
    const { name, email, password, businessName, phone, address } = req.body;
    if (!name || !email || !password || !businessName)
      return res.status(400).json({ message: 'name, email, password and businessName are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const vendor = await User.create({
      name, email: email.toLowerCase(), password: hashed,
      role: 'vendor',
      vendorInfo: { businessName, phone, address, isApproved: false },
    });
    res.status(201).json({
      message: 'Vendor account created. Please wait for admin approval.',
      vendor: { _id: vendor._id, name: vendor.name, email: vendor.email, role: vendor.role, vendorInfo: vendor.vendorInfo, token: generateToken(vendor._id, vendor.role) },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getVendorProfile = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id).select('-password');
    res.json({ status: true, vendor });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMyServices = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [services, total] = await Promise.all([
      Service.find({ vendor: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Service.countDocuments({ vendor: req.user.id }),
    ]);
    res.json({ status: true, services, count: services.length, total });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/vendor/my-listings — all types
const getMyListings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const [hotels, buses, cabs, bikes, services] = await Promise.all([
      Hotel.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean(),
      Bus.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean(),
      Cab.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean(),
      Bike.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean(),
      Service.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({
      status: true,
      listings: {
        hotel:   hotels.map(h => ({ ...h, _type: 'hotel' })),
        bus:     buses.map(b => ({ ...b, _type: 'bus' })),
        cab:     cabs.map(c => ({ ...c, _type: 'cab' })),
        bike:    bikes.map(b => ({ ...b, _type: 'bike' })),
        service: services.map(s => ({ ...s, _type: 'service' })),
      },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/vendor/listings
const addVendorListing = async (req, res) => {
  try {
    const { listingType, ...body } = req.body;
    const type = (listingType || '').toLowerCase();
    if (!MODEL_MAP[type])
      return res.status(400).json({ message: `Invalid listingType. Allowed: ${Object.keys(MODEL_MAP).join(', ')}` });

    const data = { ...body, vendor: req.user.id, approvalStatus: 'pending', isActive: false };
    delete data['existingImages[]'];

    const newImages = extractImages(req);
    if (newImages.length > 0) { data.image = newImages[0]; data.images = newImages; }

    const item = await MODEL_MAP[type].create(data);
    res.status(201).json({ status: true, message: `${type} submitted for admin approval.`, item, listingType: type });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/vendor/listings/:type/:id
const updateVendorListing = async (req, res) => {
  try {
    const type = (req.params.type || '').toLowerCase();
    if (!MODEL_MAP[type]) return res.status(400).json({ message: 'Invalid type' });
    const item = await MODEL_MAP[type].findOne({ _id: req.params.id, vendor: req.user.id });
    if (!item) return res.status(404).json({ message: 'Listing not found or not yours' });

    const updates = { ...req.body, approvalStatus: 'pending', isActive: false };
    delete updates['existingImages[]']; delete updates.listingType;

    const existing = extractExisting(req);
    const newImages = extractImages(req);
    const all = [...existing, ...newImages];
    if (all.length > 0) { updates.image = all[0]; updates.images = all; }

    const updated = await MODEL_MAP[type].findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ status: true, message: 'Listing updated and re-submitted for approval.', item: updated, listingType: type });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/vendor/listings/:type/:id
const deleteVendorListing = async (req, res) => {
  try {
    const type = (req.params.type || '').toLowerCase();
    if (!MODEL_MAP[type]) return res.status(400).json({ message: 'Invalid type' });
    const item = await MODEL_MAP[type].findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
    if (!item) return res.status(404).json({ message: 'Listing not found or not yours' });
    res.json({ status: true, message: 'Listing deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Legacy routes (Service only)
const addVendorService = async (req, res) => { req.body.listingType = 'service'; return addVendorListing(req, res); };
const updateVendorService = async (req, res) => { req.params.type = 'service'; return updateVendorListing(req, res); };
const deleteVendorService = async (req, res) => { req.params.type = 'service'; return deleteVendorListing(req, res); };

const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 30, approved } = req.query;
    const filter = { role: 'vendor' };
    if (approved === 'true')  filter['vendorInfo.isApproved'] = true;
    if (approved === 'false') filter['vendorInfo.isApproved'] = false;
    const skip = (Number(page) - 1) * Number(limit);
    const [vendors, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ status: true, vendors, count: vendors.length, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const approveVendor = async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    vendor.vendorInfo.isApproved = true;
    vendor.vendorInfo.approvedAt = new Date();
    vendor.vendorInfo.rejectedAt = undefined;
    vendor.vendorInfo.rejectedReason = undefined;
    await vendor.save();
    res.json({ status: true, message: `Vendor "${vendor.vendorInfo.businessName}" approved.`, vendor });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const rejectVendor = async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    vendor.vendorInfo.isApproved = false;
    vendor.vendorInfo.rejectedAt = new Date();
    vendor.vendorInfo.rejectedReason = req.body.reason || 'Not specified';
    await vendor.save();
    res.json({ status: true, message: 'Vendor rejected.', vendor });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getPendingServices = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [services, total] = await Promise.all([
      Service.find({ approvalStatus: 'pending' }).populate('vendor', 'name email vendorInfo').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Service.countDocuments({ approvalStatus: 'pending' }),
    ]);
    res.json({ status: true, services, count: services.length, total });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/vendor/pending-listings — all pending across ALL models
const getPendingListings = async (req, res) => {
  try {
    const [hotels, buses, cabs, bikes, services] = await Promise.all([
      Hotel.find({ approvalStatus: 'pending' }).populate('vendor', 'name email vendorInfo').sort({ createdAt: -1 }).lean(),
      Bus.find({ approvalStatus: 'pending' }).populate('vendor', 'name email vendorInfo').sort({ createdAt: -1 }).lean(),
      Cab.find({ approvalStatus: 'pending' }).populate('vendor', 'name email vendorInfo').sort({ createdAt: -1 }).lean(),
      Bike.find({ approvalStatus: 'pending' }).populate('vendor', 'name email vendorInfo').sort({ createdAt: -1 }).lean(),
      Service.find({ approvalStatus: 'pending' }).populate('vendor', 'name email vendorInfo').sort({ createdAt: -1 }).lean(),
    ]);
    const all = [
      ...hotels.map(h => ({ ...h, _type: 'hotel' })),
      ...buses.map(b => ({ ...b, _type: 'bus' })),
      ...cabs.map(c => ({ ...c, _type: 'cab' })),
      ...bikes.map(b => ({ ...b, _type: 'bike' })),
      ...services.map(s => ({ ...s, _type: 'service' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ status: true, listings: all, total: all.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: approve/reject any listing type
const approveListingByType = async (req, res) => {
  try {
    const type = (req.params.type || '').toLowerCase();
    if (!MODEL_MAP[type]) return res.status(400).json({ message: 'Invalid type' });
    const item = await MODEL_MAP[type].findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'approved', isActive: true, approvedAt: new Date(), approvalNote: '' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Listing not found' });
    res.json({ status: true, message: 'Listing approved and now live.', item, listingType: type });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const rejectListingByType = async (req, res) => {
  try {
    const type = (req.params.type || '').toLowerCase();
    if (!MODEL_MAP[type]) return res.status(400).json({ message: 'Invalid type' });
    const item = await MODEL_MAP[type].findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected', isActive: false, approvalNote: req.body.note || 'Rejected by admin' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Listing not found' });
    res.json({ status: true, message: 'Listing rejected.', item, listingType: type });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Legacy service approve/reject
const approveService = async (req, res) => { req.params.type = 'service'; return approveListingByType(req, res); };
const rejectService  = async (req, res) => { req.params.type = 'service'; return rejectListingByType(req, res); };

// Admin: configure OTP max attempts globally
const updateOTPMaxAttempts = async (req, res) => {
  try {
    const maxAttempts = Number(req.body.maxAttempts);
    if (!maxAttempts || maxAttempts < 1 || maxAttempts > 10)
      return res.status(400).json({ message: 'maxAttempts must be between 1 and 10' });
    const result = await OTP.updateMany({ isVerified: false }, { $set: { maxAttempts } });
    res.json({ status: true, message: `Updated to ${maxAttempts} attempts for ${result.modifiedCount} active OTPs.`, maxAttempts });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  registerVendor, getVendorProfile,
  getMyServices, getMyListings,
  addVendorService, updateVendorService, deleteVendorService,
  addVendorListing, updateVendorListing, deleteVendorListing,
  getAllVendors, approveVendor, rejectVendor,
  getPendingServices, getPendingListings,
  approveService, rejectService,
  approveListingByType, rejectListingByType,
  updateOTPMaxAttempts,
};
