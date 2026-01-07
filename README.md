# Deepfake Detection Web App

Monorepo layout:

- `Deepfake/deepfake-frontend` – React + Firebase auth + UI
- `Deepfake/node-downloader` – Node.js + Express + yt-dlp video downloader
- `Deepfake/python-backend` – FastAPI backend to receive and analyze videos

## Run locally

```bash
# 1. Python backend
cd Deepfake/python-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# 2. Node downloader
cd ../../Deepfake/node-downloader
npm install
npm start

# 3. Frontend
cd ../deepfake-frontend
npm install
npm run dev
```
