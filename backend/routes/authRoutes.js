const express = require('express');
const router  = express.Router();
const {
  registerUser, loginUser, logoutUser,
  getMe, updateProfile, changePassword,
} = require('../controllers/authController');
const { protect }      = require('../middleware/authMiddleware');
// FIX: use uploadAvatar (field name 'avatar') for profile image uploads
const { uploadAvatar } = require('../middleware/uploadMiddleware');

router.post('/register',         registerUser);
router.post('/login',            loginUser);
router.post('/logout',           logoutUser);
router.get('/me',                protect, getMe);
// FIX: was uploadSingle('image') → profile sends field 'avatar'
router.put('/profile',           protect, uploadAvatar, updateProfile);
router.put('/change-password',   protect, changePassword);

module.exports = router;
