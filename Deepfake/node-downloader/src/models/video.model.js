/**
 * Video Model (Skeleton)
 * This is a skeleton Mongoose model for storing video metadata
 * Uncomment and configure when MongoDB is integrated
 */

/*
import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    originalUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number, // in bytes
      required: true
    },
    duration: {
      type: Number, // in seconds
      required: true
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    analysisData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    deepfakeScore: {
      type: Number,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

const Video = mongoose.model('Video', videoSchema);

export default Video;
*/

// For now, this file is here as a skeleton
export const VideoModel = {
  description: 'Mongoose Video Model - Enable when MongoDB is integrated'
};
