const express  = require('express');
const router   = express.Router();
const Contact  = require('../models/Contact'); // FIX: extracted to proper model file
const { protect, adminOnly } = require('../middleware/authMiddleware');

// POST /api/contact — public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ status: false, message: 'name, email and message are required' });
    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json({ status: true, message: 'Message sent!', contact });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// GET /api/contact — admin only, paginated
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 30, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Contact.countDocuments(filter),
    ]);
    res.json({ status: true, contacts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// PUT /api/contact/:id/status — admin only (mark read/resolved)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['unread', 'read', 'resolved'].includes(status))
      return res.status(400).json({ status: false, message: 'Invalid status' });
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contact) return res.status(404).json({ status: false, message: 'Contact not found' });
    res.json({ status: true, contact });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// DELETE /api/contact/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ status: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

module.exports = router;
