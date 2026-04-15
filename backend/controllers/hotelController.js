/**
 * controllers/hotelController.js
 *
 * BUG FIX: updateHotel now merges existingImages[] (sent from frontend during edit)
 * with newly uploaded files, so existing ImageKit URLs are not lost on update.
 */
const Hotel       = require('../models/Hotel');
const SearchIndex = require('../models/SearchIndex');
const { safeRegex } = require('../utils/helpers');

const createHotel = async (req, res) => {
  try {
    const data = { ...req.body };

    // Handle amenities sent as amenities[] array from FormData
    if (req.body['amenities[]']) {
      data.amenities = Array.isArray(req.body['amenities[]'])
        ? req.body['amenities[]']
        : [req.body['amenities[]']];
      delete data['amenities[]'];
    }

    // New uploaded files
    if (req.files?.images?.length) {
      data.images = req.files.images.map(f => f.path);
    } else if (req.files?.length) {
      data.images = req.files.map(f => f.path);
    } else if (req.file) {
      data.images = [req.file.path];
    }

    const hotel = await Hotel.create(data);
    await SearchIndex.create({ term: hotel.city,  type: 'city',  refId: hotel._id, refModel: 'Hotel', metadata: { name: hotel.name } });
    await SearchIndex.create({ term: hotel.name,  type: 'hotel', refId: hotel._id, refModel: 'Hotel', metadata: { city: hotel.city, price: hotel.pricePerNight } });
    res.status(201).json({ status: true, message: 'Hotel created', hotel });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const getHotels = async (req, res) => {
  try {
    const { city, category, minPrice, maxPrice, sort, page = 1, limit = 12, availableOnly } = req.query;
    const filter = { isActive: true };
    if (city) filter.city = safeRegex(city);
    if (category && category !== 'all') filter.category = category;
    if (availableOnly !== 'false') filter.availableRooms = { $gt: 0 };
    const priceFilter = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    if (Object.keys(priceFilter).length) filter.pricePerNight = priceFilter;
    const sortObj = sort === 'price-asc' ? { pricePerNight: 1 } : sort === 'price-desc' ? { pricePerNight: -1 } : sort === 'rating' ? { rating: -1 } : { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [hotels, total] = await Promise.all([
      Hotel.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Hotel.countDocuments(filter),
    ]);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ status: true, hotels, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ status: false, message: 'Hotel not found' });
    res.json({ status: true, hotel });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const updateHotel = async (req, res) => {
  try {
    const data = { ...req.body };

    // Handle amenities[] from FormData
    if (req.body['amenities[]']) {
      data.amenities = Array.isArray(req.body['amenities[]'])
        ? req.body['amenities[]']
        : [req.body['amenities[]']];
      delete data['amenities[]'];
    }

    // FIX: merge existing URLs + newly uploaded files
    const existingImages = req.body['existingImages[]']
      ? (Array.isArray(req.body['existingImages[]']) ? req.body['existingImages[]'] : [req.body['existingImages[]']])
      : [];

    let newImages = [];
    if (req.files?.images?.length) {
      newImages = req.files.images.map(f => f.path);
    } else if (req.files?.length) {
      newImages = req.files.map(f => f.path);
    } else if (req.file) {
      newImages = [req.file.path];
    }

    // Only update images field if something was sent
    if (existingImages.length || newImages.length) {
      data.images = [...existingImages, ...newImages];
    }

    delete data['existingImages[]'];

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!hotel) return res.status(404).json({ status: false, message: 'Hotel not found' });
    res.json({ status: true, message: 'Hotel updated', hotel });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ status: false, message: 'Hotel not found' });
    await SearchIndex.deleteMany({ refId: req.params.id });
    res.json({ status: true, message: 'Hotel deleted' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = { createHotel, getHotels, getHotelById, updateHotel, deleteHotel };
