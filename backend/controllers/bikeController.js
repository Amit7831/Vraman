const Bike = require('../models/Bike');
const { safeRegex } = require('../utils/helpers');

// helper: extract uploaded image URLs
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

const createBike = async (req, res) => {
  try {
    const data = { ...req.body };
    const newImgs = extractImages(req);
    if (newImgs.length) {
      data.image  = newImgs[0];
      data.images = newImgs;
    }
    const bike = await Bike.create(data);
    res.status(201).json({ status: true, message: 'Bike created', bike });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const getBikes = async (req, res) => {
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
    const [bikes, total] = await Promise.all([
      Bike.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Bike.countDocuments(filter),
    ]);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ status: true, bikes, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const getBikeById = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ status: false, message: 'Bike not found' });
    res.json({ status: true, bike });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const updateBike = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data['existingImages[]'];
    const existing = extractExisting(req);
    const newImgs  = extractImages(req);
    const all      = [...existing, ...newImgs];
    if (all.length) { data.image = all[0]; data.images = all; }
    const bike = await Bike.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!bike) return res.status(404).json({ status: false, message: 'Bike not found' });
    res.json({ status: true, message: 'Bike updated', bike });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const deleteBike = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndDelete(req.params.id);
    if (!bike) return res.status(404).json({ status: false, message: 'Bike not found' });
    res.json({ status: true, message: 'Bike deleted' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = { createBike, getBikes, getBikeById, updateBike, deleteBike };
