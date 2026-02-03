/**
 * Main Application Server
 * Video Downloader & Analyzer Service
 * Integrates all routes, middlewares, and configurations
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware.js';
import { cleanupPartialDownloads } from './utils/videoDownloader.js';
import videoRoutes from './routes/video.routes.js';
import connectDB from './db/connect.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============= MIDDLEWARE =============

// CORS configuration
app.use(cors());

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============= SETUP DIRECTORIES =============

const VIDEOS_DIR = path.join(__dirname, '..', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  console.log('✅ Created videos directory');
}

// Clean up any leftover .ytdl files on startup
cleanupPartialDownloads(VIDEOS_DIR);

// ============= DATABASE CONNECTION =============

const connectDatabase = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('⚠️ Database connection failed:', error.message);
    console.log('ℹ️ Running without database. Make sure MONGO_URL is configured in .env');
  }
};

// ============= ROUTES =============

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'video-downloader',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/video', videoRoutes);

// ============= ERROR HANDLING =============

// 404 Not Found handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// ============= START SERVER =============

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   🚀 Video Downloader Service Started          ║
╠════════════════════════════════════════════════╣
║   Port: ${PORT.toString().padEnd(41)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(32)}║
║   Python Backend: ${process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'.padEnd(23)}║
║   Videos Directory: ${path.resolve(VIDEOS_DIR).substring(0, 22).padEnd(23)}║
╚════════════════════════════════════════════════╝
    `);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ============= INITIALIZE SERVER =============

const initializeApp = async () => {
  // Connect to database
  await connectDatabase();
  
  // Start the server
  startServer();
};

// Initialize the application
initializeApp();

export default app;
