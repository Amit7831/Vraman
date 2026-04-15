/**
 * utils/migrateToImageKit.js
 * One-time utility to re-upload all existing Cloudinary image URLs
 * into ImageKit and update every MongoDB document in place.
 *
 * Run with:  node utils/migrateToImageKit.js
 * Safe to re-run — skips URLs already on ImageKit.
 */
const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
dotenv.config();

const { uploadUrlToImageKit } = require('../config/imagekit');

const Hotel   = require('../models/Hotel');
const Cab     = require('../models/Cab');
const Bike    = require('../models/Bike');
const Service = require('../models/Service');
const User    = require('../models/User');

// ── helpers ────────────────────────────────────────────────────────────────
const isCloudinary = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

const isImageKit = (url) =>
  typeof url === 'string' && url.includes('ik.imagekit.io');

let migrated = 0;
let skipped  = 0;
let failed   = 0;

async function migrateUrl(url, label) {
  if (!url) return url;
  if (isImageKit(url)) { skipped++; return url; }
  if (!isCloudinary(url)) { skipped++; return url; }

  try {
    const newUrl = await uploadUrlToImageKit(url, `migrated_${Date.now()}`, 'vraman/migrated');
    console.log(`  ✅ ${label}: migrated`);
    migrated++;
    return newUrl;
  } catch (err) {
    console.error(`  ❌ ${label}: ${err.message}`);
    failed++;
    return url;   // keep original on failure — don't break the record
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected\n');

  // ── Hotels ──────────────────────────────────────────────────────────────
  console.log('📦 Hotels…');
  const hotels = await Hotel.find({ images: { $exists: true, $ne: [] } });
  for (const h of hotels) {
    const newImages = await Promise.all(
      h.images.map((img, i) => migrateUrl(img, `Hotel[${h.name}] image[${i}]`))
    );
    if (JSON.stringify(newImages) !== JSON.stringify(h.images)) {
      await Hotel.findByIdAndUpdate(h._id, { images: newImages });
    }
  }

  // ── Cabs ────────────────────────────────────────────────────────────────
  console.log('📦 Cabs…');
  const cabs = await Cab.find({ image: { $exists: true } });
  for (const c of cabs) {
    const newImg = await migrateUrl(c.image, `Cab[${c.name}]`);
    if (newImg !== c.image) await Cab.findByIdAndUpdate(c._id, { image: newImg });
  }

  // ── Bikes ───────────────────────────────────────────────────────────────
  console.log('📦 Bikes…');
  const bikes = await Bike.find({ image: { $exists: true } });
  for (const b of bikes) {
    const newImg = await migrateUrl(b.image, `Bike[${b.brand} ${b.name}]`);
    if (newImg !== b.image) await Bike.findByIdAndUpdate(b._id, { image: newImg });
  }

  // ── Services ─────────────────────────────────────────────────────────────
  console.log('📦 Services…');
  const services = await Service.find({ image: { $exists: true } });
  for (const s of services) {
    const newImg = await migrateUrl(s.image, `Service[${s.packageName}]`);
    if (newImg !== s.image) await Service.findByIdAndUpdate(s._id, { image: newImg });
  }

  // ── User avatars ─────────────────────────────────────────────────────────
  console.log('📦 User avatars…');
  const users = await User.find({ avatar: { $exists: true } });
  for (const u of users) {
    const newAvatar = await migrateUrl(u.avatar, `User[${u.email}]`);
    if (newAvatar !== u.avatar) await User.findByIdAndUpdate(u._id, { avatar: newAvatar });
  }

  console.log(`\n── Migration complete ─────────────────────`);
  console.log(`  Migrated : ${migrated}`);
  console.log(`  Skipped  : ${skipped}  (already on ImageKit or not an image)`);
  console.log(`  Failed   : ${failed}`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
