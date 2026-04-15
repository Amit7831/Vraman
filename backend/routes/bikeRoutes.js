const express = require('express');
const router  = express.Router();
const { createBike, getBikes, getBikeById, updateBike, deleteBike } = require('../controllers/bikeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
// FIX: use uploadAny so admin can send 'image' OR 'images' fields
const { uploadAny } = require('../middleware/uploadMiddleware');

router.get('/',       getBikes);
router.get('/:id',    getBikeById);
router.post('/',      protect, adminOnly, uploadAny, createBike);
router.put('/:id',    protect, adminOnly, uploadAny, updateBike);
router.delete('/:id', protect, adminOnly, deleteBike);

module.exports = router;
