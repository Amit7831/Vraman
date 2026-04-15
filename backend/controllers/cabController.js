const Cab = require('../models/Cab');
const { safeRegex } = require('../utils/helpers');

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

const createCab = async (req, res) => {
  try {
    const data = { ...req.body };
    const newImgs = extractImages(req);
    if (newImgs.length) { data.image = newImgs[0]; data.images = newImgs; }
    const cab = await Cab.create(data);
    res.status(201).json({ status: true, message: 'Cab created', cab });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const getCabs = async (req, res) => {
  try {
    const { location, type, fuelType, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const filter = { status: 'available', isActive: true };
    if (location) filter.location = safeRegex(location);
    if (type && type !== 'all') filter.type = type;
    if (fuelType && fuelType !== 'all') filter.fuelType = fuelType;
    if (minPrice) filter.pricePerDay = { ...filter.pricePerDay, $gte: Number(minPrice) };
    if (maxPrice) filter.pricePerDay = { ...filter.pricePerDay, $lte: Number(maxPrice) };
    const sortObj = sort === 'price-asc' ? { pricePerDay: 1 } : sort === 'price-desc' ? { pricePerDay: -1 } : sort === 'rating' ? { rating: -1 } : { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [cabs, total] = await Promise.all([
      Cab.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Cab.countDocuments(filter),
    ]);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ status: true, cabs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const getCabById = async (req, res) => {
  try {
    const cab = await Cab.findById(req.params.id);
    if (!cab) return res.status(404).json({ status: false, message: 'Cab not found' });
    res.json({ status: true, cab });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const updateCab = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data['existingImages[]'];
    const existing = extractExisting(req);
    const newImgs  = extractImages(req);
    const all      = [...existing, ...newImgs];
    if (all.length) { data.image = all[0]; data.images = all; }
    const cab = await Cab.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!cab) return res.status(404).json({ status: false, message: 'Cab not found' });
    res.json({ status: true, message: 'Cab updated', cab });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const deleteCab = async (req, res) => {
  try {
    const cab = await Cab.findByIdAndDelete(req.params.id);
    if (!cab) return res.status(404).json({ status: false, message: 'Cab not found' });
    res.json({ status: true, message: 'Cab deleted' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = { createCab, getCabs, getCabById, updateCab, deleteCab };
