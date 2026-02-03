/**
 * Video Downloader Utility
 * Handles downloading videos using yt-dlp and extracting metadata
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import ApiError from './ApiError';

/**
 * Download video from URL using yt-dlp
 * @param {string} videoUrl - URL of the video to download
 * @param {string} outputDir - Directory to save the video
 * @returns {Promise<string>} - Path to the downloaded video file
 */
export const downloadVideo = async (videoUrl, outputDir) => {
  try {
    const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');
    
    // Execute yt-dlp command
    const command = `yt-dlp -f "best[ext=mp4]" -o "${outputTemplate}" "${videoUrl}"`;
    
    execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      stdio: 'pipe'
    });

    // Find the downloaded file
    const files = fs.readdirSync(outputDir);
    const videoFiles = files.filter(f => 
      f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mkv')
    );

    if (videoFiles.length === 0) {
      throw new ApiError(500, 'Video download failed - no output file found');
    }

    const latestFile = videoFiles.reduce((latest, file) => {
      const latestPath = path.join(outputDir, latest);
      const filePath = path.join(outputDir, file);
      return fs.statSync(filePath).mtime > fs.statSync(latestPath).mtime 
        ? file 
        : latest;
    });

    return path.join(outputDir, latestFile);
  } catch (error) {
    throw new ApiError(500, 'Failed to download video', [error.message]);
  }
};

/**
 * Get video duration using ffprobe
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<number>} - Duration in seconds
 */
export const getVideoDuration = async (videoPath) => {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of "default=noprint_wrappers=1:nokey=1:csv=type=oneandonly" "${videoPath}"`;
    const duration = parseFloat(execSync(command, { encoding: 'utf-8' }).trim());
    return isNaN(duration) ? 0 : Math.round(duration);
  } catch (error) {
    console.warn('⚠️ Could not get video duration:', error.message);
    return 0;
  }
};

/**
 * Clean up partial downloads (.ytdl files)
 * @param {string} videosDir - Directory containing videos
 */
export const cleanupPartialDownloads = (videosDir) => {
  try {
    const files = fs.readdirSync(videosDir);
    const ytdlFiles = files.filter(f => f.endsWith('.ytdl'));
    
    ytdlFiles.forEach(file => {
      const filePath = path.join(videosDir, file);
      fs.unlinkSync(filePath);
      console.log(`🧹 Cleaned up partial download: ${file}`);
    });
  } catch (error) {
    console.warn('⚠️ Could not clean up partial downloads:', error.message);
  }
};
