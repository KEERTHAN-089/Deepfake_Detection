---
title: DeepScan API
emoji: 🔍
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# DeepScan API

FastAPI backend for [DeepScan](https://deepfake-auth-e79a8-b4ffa.web.app), a deepfake video detector.
It samples 32 frames per video, encodes them with Xception and scores them with a bidirectional LSTM.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Service and model status |
| `POST /analyze` | Analyze an uploaded video (`file` form field) |
| `POST /analyze-url` | Download a video from a public link (`{"url": "..."}`) and analyze it |
| `GET /result/{id}` | Fetch one of your saved results (Firebase sign-in required) |
| `GET /history` | List your saved results (Firebase sign-in required) |

Source code: https://github.com/KEERTHAN-089/Deepfake_Detection
