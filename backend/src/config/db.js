const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition_management';

  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured in production.');
  }

  try {
    // Use standard 15s timeout in production for Atlas TLS/DNS handshakes, 3s locally
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 15000 : 3000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await migrateOptionalUserIdIndexes();
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`⚠️ Could not connect to MongoDB: ${error.message}`);

    if (process.env.NODE_ENV === 'production') {
      throw new Error('MongoDB connection failed. Check MONGODB_URI and Atlas Network Access.');
    }

    console.log('🚀 Initializing built-in in-memory MongoDB server for zero-setup instant evaluation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();

      const conn = await mongoose.connect(memUri);
      console.log(`✅ Connected to in-memory MongoDB: ${conn.connection.host}`);

      await migrateOptionalUserIdIndexes();

      // Seed the in-memory database with demo accounts immediately
      await autoSeedIfEmpty(true);
    } catch (memError) {
      console.error('❌ Failed to start in-memory MongoDB:', memError.message);
      process.exit(1);
    }
  }
};

const migrateOptionalUserIdIndexes = async () => {
  const User = require('../models/User');
  const collectionName = User.collection.collectionName;
  const database = mongoose.connection.db;
  const collectionExists = await database
    .listCollections({ name: collectionName }, { nameOnly: true })
    .hasNext();

  if (!collectionExists) {
    await database.createCollection(collectionName);
  }

  // Remove legacy explicit nulls before replacing sparse unique indexes.
  await User.collection.updateMany(
    { teacherCode: { $type: 'null' } },
    { $unset: { teacherCode: '' } }
  );
  await User.collection.updateMany(
    { teacherCode: '' },
    { $unset: { teacherCode: '' } }
  );
  await User.collection.updateMany(
    { studentId: { $type: 'null' } },
    { $unset: { studentId: '' } }
  );
  await User.collection.updateMany(
    { studentId: '' },
    { $unset: { studentId: '' } }
  );

  const indexes = await User.collection.indexes();
  // Remove unique indexes left behind by fields from older User schemas
  // (for example `username`, which is not part of the current model).
  for (const index of indexes) {
    const hasUnknownField = Object.keys(index.key).some(
      (field) => field !== '_id' && !User.schema.path(field)
    );

    if (index.unique && hasUnknownField) {
      await User.collection.dropIndex(index.name);
      console.log(`Removed obsolete unique index ${index.name} from ${collectionName}`);
    }
  }

  for (const field of ['teacherCode', 'studentId']) {
    const fieldIndexes = indexes.filter(
      (index) => index.unique && Object.prototype.hasOwnProperty.call(index.key, field)
    );

    for (const index of fieldIndexes) {
      const isExpectedIndex =
        index.key[field] === 1 &&
        Object.keys(index.key).length === 1 &&
        index.partialFilterExpression?.[field]?.$type === 'string';

      if (!isExpectedIndex) {
        await User.collection.dropIndex(index.name);
        console.log(`Removed legacy unique index ${index.name} from ${collectionName}`);
      }
    }
  }

  await User.collection.createIndex(
    { teacherCode: 1 },
    {
      unique: true,
      partialFilterExpression: { teacherCode: { $type: 'string' } },
      name: 'teacherCode_1'
    }
  );
  await User.collection.createIndex(
    { studentId: 1 },
    {
      unique: true,
      partialFilterExpression: { studentId: { $type: 'string' } },
      name: 'studentId_1'
    }
  );
};

const autoSeedIfEmpty = async (forceSeed = false) => {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0 || forceSeed) {
      const seedDB = require('../utils/seedData');
      await seedDB();
    }
  } catch (err) {
    console.error('Error during auto-seeding:', err.message);
  }
};

module.exports = connectDB;
