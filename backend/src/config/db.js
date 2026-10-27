const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition_management';

  try {
    // Attempt connecting to specified or local MongoDB with 2s timeout
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`⚠️ Could not connect to local/external MongoDB at "${primaryUri}": ${error.message}`);
    console.log('🚀 Initializing built-in in-memory MongoDB server for zero-setup instant evaluation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();

      const conn = await mongoose.connect(memUri);
      console.log(`✅ Connected to in-memory MongoDB: ${conn.connection.host}`);

      // Seed the in-memory database with demo accounts immediately
      await autoSeedIfEmpty(true);
    } catch (memError) {
      console.error('❌ Failed to start in-memory MongoDB:', memError.message);
      process.exit(1);
    }
  }
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
