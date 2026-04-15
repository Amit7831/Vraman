const express = require('express');
const router  = express.Router();
const { createBooking, getMyBookings, getAllBookings, cancelBooking, deleteBooking } = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/create',       protect, createBooking);
router.get('/my-bookings',   protect, getMyBookings);
router.get('/all',           protect, adminOnly, getAllBookings);
router.put('/cancel/:id',    protect, cancelBooking);
router.delete('/:id',        protect, adminOnly, deleteBooking);

module.exports = router;
