const mongoose = require('mongoose');

/**
 * Connect to MongoDB using Mongoose.
 * Uses MONGO_URI from environment variables, falling back to local default.
 */
const connectDB = async () => {
    const mongoUri =
        process.env.MONGO_URI || 'mongodb://localhost:27017/spheretest';

    if (!mongoUri) {
        console.error('❌ MONGO_URI is not defined in environment variables');
        throw new Error('MONGO_URI is required');
    }

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        // Exit process with failure so container/PM2 can restart if needed
        process.exit(1);
    }
};

module.exports = connectDB;

