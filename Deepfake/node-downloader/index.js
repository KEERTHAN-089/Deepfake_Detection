import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { downloadVideo, getVideoDuration } from './utils/videoDownloader.js';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create necessary directories
const VIDEOS_DIR = path.join(__dirname, 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  console.log('✅ Created videos directory');
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'video-downloader',
    timestamp: new Date().toISOString()
  });
});

/**
 * Main endpoint: Download video from URL and send to Python backend
 */
app.post('/download', async (req, res) => {
  const { videoUrl } = req.body;

  // Validation
  if (!videoUrl) {
    return res.status(400).json({
      success: false,
      error: 'videoUrl is required'
    });
  }

  // Validate URL format
  try {
    new URL(videoUrl);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format'
    });
  }

  console.log(`📥 Received download request for: ${videoUrl}`);

  try {
    // Step 1: Download video using yt-dlp
    console.log('⏬ Downloading video...');
    const videoPath = await downloadVideo(videoUrl, VIDEOS_DIR);
    console.log(`✅ Video downloaded: ${path.basename(videoPath)}`);

    // Step 2: Get video information
    const duration = await getVideoDuration(videoPath);
    const fileStats = fs.statSync(videoPath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

    console.log(`📊 Video info: ${fileSizeMB}MB, ${duration}s duration`);

    // Step 3: Read video file into buffer
    console.log('📖 Reading video file...');
    const videoBuffer = fs.readFileSync(videoPath);

    // Step 4: Send video to Python backend
    console.log('🚀 Sending to Python backend for analysis...');
    const formData = new FormData();
    formData.append('file', videoBuffer, {
      filename: path.basename(videoPath),
      contentType: 'video/mp4'
    });

    const pythonResponse = await axios.post(
      `${PYTHON_BACKEND_URL}/analyze`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 300000 // 5 minutes timeout
      }
    );

    console.log('✅ Python backend response received');

    // Step 5: Return response to frontend
    res.json({
      success: true,
      message: 'Video analyzed successfully',
      videoInfo: {
        filename: path.basename(videoPath),
        size: `${fileSizeMB}MB`,
        duration: `${duration}s`,
        url: videoUrl
      },
      analysis: pythonResponse.data
    });

  } catch (error) {
    console.error('❌ Error processing video:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Python backend is not available',
        details: error.message
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'Analysis failed',
        details: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process video',
      details: error.message
    });
  }
});

/**
 * Stream video file
 */
app.get('/videos/stream/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(VIDEOS_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range request for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range request, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Download video file
 */
app.get('/videos/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(VIDEOS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Video Downloader Service running on port ${PORT}`);
  console.log(`📡 Python Backend URL: ${PYTHON_BACKEND_URL}`);
  console.log(`📁 Videos directory: ${VIDEOS_DIR}`);
});
