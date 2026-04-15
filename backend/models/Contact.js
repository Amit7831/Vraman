const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, trim: true },
  message: { type: String, required: true },
  status:  { type: String, enum: ['unread', 'read', 'resolved'], default: 'unread' },
}, { timestamps: true });

contactSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
