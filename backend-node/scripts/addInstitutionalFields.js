const { connectDb, getDb } = require('../src/config/db');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  await connectDb(uri);
  const db = getDb();
  const coll = db.collection('institutionals');

  const cursor = coll.find({});
  let updated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const patch = {};
    // Desired order: institution_name, institution_type, address, city, state, phone, email, head_name
    if (!Object.prototype.hasOwnProperty.call(doc, 'institution_name')) patch.institution_name = doc.institution_name || null;
    if (!Object.prototype.hasOwnProperty.call(doc, 'institution_type')) patch.institution_type = doc.institution_type || null;
    if (!Object.prototype.hasOwnProperty.call(doc, 'address')) patch.address = doc.address || null;
    if (!Object.prototype.hasOwnProperty.call(doc, 'city')) patch.city = doc.city || null;
    if (!Object.prototype.hasOwnProperty.call(doc, 'state')) patch.state = doc.state || null;
    if (!Object.prototype.hasOwnProperty.call(doc, 'phone')) patch.phone = doc.phone || null;
    if (!Object.prototype.hasOwnProperty.call(doc, 'email')) patch.email = doc.email || null;
    if (!Object.prototype.hasOwnProperty.call(doc, 'head_name')) patch.head_name = doc.head_name || null;

    if (Object.keys(patch).length > 0) {
      await coll.updateOne({ _id: doc._id }, { $set: patch });
      updated++;
    }
  }

  console.log(`Migration complete. Updated ${updated} documents.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Migration failed', e);
  process.exit(1);
});
