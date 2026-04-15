const mongoose = require('mongoose');

const cabSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  brand:           { type: String, required: true, trim: true },
  model:           { type: String, required: true, trim: true },
  type:            { type: String, enum: ['sedan','suv','hatchback','luxury','van','auto'], required: true },
  seatingCapacity: { type: Number, required: true, min: 1 },
  fuelType:        { type: String, enum: ['petrol','diesel','electric','hybrid','cng'], required: true },
  transmission:    { type: String, enum: ['manual','automatic'], required: true },
  pricePerDay:     { type: Number, required: true },
  pricePerKm:      { type: Number, default: 12 },
  ac:              { type: Boolean, default: true },
  image:           { type: String },        // primary (backward compat)
  images:          [{ type: String }],      // NEW: multi-image gallery
  description:     { type: String },
  location:        { type: String, required: true, trim: true },
  driverIncluded:  { type: Boolean, default: true },
  status:          { type: String, enum: ['available','booked','maintenance'], default: 'available' },
  rating:          { type: Number, default: 4.2, min: 0, max: 5 },
  isActive:        { type: Boolean, default: true },
  vendor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalStatus:  { type: String, enum: ['pending','approved','rejected'], default: 'approved' },
  approvalNote:    { type: String },
  approvedAt:      { type: Date },
}, { timestamps: true });

cabSchema.index({ name: 'text', brand: 'text', location: 'text' });
cabSchema.index({ location: 1, type: 1, status: 1 });
module.exports = mongoose.model('Cab', cabSchema);
