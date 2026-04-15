/**
 * controllers/userController.js
 * Admin-only user management — list, view, update role, delete.
 */
const User    = require('../models/User');
const bcrypt  = require('bcrypt');

// GET /api/users  — paginated list with search + role filter
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (search) {
      const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ status: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ status: false, message: 'User not found' });
    res.json({ status: true, user });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// PUT /api/users/:id/role  — change role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'vendor'].includes(role))
      return res.status(400).json({ status: false, message: 'Invalid role' });
    // Prevent admin from downgrading themselves
    if (req.params.id === req.user.id && role !== 'admin')
      return res.status(400).json({ status: false, message: 'Cannot change your own role' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ status: false, message: 'User not found' });
    res.json({ status: true, message: `Role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ status: false, message: 'Cannot delete your own account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ status: false, message: 'User not found' });
    res.json({ status: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// PUT /api/users/:id/reset-password  — admin resets a user's password
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ status: false, message: 'Password must be at least 6 characters' });
    const hashed = await bcrypt.hash(newPassword, 10);
    const user   = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ status: false, message: 'User not found' });
    res.json({ status: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = { getAllUsers, getUserById, updateUserRole, deleteUser, resetUserPassword };
