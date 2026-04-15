const mongoose = require('mongoose');

const searchIndexSchema = new mongoose.Schema({
  term:      { type: String, required: true, trim: true },
  type:      { type: String, enum: ['city', 'location', 'hotel', 'bus_route', 'cab', 'bike', 'service'], required: true },
  refId:     { type: mongoose.Schema.Types.ObjectId },
  refModel:  { type: String },
  metadata:  { type: mongoose.Schema.Types.Mixed },
  popularity:{ type: Number, default: 0 },
}, { timestamps: true });

searchIndexSchema.index({ term: 'text' });
searchIndexSchema.index({ term: 1, type: 1 });
searchIndexSchema.index({ popularity: -1 });

module.exports = mongoose.model('SearchIndex', searchIndexSchema);
