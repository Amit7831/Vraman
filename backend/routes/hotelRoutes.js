const express = require('express');
const router  = express.Router();
const { createHotel, getHotels, getHotelById, updateHotel, deleteHotel } = require('../controllers/hotelController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
// FIX: use uploadAny so admin can send 'image' OR 'images' field
const { uploadAny } = require('../middleware/uploadMiddleware');

router.get('/',          getHotels);
router.get('/:id',       getHotelById);
router.post('/',         protect, adminOnly, uploadAny, createHotel);
router.put('/:id',       protect, adminOnly, uploadAny, updateHotel);
router.delete('/:id',    protect, adminOnly, deleteHotel);

module.exports = router;
