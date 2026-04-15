/**
 * controllers/searchController.js
 * SEC-04 FIX: all user-supplied strings are sanitized via escapeRegex() before
 * being passed to `new RegExp()`, eliminating the ReDoS attack surface.
 */
const Hotel       = require('../models/Hotel');
const Bus         = require('../models/Bus');
const Cab         = require('../models/Cab');
const Bike        = require('../models/Bike');
const Service     = require('../models/Service');
const SearchIndex = require('../models/SearchIndex');
const { safeRegex } = require('../utils/helpers'); // ← SEC-04 FIX

// ── GET /api/search/suggestions?q=&type= ──────────────────────────────────
const getSuggestions = async (req, res) => {
  try {
    const { q = '', type } = req.query;
    if (!q.trim()) return res.json({ status: true, suggestions: [] });

    const regex = safeRegex(q); // SEC-04: escaped
    const limit = 6;
    let suggestions = [];

    // SearchIndex for quick city/location suggestions
    const indexQuery = { term: { $regex: regex } };
    if (type && type !== 'all') indexQuery.type = type;
    const indexed = await SearchIndex.find(indexQuery).sort({ popularity: -1 }).limit(limit);
    suggestions.push(...indexed.map(i => ({
      _id: i._id, label: i.term, type: i.type,
      refId: i.refId, refModel: i.refModel, meta: i.metadata,
    })));

    if (suggestions.length < limit) {
      const remaining = limit - suggestions.length;

      if (!type || type === 'hotel') {
        const hotels = await Hotel.find({
          $or: [{ name: regex }, { city: regex }, { location: regex }], isActive: true,
        }).select('name city pricePerNight images category').limit(remaining);
        suggestions.push(...hotels.map(h => ({
          _id: h._id, label: `${h.name}, ${h.city}`, type: 'hotel',
          refId: h._id, refModel: 'Hotel',
          meta: { price: h.pricePerNight, image: h.images?.[0], category: h.category },
        })));
      }

      if (!type || type === 'bus') {
        const buses = await Bus.find({
          $or: [{ from: regex }, { to: regex }, { busName: regex }], isActive: true,
        }).select('busName from to pricePerSeat availableSeats').limit(remaining);
        suggestions.push(...buses.map(b => ({
          _id: b._id, label: `${b.from} → ${b.to}`, type: 'bus',
          refId: b._id, refModel: 'Bus',
          meta: { price: b.pricePerSeat, seats: b.availableSeats },
        })));
      }

      if (!type || type === 'cab') {
        const cabs = await Cab.find({
          $or: [{ name: regex }, { location: regex }, { brand: regex }],
          status: 'available', isActive: true,
        }).select('name brand location pricePerDay image type').limit(remaining);
        suggestions.push(...cabs.map(c => ({
          _id: c._id, label: `${c.brand} ${c.name} – ${c.location}`, type: 'cab',
          refId: c._id, refModel: 'Cab',
          meta: { price: c.pricePerDay, image: c.image, cabType: c.type },
        })));
      }

      if (!type || type === 'service') {
        const services = await Service.find({
          $or: [{ packageName: regex }, { place: regex }], isActive: true,
        }).select('packageName place pricePerPerson image category').limit(remaining);
        suggestions.push(...services.map(s => ({
          _id: s._id, label: `${s.packageName} – ${s.place}`, type: 'service',
          refId: s._id, refModel: 'Service',
          meta: { price: s.pricePerPerson, image: s.image, category: s.category },
        })));
      }
    }

    // Deduplicate by label
    const seen = new Set();
    suggestions = suggestions.filter(s => {
      if (seen.has(s.label)) return false;
      seen.add(s.label);
      return true;
    });

    res.json({ status: true, suggestions: suggestions.slice(0, limit) });
  } catch (err) {
    console.error('getSuggestions error:', err);
    res.status(500).json({ status: false, message: 'Search failed' });
  }
};

