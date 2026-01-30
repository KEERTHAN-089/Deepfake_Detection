/**
 * Database Connection Module (Skeleton)
 * Handles MongoDB connection setup
 * Configure and enable when MongoDB integration is needed
 */


import mongoose from 'mongoose'
import ApiError from '../utils/ApiError.js';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URL|| 'mongodb://localhost:27017/deepfake-detection';
    
    const connectionInstance = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ MongoDB connected: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw new ApiError(500, 'Failed to connect to MongoDB', [error.message]);
  }
};

export default connectDB;


