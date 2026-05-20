const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.log('⚠️  MONGO_URI not set — skipping MongoDB connection');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('⚠️  MongoDB connection error:', err.message);
  }
}

module.exports = connectDB;
