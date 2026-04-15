const User   = require('../models/User');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/token');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: 'Please provide a valid email address' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'User already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(), email: email.toLowerCase().trim(),
      password: hashedPassword, phone,
    });

    res.status(201).json({
      _id: user.id, name: user.name, email: user.email,
      role: user.role, phone: user.phone,
      avatar: user.avatar || user.profileImage || null,
      profileImage: user.profileImage || user.avatar || null,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const img = user.profileImage || user.avatar || null;
    res.json({
      _id: user.id, name: user.name, email: user.email,
      role: user.role, phone: user.phone,
      avatar: img, profileImage: img,
      token: generateToken(user.id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logoutUser = (req, res) => res.status(200).json({ message: 'Logged out successfully' });

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const img  = user.profileImage || user.avatar || null;
    res.status(200).json({ ...user.toObject(), avatar: img, profileImage: img });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const update = {};
    if (name)  update.name  = name.trim();
    if (phone) update.phone = phone.trim();

    // Avatar uploaded via uploadAvatar middleware → field name 'avatar'
    if (req.file) {
      update.avatar       = req.file.path; // ImageKit CDN URL
      update.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, update, { new: true, runValidators: true }
    ).select('-password');

    const img = user.profileImage || user.avatar || null;
    res.json({ ...user.toObject(), avatar: img, profileImage: img });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new passwords are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, logoutUser, getMe, updateProfile, changePassword };
