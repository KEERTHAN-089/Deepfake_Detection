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
    let outputPath = null;

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

        // Prefer cookies.txt when available (more reliable than live browser DB access)
        const cookiesFile = process.env.YTDLP_COOKIES_FILE || path.join(__dirname, 'cookies.txt');
        const hasCookiesFile = fs.existsSync(cookiesFile);

        // Download best available format - try multiple approaches
        // Approach order: 1) No auth, 2) Different player clients, 3) cookies.txt, 4) Browser cookies
        const downloadMethods = [
            // Method 1: Try without auth first (works for many public videos)
            {
                name: 'default (no auth)',
                cmd: `yt-dlp --no-check-certificate --js-runtimes node --extractor-args "youtube:player_client=web" -o "${outputTemplate}" "${url}"`
            },
            // Method 2: Try with android client (often bypasses restrictions)
            {
                name: 'android client',
                cmd: `yt-dlp --no-check-certificate --js-runtimes node --extractor-args "youtube:player_client=android" -o "${outputTemplate}" "${url}"`
            },
            // Method 3: Try with ios client
            {
                name: 'ios client',
                cmd: `yt-dlp --no-check-certificate --js-runtimes node --extractor-args "youtube:player_client=ios" -o "${outputTemplate}" "${url}"`
            },
        ];

        if (hasCookiesFile) {
            downloadMethods.push({
                name: 'cookies.txt file',
                cmd: `yt-dlp --no-check-certificate --js-runtimes node --cookies "${cookiesFile}" -o "${outputTemplate}" "${url}"`
            });
        }

        // Method 4/5: Browser cookie extraction (can fail if browser is open/locked)
        downloadMethods.push(
            {
                name: 'edge cookies',
                cmd: `yt-dlp --no-check-certificate --js-runtimes node --cookies-from-browser edge -o "${outputTemplate}" "${url}"`
            },
            {
                name: 'chrome cookies',
                cmd: `yt-dlp --no-check-certificate --js-runtimes node --cookies-from-browser chrome -o "${outputTemplate}" "${url}"`
            }
        );

        let downloadSuccess = false;
        let lastError = null;

        for (const method of downloadMethods) {
            console.log(`🔧 Trying yt-dlp with ${method.name}...`);

            try {
                await new Promise((resolve, reject) => {
                    exec(method.cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
                        if (error) {
                            if (stderr) {
                                console.log(`📝 yt-dlp stderr (${method.name}):`, stderr);
                            }
                            reject(error);
                            return;
                        }
                        if (stderr) console.log('📝 yt-dlp stderr:', stderr);
                        if (stdout) console.log('📝 yt-dlp stdout:', stdout);
                        console.log(`✅ Download complete using ${method.name}`);
                        resolve();
                    });
                });
                downloadSuccess = true;
                break;
            } catch (error) {
                console.log(`⚠️ Failed with ${method.name}, trying next...`);
                lastError = error;
            }
        }

        if (!downloadSuccess) {
            const combinedError = (lastError && (lastError.stderr || lastError.message || String(lastError))) || 'Unknown yt-dlp failure';
            const isCookieDbLocked = combinedError.includes('Could not copy Chrome cookie database') || combinedError.includes('Could not copy Edge cookie database');

            console.error('❌ All download methods failed:', lastError);

            if (isCookieDbLocked) {
                throw new Error(
                    `YouTube blocked anonymous download and browser cookies are locked. Close Chrome/Edge fully and retry, or provide ${cookiesFile} (set YTDLP_COOKIES_FILE to override).`
                );
            }

            throw new Error('Failed to download this YouTube URL. If it is public, retry in a few minutes. If gated, provide cookies.txt in node-downloader.');
        }

        // Find the downloaded file (extension might vary)
        const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.startsWith(`video_${timestamp}`));
        
        if (files.length === 0) {
            throw new Error('Download completed but file not found');
        }
        
        const actualFilename = files[0];
        outputPath = path.join(VIDEOS_DIR, actualFilename);
        
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
            if (outputPath && fs.existsSync(outputPath)) {
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
        const command = process.platform === 'win32'
            ? `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F`
            : `lsof -ti:${port} | xargs kill -9`;

        exec(command, (error) => {
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
