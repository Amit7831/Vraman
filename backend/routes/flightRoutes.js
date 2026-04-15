const express = require('express');
const router  = express.Router();
const {
  searchFlights, getRoutes, getFlightById,
  createFlight, updateFlight, deleteFlight, getAllFlights,
} = require('../controllers/flightController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public — search & browse
router.get('/search',  searchFlights);   // GET /api/flights/search?from=DEL&to=BOM&date=...
router.get('/routes',  getRoutes);       // GET /api/flights/routes  (airport list for dropdowns)
router.get('/:id',     getFlightById);   // GET /api/flights/:id

// Admin — manage flights
router.get('/',        protect, adminOnly, getAllFlights);   // GET  /api/flights
router.post('/',       protect, adminOnly, createFlight);   // POST /api/flights
router.put('/:id',     protect, adminOnly, updateFlight);   // PUT  /api/flights/:id
router.delete('/:id',  protect, adminOnly, deleteFlight);   // DELETE /api/flights/:id

module.exports = router;
