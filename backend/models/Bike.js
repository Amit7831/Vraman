const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  brand:         { type: String, required: true, trim: true },
  model:         { type: String, required: true, trim: true },
  type:          { type: String, enum: ['scooter','cruiser','sports','adventure','electric','standard'], required: true },
  engineCC:      { type: Number },
  fuelType:      { type: String, enum: ['petrol','electric','diesel'], default: 'petrol' },
  pricePerDay:   { type: Number, required: true },
  pricePerHour:  { type: Number },
  image:         { type: String },          // primary (backward compat)
  images:        [{ type: String }],        // NEW: multi-image gallery
  description:   { type: String },
  location:      { type: String, required: true, trim: true },
  helmetIncluded:{ type: Boolean, default: true },
  status:        { type: String, enum: ['available','booked','maintenance'], default: 'available' },
  rating:        { type: Number, default: 4.0, min: 0, max: 5 },
  isActive:      { type: Boolean, default: true },
  vendor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalStatus:{ type: String, enum: ['pending','approved','rejected'], default: 'approved' },
  approvalNote:  { type: String },
  approvedAt:    { type: Date },
}, { timestamps: true });

bikeSchema.index({ name: 'text', brand: 'text', location: 'text' });
bikeSchema.index({ location: 1, type: 1, status: 1 });
module.exports = mongoose.model('Bike', bikeSchema);