// ── GET /api/search?type=hotel&q=&city=&... ───────────────────────────────
const globalSearch = async (req, res) => {
  try {
    const {
      type = 'all', q = '', city, from, to,
      minPrice, maxPrice, sort, page = 1, limit = 12,
    } = req.query;

    const skip  = (Number(page) - 1) * Number(limit);
    // SEC-04 FIX: escape before regex construction
    const regex = q.trim() ? safeRegex(q) : null;

    let results = [], total = 0;

    if (type === 'hotel' || type === 'all') {
      const filter = { isActive: true };
      if (regex) filter.$or = [{ name: regex }, { city: regex }, { location: regex }, { description: regex }];
      if (city)  filter.city = safeRegex(city); // SEC-04 FIX
      if (minPrice) filter.pricePerNight = { ...filter.pricePerNight, $gte: Number(minPrice) };
      if (maxPrice) filter.pricePerNight = { ...filter.pricePerNight, $lte: Number(maxPrice) };
      const sortObj = sort === 'price-asc' ? { pricePerNight: 1 } : sort === 'price-desc' ? { pricePerNight: -1 } : sort === 'rating' ? { rating: -1 } : { createdAt: -1 };
      const hotels  = await Hotel.find(filter).sort(sortObj).skip(type === 'all' ? 0 : skip).limit(type === 'all' ? 4 : Number(limit));
      if (type === 'all') results.push({ category: 'Hotels', items: hotels.map(h => ({ ...h.toObject(), _type: 'hotel' })) });
      else { total = await Hotel.countDocuments(filter); results = hotels.map(h => ({ ...h.toObject(), _type: 'hotel' })); }
    }

    if (type === 'bus' || type === 'all') {
      const filter = { isActive: true };
      if (regex) filter.$or = [{ busName: regex }, { from: regex }, { to: regex }];
      if (from)  filter.from = safeRegex(from); // SEC-04 FIX
      if (to)    filter.to   = safeRegex(to);   // SEC-04 FIX
      if (minPrice) filter.pricePerSeat = { ...filter.pricePerSeat, $gte: Number(minPrice) };
      if (maxPrice) filter.pricePerSeat = { ...filter.pricePerSeat, $lte: Number(maxPrice) };
      const sortObj = sort === 'price-asc' ? { pricePerSeat: 1 } : sort === 'price-desc' ? { pricePerSeat: -1 } : { departureTime: 1 };
      const buses   = await Bus.find(filter).sort(sortObj).skip(type === 'all' ? 0 : skip).limit(type === 'all' ? 4 : Number(limit));
      if (type === 'all') results.push({ category: 'Buses', items: buses.map(b => ({ ...b.toObject(), _type: 'bus' })) });
      else { total = await Bus.countDocuments(filter); results = buses.map(b => ({ ...b.toObject(), _type: 'bus' })); }
    }

    if (type === 'cab' || type === 'all') {
      const filter = { status: 'available', isActive: true };
      if (regex) filter.$or = [{ name: regex }, { brand: regex }, { location: regex }];
      if (city)  filter.location = safeRegex(city); // SEC-04 FIX
      if (minPrice) filter.pricePerDay = { ...filter.pricePerDay, $gte: Number(minPrice) };
      if (maxPrice) filter.pricePerDay = { ...filter.pricePerDay, $lte: Number(maxPrice) };
      const sortObj = sort === 'price-asc' ? { pricePerDay: 1 } : sort === 'price-desc' ? { pricePerDay: -1 } : sort === 'rating' ? { rating: -1 } : { createdAt: -1 };
      const cabs    = await Cab.find(filter).sort(sortObj).skip(type === 'all' ? 0 : skip).limit(type === 'all' ? 4 : Number(limit));
      if (type === 'all') results.push({ category: 'Cabs', items: cabs.map(c => ({ ...c.toObject(), _type: 'cab' })) });
      else { total = await Cab.countDocuments(filter); results = cabs.map(c => ({ ...c.toObject(), _type: 'cab' })); }
    }

    if (type === 'bike' || type === 'all') {
      const filter = { status: 'available', isActive: true };
      if (regex) filter.$or = [{ name: regex }, { brand: regex }, { location: regex }];
      if (city)  filter.location = safeRegex(city); // SEC-04 FIX
      if (minPrice) filter.pricePerDay = { ...filter.pricePerDay, $gte: Number(minPrice) };
      if (maxPrice) filter.pricePerDay = { ...filter.pricePerDay, $lte: Number(maxPrice) };
      const sortObj = sort === 'price-asc' ? { pricePerDay: 1 } : sort === 'price-desc' ? { pricePerDay: -1 } : { createdAt: -1 };
      const bikes   = await Bike.find(filter).sort(sortObj).skip(type === 'all' ? 0 : skip).limit(type === 'all' ? 4 : Number(limit));
      if (type === 'all') results.push({ category: 'Bikes', items: bikes.map(b => ({ ...b.toObject(), _type: 'bike' })) });
      else { total = await Bike.countDocuments(filter); results = bikes.map(b => ({ ...b.toObject(), _type: 'bike' })); }
    }

    if (type === 'service' || type === 'all') {
      const filter = { isActive: true };
      if (regex) filter.$or = [{ packageName: regex }, { place: regex }, { description: regex }];
      if (minPrice) filter.pricePerPerson = { ...filter.pricePerPerson, $gte: Number(minPrice) };
      if (maxPrice) filter.pricePerPerson = { ...filter.pricePerPerson, $lte: Number(maxPrice) };
      const sortObj = sort === 'price-asc' ? { pricePerPerson: 1 } : sort === 'price-desc' ? { pricePerPerson: -1 } : { createdAt: -1 };
      const services = await Service.find(filter).sort(sortObj).skip(type === 'all' ? 0 : skip).limit(type === 'all' ? 4 : Number(limit));
      if (type === 'all') results.push({ category: 'Packages', items: services.map(s => ({ ...s.toObject(), _type: 'service' })) });
      else { total = await Service.countDocuments(filter); results = services.map(s => ({ ...s.toObject(), _type: 'service' })); }
    }

    // Increment popularity (fire-and-forget)
    if (q.trim()) {
      SearchIndex.findOneAndUpdate(
        { term: q.trim() }, { $inc: { popularity: 1 } }, { upsert: false }
      ).catch(() => {});
    }

    res.json({
      status: true, type, query: q, results,
      total:  type === 'all' ? undefined : total,
      page:   Number(page),
      pages:  type === 'all' ? undefined : Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('globalSearch error:', err);
    res.status(500).json({ status: false, message: 'Search failed' });
  }
};

module.exports = { getSuggestions, globalSearch };
