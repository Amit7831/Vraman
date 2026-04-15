const express = require('express');
const router  = express.Router();
const { createBus, getBuses, getBusById, updateBus, deleteBus } = require('../controllers/busController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadAny } = require('../middleware/uploadMiddleware');

router.get('/',       getBuses);
router.get('/:id',    getBusById);
router.post('/',      protect, adminOnly, uploadAny, createBus);
router.put('/:id',    protect, adminOnly, uploadAny, updateBus);
router.delete('/:id', protect, adminOnly, deleteBus);

module.exports = router;
