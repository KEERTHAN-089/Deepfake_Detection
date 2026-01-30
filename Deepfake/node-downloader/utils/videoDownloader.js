import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Download video using yt-dlp
 */
export async function downloadVideo(videoUrl, outputDir) {
  const timestamp = Date.now();
  const outputTemplate = path.join(outputDir, `video_${timestamp}.mp4`);

  // Updated command with SSL bypass for corporate networks
  const command = `yt-dlp --no-check-certificate --extractor-args "youtube:player_client=default" -f "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --merge-output-format mp4 -o "${outputTemplate}" "${videoUrl}"`;

  console.log(`🔧 Executing: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    });

    if (stderr && !stderr.includes('WARNING')) {
      console.warn('⚠️ yt-dlp stderr:', stderr);
    }

    console.log('📝 yt-dlp output:', stdout);

    if (!fs.existsSync(outputTemplate)) {
      throw new Error('Video file was not created');
    }

    // Check if file is empty
    const stats = fs.statSync(outputTemplate);
    if (stats.size === 0) {
      fs.unlinkSync(outputTemplate); // Remove empty file
      throw new Error('Downloaded file is empty - video may be restricted or unavailable');
    }

    // Clean up any .ytdl partial download files
    const ytdlFile = `${outputTemplate}.ytdl`;
    if (fs.existsSync(ytdlFile)) {
      fs.unlinkSync(ytdlFile);
    }

    return outputTemplate;
  } catch (error) {
    console.error('❌ yt-dlp error:', error);

    // Clean up partial downloads
    if (fs.existsSync(outputTemplate)) {
      fs.unlinkSync(outputTemplate);
    }
    const ytdlFile = `${outputTemplate}.ytdl`;
    if (fs.existsSync(ytdlFile)) {
      fs.unlinkSync(ytdlFile);
    }

    if (error.message.includes('not found') || error.message.includes('command not found')) {
      throw new Error('yt-dlp is not installed. Please install it: pip install yt-dlp');
    }

    if (error.message.includes('SSL') || error.message.includes('CERTIFICATE')) {
      throw new Error('SSL certificate error. This may be caused by antivirus, firewall, or corporate proxy. Try updating yt-dlp: pip install -U yt-dlp');
    }

    if (error.message.includes('Unsupported URL')) {
      throw new Error('Unsupported video URL or platform');
    }

    if (error.message.includes('Private video') || error.message.includes('Video unavailable')) {
      throw new Error('Video is private or unavailable');
    }

    if (error.message.includes('HTTP Error 403') || error.message.includes('empty')) {
      throw new Error('YouTube video download blocked. Try: 1) Update yt-dlp: pip install -U yt-dlp 2) The video may have restrictions');
    }

    throw new Error(`Failed to download video: ${error.message}`);
  }
}

/**
 * Get video duration using ffprobe
 */
export async function getVideoDuration(videoPath) {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error) {
    console.warn('⚠️ Could not get video duration:', error.message);
    return 0;
  }
}
