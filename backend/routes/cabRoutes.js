const express = require('express');
const router  = express.Router();
const { createCab, getCabs, getCabById, updateCab, deleteCab } = require('../controllers/cabController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
// FIX: use uploadAny so admin can send 'image' OR 'images' fields
const { uploadAny } = require('../middleware/uploadMiddleware');

router.get('/',           getCabs);
router.get('/available',  getCabs);
router.get('/:id',        getCabById);
router.post('/',          protect, adminOnly, uploadAny, createCab);
router.put('/:id',        protect, adminOnly, uploadAny, updateCab);
router.delete('/:id',     protect, adminOnly, deleteCab);

module.exports = router;
