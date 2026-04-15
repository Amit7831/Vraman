const Flight = require('../models/Flight');

// ── GET /api/flights/search ─────────────────────────────────────────────────
// Query params: from, to, date, adults, cabin, sort, page, limit
const searchFlights = async (req, res) => {
  try {
    const {
      from, to, date,
      adults = 1, cabin = 'economy',
      sort = 'price', page = 1, limit = 20,
    } = req.query;

    if (!from || !to)
      return res.status(400).json({ message: '`from` and `to` are required' });

    const filter = {
      isActive: true,
      from: from.toUpperCase().trim(),
      to:   to.toUpperCase().trim(),
    };

    // Filter by day of week if date is provided
    if (date) {
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const day = dayNames[new Date(date).getDay()];
      filter.$or = [
        { daysOfWeek: { $size: 0 } },   // no restriction = runs every day
        { daysOfWeek: day },
      ];
    }

    // Only return flights that have seats in the requested cabin
    const seatField = `seats.${cabin.toLowerCase()}`;
    filter[seatField] = { $gt: 0 };

    const sortMap = {
      price:     { [`price.${cabin.toLowerCase()}`]: 1 },
      duration:  { duration: 1 },
      departure: { departureTime: 1 },
      arrival:   { arrivalTime: 1 },
    };
    const sortObj = sortMap[sort] || sortMap.price;

    const skip = (Number(page) - 1) * Number(limit);
    const adultsN = Math.max(1, parseInt(adults, 10) || 1);
    const cabinKey = cabin.toLowerCase();
    const priceField = `price.${cabinKey}`;

    const [flights, total] = await Promise.all([
      Flight.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      Flight.countDocuments(filter),
    ]);

    // Shape response to match what the frontend already expects
    const result = flights.map(f => ({
      _id:           f._id,
      airline:       f.airline,
      airlineCode:   f.airlineCode,
      flightNumber:  f.flightNumber,
      aircraft:      f.aircraft,
      from:          f.from,
      fromCity:      f.fromCity,
      fromAirport:   f.fromAirport,
      to:            f.to,
      toCity:        f.toCity,
      toAirport:     f.toAirport,
      departureTime: f.departureTime,
      arrivalTime:   f.arrivalTime,
      duration:      f.duration,
      stops:         f.stops,
      cabin:         cabinKey,
      pricePerSeat:  f.price[cabinKey] || f.price.economy,
      totalPrice:    (f.price[cabinKey] || f.price.economy) * adultsN,
      seatsAvailable:f.seats[cabinKey] || 0,
      baggage:       f.baggage,
      meal:          f.meal,
      refundable:    f.refundable,
      daysOfWeek:    f.daysOfWeek,
    }));

    res.json({
      status: true,
      flights: result,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      query: { from: from.toUpperCase(), to: to.toUpperCase(), date, adults: adultsN, cabin: cabinKey },
    });
  } catch (err) {
    console.error('searchFlights:', err.message);
    res.status(500).json({ status: false, message: err.message });
  }
};

// ── GET /api/flights/routes ─────────────────────────────────────────────────
// Returns all unique from/to cities for search dropdowns
const getRoutes = async (req, res) => {
  try {
    const routes = await Flight.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: null,
        origins:      { $addToSet: { code: '$from', city: '$fromCity' } },
        destinations: { $addToSet: { code: '$to',   city: '$toCity'   } },
      }},
      { $project: { _id: 0, origins: 1, destinations: 1 } },
    ]);
    const data = routes[0] || { origins: [], destinations: [] };
    // Combine and deduplicate all airports for a single autocomplete list
    const allAirports = Object.values(
      [...data.origins, ...data.destinations].reduce((acc, a) => {
        acc[a.code] = a; return acc;
      }, {})
    ).sort((a, b) => a.city.localeCompare(b.city));

    res.json({ status: true, airports: allAirports, origins: data.origins, destinations: data.destinations });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// ── GET /api/flights/:id ────────────────────────────────────────────────────
const getFlightById = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ status: false, message: 'Flight not found' });
    res.json({ status: true, flight });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// ── POST /api/flights (admin) ───────────────────────────────────────────────
const createFlight = async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json({ status: true, message: 'Flight created', flight });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// ── PUT /api/flights/:id (admin) ────────────────────────────────────────────
const updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!flight) return res.status(404).json({ status: false, message: 'Flight not found' });
    res.json({ status: true, message: 'Flight updated', flight });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// ── DELETE /api/flights/:id (admin) ─────────────────────────────────────────
const deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);
    if (!flight) return res.status(404).json({ status: false, message: 'Flight not found' });
    res.json({ status: true, message: 'Flight deleted' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// ── GET /api/flights (admin — paginated list) ────────────────────────────────
const getAllFlights = async (req, res) => {
  try {
    const { page = 1, limit = 20, from, to, airline } = req.query;
    const filter = {};
    if (from)    filter.from    = from.toUpperCase();
    if (to)      filter.to      = to.toUpperCase();
    if (airline) filter.airline = new RegExp(airline, 'i');
    const skip = (Number(page) - 1) * Number(limit);
    const [flights, total] = await Promise.all([
      Flight.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Flight.countDocuments(filter),
    ]);
    res.json({ status: true, flights, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = { searchFlights, getRoutes, getFlightById, createFlight, updateFlight, deleteFlight, getAllFlights };
