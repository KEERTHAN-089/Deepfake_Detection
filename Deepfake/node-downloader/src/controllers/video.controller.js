/**
 * Video Controller
 * Handles all video-related operations: downloading, streaming, analyzing
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { downloadVideo, getVideoDuration } from '../utils/videoDownloader.js';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * Download video from URL and send to Python backend for analysis
 * POST /api/video/download
 */
export const downloadAndAnalyzeVideo = asyncHandler(async (req, res, next) => {
  const { videoUrl } = req.body;

  // Validation
  if (!videoUrl) {
    throw new ApiError(400, 'videoUrl is required');
  }

  // Validate URL format
  try {
    new URL(videoUrl);
  } catch (error) {
    throw new ApiError(400, 'Invalid URL format');
  }

  console.log(`📥 Received download request for: ${videoUrl}`);

  try {
    // Get videos directory
    const videosDir = path.join(process.cwd(), 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    // Step 1: Download video using yt-dlp
    console.log('⏬ Downloading video...');
    const videoPath = await downloadVideo(videoUrl, videosDir);
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
    res.status(200).json(
      new ApiResponse(200, {
        videoInfo: {
          filename: path.basename(videoPath),
          size: `${fileSizeMB}MB`,
          duration: `${duration}s`,
          url: videoUrl
        },
        analysis: pythonResponse.data
      }, 'Video analyzed successfully')
    );

  } catch (error) {
    console.error('❌ Error processing video:', error.message);

    if (error.code === 'ECONNREFUSED') {
      throw new ApiError(503, 'Python backend is not available', [error.message]);
    }

    if (error.response) {
      throw new ApiError(
        error.response.status,
        'Analysis failed',
        [error.response.data?.message || error.response.statusText]
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, 'Failed to process video', [error.message]);
  }
});

/**
 * Stream video file (supports range requests for seeking)
 * GET /api/video/stream/:filename
 */
export const streamVideo = asyncHandler(async (req, res, next) => {
  const { filename } = req.params;
  const videosDir = path.join(process.cwd(), 'videos');
  const filePath = path.join(videosDir, filename);

  // Security: Prevent path traversal attacks
  if (!filePath.startsWith(videosDir)) {
    throw new ApiError(403, 'Access denied');
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Video not found');
  }

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
      'Content-Type': 'video/mp4'
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // No range request, send entire file
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

/**
 * Download video file
 * GET /api/video/download/:filename
 */
export const downloadVideoFile = asyncHandler(async (req, res, next) => {
  const { filename } = req.params;
  const videosDir = path.join(process.cwd(), 'videos');
  const filePath = path.join(videosDir, filename);

  // Security: Prevent path traversal attacks
  if (!filePath.startsWith(videosDir)) {
    throw new ApiError(403, 'Access denied');
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Video not found');
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).json(
        new ApiResponse(500, null, err.message)
      );
    }
  });
});

/**
 * Health check endpoint
 * GET /api/video/health
 */
export const healthCheck = asyncHandler(async (req, res, next) => {
  res.status(200).json(
    new ApiResponse(200, {
      status: 'healthy',
      service: 'video-downloader',
      timestamp: new Date().toISOString()
    }, 'Service is healthy')
  );
});
