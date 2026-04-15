const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  // Airline info
  airline:       { type: String, required: true, trim: true },   // "IndiGo"
  airlineCode:   { type: String, required: true, trim: true, uppercase: true }, // "6E"
  flightNumber:  { type: String, required: true, trim: true, uppercase: true }, // "6E-201"
  aircraft:      { type: String, trim: true },                   // "Airbus A320"

  // Route
  from:          { type: String, required: true, trim: true, uppercase: true, index: true }, // "DEL"
  fromCity:      { type: String, required: true, trim: true },   // "Delhi"
  fromAirport:   { type: String, trim: true },                   // "Indira Gandhi International"
  to:            { type: String, required: true, trim: true, uppercase: true, index: true }, // "BOM"
  toCity:        { type: String, required: true, trim: true },   // "Mumbai"
  toAirport:     { type: String, trim: true },

  // Timing
  departureTime: { type: String, required: true },  // "06:00"
  arrivalTime:   { type: String, required: true },  // "08:10"
  duration:      { type: String, required: true },  // "2h 10m"
  daysOfWeek:    [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }], // operates on these days

  // Pricing per seat by class
  price: {
    economy:        { type: Number, required: true },
    premiumEconomy: { type: Number },
    business:       { type: Number },
    first:          { type: Number },
  },

  // Seat availability per class
  seats: {
    economy:        { type: Number, default: 150 },
    premiumEconomy: { type: Number, default: 30 },
    business:       { type: Number, default: 20 },
    first:          { type: Number, default: 8 },
  },

  stops:    { type: Number, default: 0 },   // 0 = non-stop, 1 = one stop
  baggage:  { type: String, default: '15 kg' },
  meal:     { type: Boolean, default: false },
  refundable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

flightSchema.index({ from: 1, to: 1, isActive: 1 });
flightSchema.index({ from: 'text', to: 'text', fromCity: 'text', toCity: 'text', airline: 'text' });

module.exports = mongoose.model('Flight', flightSchema);
