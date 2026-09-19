# DeepScan: Deepfake Detection Web App

Upload a video or paste a link, and DeepScan scores how likely it is to be a deepfake.

- **Frontend:** React + Vite + Tailwind, with Firebase Authentication.
- **Backend:** FastAPI + PyTorch. An Xception network encodes 32 sampled frames and a bidirectional LSTM scores them. Links are downloaded with the yt-dlp library.
- **Storage:** signed-in users' results are saved to Firestore.

GitHub repository: `https://github.com/KEERTHAN-089/Deepfake_Detection`

## Repository layout

- `Deepfake/deepfake-frontend`: React app, deployed to Firebase Hosting.
- `Deepfake/python-backend`: FastAPI API, deployed to a Hugging Face Docker Space.
- `Deepfake/node-downloader`: **deprecated.** Link downloads now happen in the Python backend. Kept only for the local Videos page.
- `Deepfake/xception_lstm_*`: trained model. Gitignored, because `best_model.pth` is 152 MB.

## API (Python backend)

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Service and model status |
| `POST /analyze` | Analyze an uploaded video (`file` form field) |
| `POST /analyze-url` | Download a video from a public link (`{"url": "..."}`) and analyze it |
| `GET /result/{id}` | One of your saved results (Firebase ID token required) |
| `GET /history` | Your saved results (Firebase ID token required) |

Signed-in callers send `Authorization: Bearer <Firebase ID token>`, and their results are saved to history automatically.

### Backend settings (environment variables)

| Variable | Default | Purpose |
| --- | --- | --- |
| `MODEL_DIR` | `../xception_lstm_20260129_074841` | Folder with `best_model.pth` and `results.json` |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated origins allowed by CORS |
| `MAX_UPLOAD_MB` | `200` | Largest accepted upload or download |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | none | Service-account key content (used on the server) |
| `FIREBASE_SERVICE_ACCOUNT` | none | Path to the key file (local alternative) |
| `YTDLP_NO_CHECK_CERT` | off | Skip TLS checks for downloads. Local use only, for antivirus HTTPS scanning |

## Run locally

```bash
# 1. Backend (http://localhost:8000)
cd Deepfake/python-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# 2. Frontend (http://localhost:3000)
cd ../deepfake-frontend
npm install
npm run dev
```

Put the Firebase service-account key at `Deepfake/python-backend/firebase_service_account.json` to enable history. It is gitignored.
YouTube links need a JavaScript runtime: [Deno](https://deno.com) or Node.js 20+.

## Deploy

**Backend: Hugging Face Space.**

```bash
cd Deepfake/python-backend
huggingface-cli login          # needs a token with write access
python deploy_space.py         # uploads code + model, sets secrets, prints the API URL
```

**Frontend: Firebase Hosting.** Put the API URL in `Deepfake/deepfake-frontend/.env.production` as `VITE_API_URL`, then:

```bash
cd Deepfake/deepfake-frontend
npm run build
npx firebase-tools login       # once
npx firebase-tools deploy --only hosting
```

The site is served at `https://deepfake-auth-e79a8-b4ffa.web.app`.

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

As a last resort for local use only, set `YTDLP_NO_CHECK_CERT=1` before starting the backend. Fixing the root cause is safer.

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
