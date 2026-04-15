const express = require('express');
const router  = express.Router();
const {
  getAllUsers, getUserById,
  updateUserRole, deleteUser, resetUserPassword,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin-management routes require auth + admin
router.use(protect, adminOnly);

router.get('/',                      getAllUsers);
router.get('/:id',                   getUserById);
router.put('/:id/role',              updateUserRole);
router.put('/:id/reset-password',    resetUserPassword);
router.delete('/:id',                deleteUser);

module.exports = router;
