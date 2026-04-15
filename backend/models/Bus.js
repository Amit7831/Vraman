const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busName:       { type: String, required: true, trim: true },
  busNumber:     { type: String, required: true, unique: true, trim: true },
  busType:       { type: String, enum: ['AC Sleeper','AC Seater','Non-AC Sleeper','Non-AC Seater','Volvo AC','Mini Bus'], required: true },
  from:          { type: String, required: true, trim: true, index: true },
  to:            { type: String, required: true, trim: true, index: true },
  departureTime: { type: String, required: true },
  arrivalTime:   { type: String, required: true },
  duration:      { type: String },
  pricePerSeat:  { type: Number, required: true },
  totalSeats:    { type: Number, required: true, default: 40 },
  availableSeats:{ type: Number, required: true, default: 40 },
  amenities:     [{ type: String }],
  operatorName:  { type: String, trim: true },
  rating:        { type: Number, default: 4.0, min: 0, max: 5 },
  isActive:      { type: Boolean, default: true },
  departureDate: { type: Date },
  image:         { type: String },          // primary image (backward compat)
  images:        [{ type: String }],        // multi-image gallery
  vendor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalStatus:{ type: String, enum: ['pending','approved','rejected'], default: 'approved' },
  approvalNote:  { type: String },
  approvedAt:    { type: Date },
}, { timestamps: true });

busSchema.index({ from: 'text', to: 'text', busName: 'text' });
busSchema.index({ from: 1, to: 1, departureDate: 1 });
module.exports = mongoose.model('Bus', busSchema);
