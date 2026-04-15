const Bus         = require('../models/Bus');
const SearchIndex = require('../models/SearchIndex');
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

const createBus = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.amenities && typeof data.amenities === 'string')
      data.amenities = data.amenities.split(',').map(s => s.trim()).filter(Boolean);
    if (data['amenities[]']) {
      data.amenities = Array.isArray(data['amenities[]']) ? data['amenities[]'] : [data['amenities[]']];
      delete data['amenities[]'];
    }
    const newImgs = extractImages(req);
    if (newImgs.length) { data.image = newImgs[0]; data.images = newImgs; }
    const bus = await Bus.create(data);
    await SearchIndex.create({
      term: `${bus.from} to ${bus.to}`, type: 'bus_route',
      refId: bus._id, refModel: 'Bus',
      metadata: { from: bus.from, to: bus.to, price: bus.pricePerSeat },
    });
    res.status(201).json({ status: true, message: 'Bus created', bus });
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
};

const getBuses = async (req, res) => {
  try {
    const { from, to, busType, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true, availableSeats: { $gt: 0 } };
    if (from)    filter.from = safeRegex(from);
    if (to)      filter.to   = safeRegex(to);
    if (busType && busType !== 'all') filter.busType = busType;
    if (minPrice) filter.pricePerSeat = { ...filter.pricePerSeat, $gte: Number(minPrice) };
    if (maxPrice) filter.pricePerSeat = { ...filter.pricePerSeat, $lte: Number(maxPrice) };
    const sortObj = sort === 'price-asc' ? { pricePerSeat: 1 } : sort === 'price-desc' ? { pricePerSeat: -1 } : sort === 'rating' ? { rating: -1 } : { departureTime: 1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [buses, total] = await Promise.all([
      Bus.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Bus.countDocuments(filter),
    ]);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ status: true, buses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
};

const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ status: false, message: 'Bus not found' });
    res.json({ status: true, bus });
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
};

const updateBus = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data['existingImages[]'];
    if (data.amenities && typeof data.amenities === 'string')
      data.amenities = data.amenities.split(',').map(s => s.trim()).filter(Boolean);
    if (data['amenities[]']) {
      data.amenities = Array.isArray(data['amenities[]']) ? data['amenities[]'] : [data['amenities[]']];
      delete data['amenities[]'];
    }
    const existing = extractExisting(req);
    const newImgs  = extractImages(req);
    const all      = [...existing, ...newImgs];
    if (all.length) { data.image = all[0]; data.images = all; }
    const bus = await Bus.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!bus) return res.status(404).json({ status: false, message: 'Bus not found' });
    res.json({ status: true, message: 'Bus updated', bus });
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
};

const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ status: false, message: 'Bus not found' });
    await SearchIndex.deleteMany({ refId: req.params.id });
    res.json({ status: true, message: 'Bus deleted' });
  } catch (err) { res.status(500).json({ status: false, message: err.message }); }
};

module.exports = { createBus, getBuses, getBusById, updateBus, deleteBus };
