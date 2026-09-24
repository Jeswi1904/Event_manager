const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is not reachable
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(
      '\n⚠️  Could not connect to MongoDB. Please ensure MongoDB is running at:',
      process.env.MONGODB_URI
    );
    console.error(
      '   To install MongoDB: https://www.mongodb.com/try/download/community\n'
    );
    return false;
  }
};

module.exports = connectDB;
