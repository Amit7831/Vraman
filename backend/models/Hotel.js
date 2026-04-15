const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  location:     { type: String, required: true, trim: true },
  city:         { type: String, required: true, trim: true, index: true },
  state:        { type: String, trim: true },
  country:      { type: String, default: 'India', trim: true },
  description:  { type: String },
  pricePerNight:{ type: Number, required: true },
  rating:       { type: Number, default: 4.0, min: 0, max: 5 },
  totalRooms:   { type: Number, default: 10 },
  availableRooms: { type: Number, default: 10 },
  images:       [{ type: String }],
  amenities:    [{ type: String }],
  category:     { type: String, enum: ['budget', 'standard', 'luxury', 'resort', 'boutique'], default: 'standard' },
  isActive:     { type: Boolean, default: true },
  vendor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  approvalNote: { type: String },
  approvedAt:   { type: Date },
}, { timestamps: true });

hotelSchema.index({ name: 'text', city: 'text', location: 'text', description: 'text' });
hotelSchema.index({ city: 1, pricePerNight: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
