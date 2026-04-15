const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a user.
 * @param {string} id   - MongoDB ObjectId string
 * @param {string} role - 'user' | 'admin' | 'vendor'
 * @returns {string} signed JWT
 */
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

module.exports = { generateToken };
