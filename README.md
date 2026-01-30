# Deepfake Detection Web App

End-to-end deepfake detection system:

- React + Firebase authentication frontend
- Node.js + yt-dlp video downloader/bridge
- FastAPI backend for model inference

GitHub repository: `https://github.com/KEERTHAN-089/Deepfake_Detection`

## Monorepo layout

- `Deepfake/deepfake-frontend` – React + Firebase auth + UI
- `Deepfake/node-downloader` – Node.js + Express + yt-dlp video downloader
- `Deepfake/python-backend` – FastAPI backend to receive and analyze videos

## Backend endpoints

### Node downloader (http://localhost:3001)

- `GET /health` – service health
- `POST /download` – body: `{ "videoUrl": "<YouTube_or_Instagram_URL>" }`
- `GET /videos` – list downloaded videos
- `GET /videos/stream/:filename` – stream a video (used by frontend player)
- `GET /videos/download/:filename` – download a video file

### Python backend (http://localhost:8000)

- `GET /` – health/status
- `POST /analyze` – accepts a video file (`file` field, `UploadFile`) and returns analysis JSON

## Run locally

```bash
# 1. Python backend (FastAPI)
cd Deepfake/python-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
# or: python -m uvicorn main:app --host 0.0.0.0 --port 8000

# 2. Node downloader (Express + yt-dlp)
cd ../../Deepfake/node-downloader
npm install
npm start
# service runs at http://localhost:3001

# 3. Frontend (Vite + React)
cd ../deepfake-frontend
npm install
npm run dev
# app runs at http://localhost:5174
```

## Troubleshooting

### SSL Certificate Error (CERTIFICATE_VERIFY_FAILED)

If you encounter SSL certificate verification errors:

**Cause:** Corporate proxy, antivirus software (Avast, AVG, Kaspersky), or firewall intercepting HTTPS traffic.

**Solutions:**

```bash
# Option 1: Update yt-dlp and Python certifi
pip install -U yt-dlp certifi

# Option 2: Temporarily disable antivirus SSL scanning
# Check your antivirus settings for "HTTPS scanning" or "SSL scanning"

# Option 3: Use system certificates (Windows)
pip install python-certifi-win32

# Option 4: Update Python's CA certificates
python -m pip install --upgrade certifi
```

**The app already uses `--no-check-certificate` as a workaround**, but for security, it's better to fix the root cause.

### YouTube download issues (HTTP 403 / Empty file)

If you encounter YouTube download errors:

```bash
# 1. Update yt-dlp to latest version
pip install -U yt-dlp

# 2. (Optional) Install JavaScript runtime for better YouTube support
# Windows (via Chocolatey):
choco install nodejs

# Or download from: https://nodejs.org/

# 3. Alternative: Use cookies for age-restricted/member-only videos
# Export cookies from browser and use: --cookies cookies.txt
```

**Note:** Some YouTube videos (especially Shorts) may have stricter protections. Try:
- Regular YouTube videos instead of Shorts
- Public, non-restricted videos
- Alternative video platforms (direct MP4 links work best)
