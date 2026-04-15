/**
 * utils/helpers.js
 * Shared utility functions used across controllers.
 */

/**
 * Escape regex metacharacters in user-supplied strings.
 * Prevents ReDoS (SEC-04) when constructing RegExp from untrusted input.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a safe case-insensitive regex from a user query string.
 * @param {string} str
 * @returns {RegExp}
 */
function safeRegex(str) {
  return new RegExp(escapeRegex(str.trim()), 'i');
}

/**
 * Parse a positive integer from a value, falling back to `fallback`.
 * @param {*}      val
 * @param {number} fallback
 * @returns {number}
 */
function posInt(val, fallback = 1) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Calculate nights between two date strings (minimum 1).
 * @param {string} start
 * @param {string} end
 * @returns {number}
 */
function calcNights(start, end) {
  if (!start || !end) return 1;
  return Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86_400_000));
}

module.exports = { escapeRegex, safeRegex, posInt, calcNights };
