const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },
  phone:        { type: String, trim: true },
  avatar:       { type: String },   // kept for backward compat (same field, just aliased)
  profileImage: { type: String },   // NEW explicit field (same value stored here too)
  role:         { type: String, enum: ['user','admin','vendor'], default: 'user' },
  vendorInfo: {
    businessName:  { type: String, trim: true },
    phone:         { type: String, trim: true },
    address:       { type: String, trim: true },
    isApproved:    { type: Boolean, default: false },
    approvedAt:    { type: Date },
    rejectedAt:    { type: Date },
    rejectedReason:{ type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
