const mongoose = require('mongoose');

// ✅ BUG-01 FIX: field name corrected to `pricePerPerson`
// After deploying this file, run: node utils/migrateServicePrice.js
const serviceSchema = new mongoose.Schema({
  category:            { type: String, index: true },
  packageName:         { type: String, required: true, trim: true },
  place:               { type: String, trim: true },
  duration:            { type: String },
  pricePerPerson:      { type: Number },   
  availableBookingSeat:{ type: Number, default: 10 },
  dateDeadline:        { type: String },
  accommodation:       { type: String },
  transport:           { type: String },
  image:               { type: String },
  images:              [{ type: String }],
  description:         { type: String },
  rating:              { type: Number, default: 4.0 },
  highlights:          [{ type: String }],
  inclusions:          [{ type: String }],
  exclusions:          [{ type: String }],
  isActive:            { type: Boolean, default: true },

  // Vendor ownership & approval
  vendor:              { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalStatus:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  approvalNote:        { type: String },
  approvedAt:          { type: Date },
}, { timestamps: true });

serviceSchema.index({ packageName: 'text', place: 'text', accommodation: 'text', transport: 'text', description: 'text' });
serviceSchema.index({ category: 1, pricePerPerson: 1 }); // ← index field name also fixed

module.exports = mongoose.model('Service', serviceSchema);
