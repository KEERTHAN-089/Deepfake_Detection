/**
 * Video Routes
 * All video-related API endpoints
 */

import express from 'express';
import {
  downloadAndAnalyzeVideo,
  streamVideo,
  downloadVideoFile,
  healthCheck
} from '../controllers/video.controller.js';

const router = express.Router();

// Health check
router.get('/health', healthCheck);

// Download and analyze video
router.post('/download', downloadAndAnalyzeVideo);

// Stream video
router.get('/stream/:filename', streamVideo);

// Download video file
router.get('/download/:filename', downloadVideoFile);

export default router;
