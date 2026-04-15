const express = require('express');
const router  = express.Router();
const { AddService, GetService, GetSuggest, GetSingleService, UpdateService, DeleteService } = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
// FIX: use uploadAny so admin can send 'image' (single) OR 'images' (multiple)
const { uploadAny } = require('../middleware/uploadMiddleware');

router.get('/get',           GetService);
router.get('/suggest',       GetSuggest);
router.post('/add',          protect, adminOnly, uploadAny, AddService);
router.put('/update/:id',    protect, adminOnly, uploadAny, UpdateService);
router.delete('/delete/:id', protect, adminOnly, DeleteService);
router.get('/:id',           GetSingleService);

module.exports = router;
