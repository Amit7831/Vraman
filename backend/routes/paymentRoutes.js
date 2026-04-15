const express = require('express');
const router  = express.Router();
const { createOrder, verifyPayment, getKey } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/key',          getKey);                   // public: return Razorpay key_id
router.post('/create-order', protect, createOrder);    // auth: create Razorpay order
router.post('/verify',       protect, verifyPayment);  // auth: verify payment signature

module.exports = router;
