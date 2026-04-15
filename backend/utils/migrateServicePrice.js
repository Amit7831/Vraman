/**
 * utils/migrateServicePrice.js
 *
 * One-time migration: rename `pricePerPersion` → `pricePerPerson`
 * in every existing Service document.
 *
 * Run ONCE after deploying the updated models/Service.js:
 *   node utils/migrateServicePrice.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const col = mongoose.connection.collection('services');

  // Count documents that still have the old field name
  const stale = await col.countDocuments({ pricePerPersion: { $exists: true } });
  if (stale === 0) {
    console.log('ℹ️  No documents with `pricePerPersion` found — migration already done or not needed.');
    await mongoose.disconnect();
    return;
  }

  console.log(`🔄 Migrating ${stale} document(s)…`);

  // Atomic pipeline update: copy value to new field, remove old field
  const result = await col.updateMany(
    { pricePerPersion: { $exists: true } },
    [
      { $set:   { pricePerPerson: '$pricePerPersion' } },
      { $unset: 'pricePerPersion' },
    ]
  );

  console.log(`✅ Migration complete — ${result.modifiedCount} document(s) updated.`);
  await mongoose.disconnect();
})().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
