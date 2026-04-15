/**
 * controllers/serviceController.js
 *
 * BUG FIX: AddService / UpdateService now read files from multer (req.files / req.file)
 * and merge existingImages[] sent from frontend during edit.
 */
const Service = require('../models/Service');

// Helper: extract uploaded image URLs from req
function extractImages(req) {
  const newImages = [];
  if (req.files?.images?.length) {
    newImages.push(...req.files.images.map(f => f.path));
  } else if (req.files?.image?.length) {
    newImages.push(...req.files.image.map(f => f.path));
  } else if (Array.isArray(req.files) && req.files.length) {
    newImages.push(...req.files.map(f => f.path));
  } else if (req.file) {
    newImages.push(req.file.path);
  }
  return newImages;
}

function extractExisting(req) {
  const raw = req.body['existingImages[]'];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

const AddService = async (req, res) => {
  try {
    const data = { ...req.body };
    // Remove form-data keys we handle manually
    delete data['existingImages[]'];

    const newImages  = extractImages(req);
    const allImages  = newImages;

    // First image becomes the primary 'image' field for backward compat
    if (allImages.length > 0) {
      data.image  = allImages[0];
      data.images = allImages;
    }

    const service = await Service.create(data);
    return res.status(201).json({ message: 'Service created successfully', status: true, service });
  } catch (err) {
    return res.status(500).json({ message: err.message, status: false });
  }
};

const GetService = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort, availableOnly, limit, page = 1 } = req.query;
    const filter = { isActive: true };
    const expr   = [];

    if (availableOnly === undefined || availableOnly === 'true')
      expr.push({ $gt: [{ $toDouble: '$availableBookingSeat' }, 0] });

    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { packageName:   { $regex: search, $options: 'i' } },
        { place:         { $regex: search, $options: 'i' } },
        { accommodation: { $regex: search, $options: 'i' } },
        { transport:     { $regex: search, $options: 'i' } },
      ];
    }
    if (minPrice) expr.push({ $gte: [{ $toDouble: '$pricePerPerson' }, Number(minPrice)] });
    if (maxPrice) expr.push({ $lte: [{ $toDouble: '$pricePerPerson' }, Number(maxPrice)] });
    if (expr.length) filter.$expr = { $and: expr };

    let sortObj = { createdAt: -1 };
    if (sort === 'price-asc')  sortObj = { pricePerPerson: 1 };
    if (sort === 'price-desc') sortObj = { pricePerPerson: -1 };
    if (sort === 'rating')     sortObj = { rating: -1 };

    const pageNum  = Number(page);
    const limitNum = Number(limit || 12);
    const skip     = (pageNum - 1) * limitNum;

    const [service, total] = await Promise.all([
      Service.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Service.countDocuments(filter),
    ]);
    return res.json({ message: 'Services fetched', service, status: true, count: service.length, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    return res.status(500).json({ message: err.message, status: false });
  }
};

const GetSuggest = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isActive: true };
    filter.$expr = { $gt: [{ $toDouble: '$availableBookingSeat' }, 0] };
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { packageName: { $regex: search, $options: 'i' } },
        { place:       { $regex: search, $options: 'i' } },
      ];
    }
    const items = await Service.find(filter).sort({ createdAt: -1 }).limit(8);
    return res.json({
      status: true,
      suggestions: items.map(s => ({
        _id: s._id, packageName: s.packageName, place: s.place,
        image: s.image, category: s.category,
      })),
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const GetSingleService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ status: false, message: 'Service not found' });
    return res.json({ status: true, service });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const UpdateService = async (req, res) => {
  try {
    const data = { ...req.body };
    delete data['existingImages[]'];

    const existing   = extractExisting(req);
    const newImages  = extractImages(req);
    const allImages  = [...existing, ...newImages];

    if (allImages.length > 0) {
      data.image  = allImages[0];
      data.images = allImages;
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Service not found', status: false });
    return res.json({ message: 'Updated successfully', status: true, service: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message, status: false });
  }
};

const DeleteService = async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Service not found', status: false });
    return res.json({ message: 'Deleted successfully', status: true });
  } catch (err) {
    return res.status(500).json({ message: err.message, status: false });
  }
};

module.exports = { AddService, GetService, GetSuggest, GetSingleService, UpdateService, DeleteService };
