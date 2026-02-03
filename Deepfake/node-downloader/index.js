const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = 3001;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());

const VIDEOS_DIR = path.join(__dirname, 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    console.log('✅ Created videos directory');
}

console.log('🚀 Video Downloader Service starting...');
console.log('📡 Python Backend URL:', PYTHON_BACKEND_URL);
console.log('📁 Videos directory:', VIDEOS_DIR);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'video-downloader',
        videosDir: VIDEOS_DIR,
        backendUrl: PYTHON_BACKEND_URL
    });
});

app.post('/download', async (req, res) => {
    console.log('📋 Received request');
    console.log('📋 Request body:', req.body);
    console.log('📋 Request headers:', req.headers);
    
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
        console.log('❌ Invalid URL received:', url);
        return res.status(400).json({ 
            success: false, 
            error: 'Valid URL is required',
            received: req.body
        });
    }

    console.log('📥 Processing download request for:', url);

    const timestamp = Date.now();
    const outputTemplate = path.join(VIDEOS_DIR, `video_${timestamp}.%(ext)s`);

    try {
        console.log('⏬ Downloading video...');

        await new Promise((resolve, reject) => {
            exec('yt-dlp --version', (error) => {
                if (error) {
                    reject(new Error('yt-dlp is not installed. Install it with: pip install yt-dlp'));
                } else {
                    resolve();
                }
            });
        });

        // Download best available format without recoding (avoids codec issues)
        // The backend supports multiple formats: .mp4, .avi, .mov, .mkv, .flv, .wmv
        const ytDlpCommand = `yt-dlp --no-check-certificate -o "${outputTemplate}" "${url}"`;
        
        console.log('🔧 Executing yt-dlp...');

        await new Promise((resolve, reject) => {
            exec(ytDlpCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ yt-dlp error:', error);
                    reject(error);
                    return;
                }
                if (stderr) console.log('📝 yt-dlp stderr:', stderr);
                if (stdout) console.log('📝 yt-dlp stdout:', stdout);
                console.log('✅ Download complete');
                resolve();
            });
        });

        // Find the downloaded file (extension might vary)
        const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.startsWith(`video_${timestamp}`));
        
        if (files.length === 0) {
            throw new Error('Download completed but file not found');
        }
        
        const actualFilename = files[0];
        const outputPath = path.join(VIDEOS_DIR, actualFilename);
        
        console.log(`📁 Downloaded file: ${actualFilename}`);

        const stats = fs.statSync(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('📊 File downloaded:', fileSizeMB, 'MB');

        console.log('📖 Reading video file for analysis...');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(outputPath), {
            filename: actualFilename,
            contentType: 'video/mp4' // Generic, backend will handle different formats
        });

        console.log('🚀 Sending to Python backend...');
        
        const backendResponse = await axios.post(
            `${PYTHON_BACKEND_URL}/analyze`,
            formData,
            {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 120000
            }
        );

        console.log('✅ Backend analysis complete');

        try {
            fs.unlinkSync(outputPath);
            console.log('🗑️  Deleted temporary file');
        } catch (err) {
            console.warn('⚠️  Could not delete temp file:', err.message);
        }

        res.json({
            success: true,
            message: 'Video analyzed successfully',
            analysis: backendResponse.data  // ← THIS LINE IS CRITICAL!
        });

    } catch (error) {
        console.error('❌ Error:', error.message);

        try {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        } catch (err) {}

        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
});

function killPort(port) {
    return new Promise((resolve) => {
        exec(`lsof -ti:${port} | xargs kill -9`, (error) => {
            if (error) {
                console.log(`ℹ️  No existing process on port ${port}`);
            } else {
                console.log(`🗑️  Killed existing process on port ${port}`);
            }
            resolve();
        });
    });
}

async function startServer() {
    await killPort(PORT);
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} still in use, retrying...`);
            setTimeout(async () => {
                await killPort(PORT);
                startServer();
            }, 1000);
        } else {
            console.error('❌ Server error:', err);
        }
    });
}

startServer();
