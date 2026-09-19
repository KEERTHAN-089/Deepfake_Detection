import asyncio
import ipaddress
import json
import logging
import os
import re
import socket
import time
from collections import OrderedDict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

import cv2
import numpy as np
import timm
import torch
import torch.nn as nn
import torchvision.transforms as T
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent

# ==================== CONFIG (environment) ====================

MODEL_DIR = Path(os.environ.get("MODEL_DIR", BASE_DIR.parent / "xception_lstm_20260129_074841"))
TEMP_DIR = Path(os.environ.get("TEMP_DIR", BASE_DIR / "temp"))
MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "200"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()
]
# Only for local machines whose antivirus intercepts HTTPS; never enable on a server.
YTDLP_NO_CHECK_CERT = os.environ.get("YTDLP_NO_CHECK_CERT", "").lower() in ("1", "true", "yes")
RESULT_CACHE_SIZE = 200
ALLOWED_EXTENSIONS = [".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm"]

TEMP_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Deepfake Detection API",
    description="AI-powered deepfake video analysis service",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # auth uses bearer tokens, not cookies
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
logger.info(f"🌐 CORS origins: {ALLOWED_ORIGINS}")

# ==================== FIREBASE (optional) ====================

firestore_client = None
firebase_auth = None
try:
    import firebase_admin
    from firebase_admin import auth as _firebase_auth
    from firebase_admin import credentials
    from firebase_admin import firestore as firebase_firestore

    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    local_sa = BASE_DIR / "firebase_service_account.json"
    if sa_json:
        cred = credentials.Certificate(json.loads(sa_json))
    elif sa_path and Path(sa_path).exists():
        cred = credentials.Certificate(sa_path)
    elif local_sa.exists():
        cred = credentials.Certificate(str(local_sa))
    else:
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)
    firestore_client = firebase_firestore.client()
    firebase_auth = _firebase_auth
    logger.info("✅ Firebase Admin initialized; Firestore client available")
except Exception as e:
    logger.warning(f"⚠️ Firebase Admin not initialized (sign-in features disabled): {e}")

AUTH_ENABLED = firebase_auth is not None

# ==================== XCEPTION + LSTM MODEL ====================


class XceptionLSTM(nn.Module):
    """Xception frame encoder followed by a bidirectional LSTM over the frame sequence."""

    def __init__(self, num_classes=2, lstm_hidden=512, lstm_layers=2, dropout=0.5):
        super().__init__()

        # pretrained=False: every weight is overwritten by the trained checkpoint below,
        # so skipping the ImageNet download gives the same model with a faster, offline startup.
        self.xception = timm.create_model("xception", pretrained=False, num_classes=0)
        xception_dim = self.xception.num_features

        for param in list(self.xception.parameters())[:-20]:
            param.requires_grad = False

        self.lstm = nn.LSTM(
            input_size=xception_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if lstm_layers > 1 else 0,
        )

        self.fc = nn.Sequential(
            nn.Linear(lstm_hidden * 2, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_classes),
        )

        logger.info("✅ XceptionLSTM model initialized")
        logger.info(f"   Xception features: {xception_dim}")
        logger.info(f"   LSTM hidden: {lstm_hidden}, layers: {lstm_layers}")

    def forward(self, frames):
        batch_size, num_frames, C, H, W = frames.shape
        frames = frames.view(batch_size * num_frames, C, H, W)
        with torch.set_grad_enabled(self.training):
            features = self.xception(frames)
        features = features.view(batch_size, num_frames, -1)
        lstm_out, _ = self.lstm(features)
        return self.fc(lstm_out[:, -1, :])


# ==================== LOAD MODEL ====================

MODEL_PATH = MODEL_DIR / "best_model.pth"
RESULTS_PATH = MODEL_DIR / "results.json"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"🖥️  Using device: {device}")

with open(RESULTS_PATH, "r") as f:
    MODEL_CONFIG = json.load(f)["config"]
logger.info(f"✅ Loaded config from: {RESULTS_PATH}")

model = XceptionLSTM(
    num_classes=2,
    lstm_hidden=MODEL_CONFIG["LSTM_HIDDEN"],
    lstm_layers=MODEL_CONFIG["LSTM_LAYERS"],
    dropout=MODEL_CONFIG["DROPOUT"],
)

try:
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    state = checkpoint["model_state_dict"] if "model_state_dict" in checkpoint else checkpoint
    model.load_state_dict(state)
    model.to(device)
    model.eval()
    logger.info(f"✅ Xception+LSTM model loaded from {MODEL_DIR}")
except Exception as e:
    logger.error(f"❌ Failed to load model: {e}")
    model = None

MAX_FRAMES = MODEL_CONFIG["MAX_FRAMES"]
IMG_SIZE = MODEL_CONFIG["IMG_SIZE"]
THRESHOLD = MODEL_CONFIG["THRESHOLD"]
logger.info(f"⚙️  Threshold: {THRESHOLD}, Max Frames: {MAX_FRAMES}, Image Size: {IMG_SIZE}")

# ==================== VIDEO PROCESSING ====================


def extract_frames_from_video(video_path, max_frames):
    """Sample up to max_frames frames uniformly across the video."""
    try:
        cap = cv2.VideoCapture(str(video_path))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0

        if total_frames <= 0:
            cap.release()
            return None, {"error": "No frames found in video"}

        if total_frames > max_frames:
            indices = np.linspace(0, total_frames - 1, max_frames, dtype=int)
        else:
            indices = list(range(total_frames))

        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        cap.release()

        return frames, {
            "total_frames": total_frames,
            "fps": float(fps),
            "duration_seconds": float(duration),
        }
    except Exception as e:
        logger.error(f"❌ Frame extraction error: {e}")
        return None, {"error": str(e)}


_transform = T.Compose(
    [
        T.ToPILImage(),
        T.Resize((IMG_SIZE, IMG_SIZE)),
        T.ToTensor(),
        T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
    ]
)


def preprocess_frames(frames, max_frames, img_size):
    """Transform frames and zero-pad the sequence to max_frames."""
    transformed = []
    for frame in frames:
        try:
            transformed.append(_transform(frame))
        except Exception:
            continue

    n = len(transformed)
    if n == 0:
        return torch.zeros(max_frames, 3, img_size, img_size), 0
    tensor = torch.stack(transformed[:max_frames])
    if n < max_frames:
        tensor = torch.cat([tensor, torch.zeros(max_frames - n, 3, img_size, img_size)], dim=0)
    return tensor, min(n, max_frames)


def predict_video(video_path):
    """Run the model on one video file. Blocking; call it from a worker thread."""
    start_time = time.time()
    if model is None:
        return {"success": False, "error": "Model not loaded. Check backend logs for details."}

    try:
        frames, video_info = extract_frames_from_video(video_path, MAX_FRAMES)
        if frames is None:
            return {"success": False, "error": video_info.get("error", "Failed to extract frames")}
        if not frames:
            return {"success": False, "error": "Could not read any frames from this video."}

        frames_tensor, num_valid_frames = preprocess_frames(frames, MAX_FRAMES, IMG_SIZE)
        frames_tensor = frames_tensor.unsqueeze(0).to(device)

        with torch.no_grad():
            probabilities = torch.softmax(model(frames_tensor), dim=1)
            prob_real = probabilities[0, 0].item()
            prob_fake = probabilities[0, 1].item()

        if prob_fake >= THRESHOLD:
            prediction, confidence = "FAKE", prob_fake
        else:
            prediction, confidence = "REAL", prob_real

        result = {
            "success": True,
            "prediction": prediction,
            "confidence": round(confidence * 100, 2),
            "fake_probability": round(prob_fake * 100, 2),
            "real_probability": round(prob_real * 100, 2),
            "threshold": float(THRESHOLD * 100),
            "video_info": {
                "frames_analyzed": num_valid_frames,
                "total_frames": video_info["total_frames"],
                "fps": round(video_info["fps"], 2),
                "duration": round(video_info["duration_seconds"], 2),
            },
            "processing_time_ms": round((time.time() - start_time) * 1000, 2),
            "model_version": "Xception-LSTM-v2.0",
            "timestamp": datetime.now().isoformat(),
        }
        logger.info(f"✅ Prediction: {prediction} (fake {prob_fake * 100:.2f}%)")
        return result
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


# ==================== AUTH + STORAGE HELPERS ====================

# id -> {"owner": uid or None, "data": result}. Bounded so memory can't grow forever.
analysis_results: "OrderedDict[str, dict]" = OrderedDict()

# One inference at a time: keeps CPU/RAM bounded while the event loop stays free.
INFERENCE_LOCK = asyncio.Semaphore(1)


def _verify_token(authorization):
    if not authorization:
        return None
    token = authorization.split(" ", 1)[1] if authorization.lower().startswith("bearer ") else authorization
    try:
        return firebase_auth.verify_id_token(token).get("uid")
    except Exception as e:
        logger.warning(f"⚠️ Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")


def optional_uid(authorization):
    """Returns the caller's uid when a valid token is sent, None for anonymous callers."""
    if not AUTH_ENABLED:
        return None
    return _verify_token(authorization)


def required_uid(authorization):
    if not AUTH_ENABLED:
        raise HTTPException(status_code=503, detail="Sign-in is not configured on this server.")
    uid = _verify_token(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail="Please sign in to view saved results.")
    return uid


def new_result_id():
    return f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}"


def remember(result, uid):
    analysis_results[result["id"]] = {"owner": uid, "data": result}
    while len(analysis_results) > RESULT_CACHE_SIZE:
        analysis_results.popitem(last=False)


def save_history(result, uid):
    """Stores a signed-in user's result in Firestore. Failures are logged, not fatal."""
    if not (firestore_client and uid):
        return
    try:
        firestore_client.collection("histories").add(
            {"user_id": uid, "data": result, "created_at": datetime.now().isoformat()}
        )
    except Exception as e:
        logger.error(f"❌ Failed to save history to Firestore: {e}")


async def run_analysis(video_path: Path, display_name: str, uid):
    size_mb = video_path.stat().st_size / (1024 * 1024)
    async with INFERENCE_LOCK:
        result = await run_in_threadpool(predict_video, str(video_path))
    if not result.get("success"):
        raise HTTPException(status_code=422, detail=result.get("error") or "Analysis failed.")

    result["filename"] = display_name
    result["file_size_mb"] = round(size_mb, 2)
    result["id"] = new_result_id()
    remember(result, uid)
    await run_in_threadpool(save_history, result, uid)
    return result


def remove_quietly(path):
    try:
        if path and Path(path).exists():
            os.unlink(path)
    except Exception as e:
        logger.warning(f"⚠️ Could not delete temp file {path}: {e}")


# ==================== URL DOWNLOAD ====================


def assert_public_url(url: str):
    """Rejects non-http(s) URLs and hosts that resolve to private or local addresses."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Enter a full link starting with http:// or https://.")
    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="That website address could not be found.")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise HTTPException(status_code=400, detail="Links to private or local addresses are not allowed.")


_ANSI = re.compile(r"\x1b\[[0-9;]*m")


def download_video(url: str, stem: str):
    """Downloads one video with the yt-dlp library (no shell). Returns (path, title)."""
    import yt_dlp

    opts = {
        "outtmpl": str(TEMP_DIR / f"{stem}.%(ext)s"),
        # The model only needs frames: prefer a video-only stream up to 720p (no audio merge needed).
        "format": "bv*[height<=720][ext=mp4]/bv*[height<=720]/b[height<=720]/bv*/b",
        # YouTube requires a JavaScript runtime to solve its player challenges.
        "js_runtimes": {"deno": {}, "node": {}},
        "noplaylist": True,
        "max_filesize": MAX_UPLOAD_BYTES,
        "socket_timeout": 30,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "overwrites": True,
        "nocheckcertificate": YTDLP_NO_CHECK_CERT,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
    files = sorted(TEMP_DIR.glob(f"{stem}.*"))
    files = [f for f in files if f.suffix not in (".part", ".ytdl")]
    if not files:
        raise HTTPException(
            status_code=413,
            detail=f"The video is larger than {MAX_UPLOAD_MB} MB or could not be downloaded.",
        )
    title = (info or {}).get("title") or "Downloaded video"
    ext = files[0].suffix or ".mp4"
    return files[0], f"{title}{ext}"


class UrlRequest(BaseModel):
    url: str


# ==================== API ROUTES ====================


@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "deepfake-detection",
        "version": app.version,
        "model_loaded": model is not None,
        "device": str(device),
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model": "Xception-LSTM",
        "model_loaded": model is not None,
        "auth_enabled": AUTH_ENABLED,
        "threshold": THRESHOLD,
        "max_frames": MAX_FRAMES,
        "max_upload_mb": MAX_UPLOAD_MB,
    }


@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...), authorization: str = Header(None)):
    """Analyze an uploaded video. Signed-in callers get the result saved to their history."""
    uid = optional_uid(authorization)
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded or filename is missing.")

    file_ext = Path(file.filename).suffix.lower()
    if not file_ext:
        if "video" not in (file.content_type or ""):
            raise HTTPException(status_code=400, detail="That file doesn't look like a video.")
        file_ext = ".mp4"
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    temp_path = TEMP_DIR / f"upload_{uuid4().hex}{file_ext}"
    try:
        TEMP_DIR.mkdir(parents=True, exist_ok=True)
        written = 0
        with open(temp_path, "wb") as out:
            while chunk := await file.read(1024 * 1024):
                written += len(chunk)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail=f"Videos must be {MAX_UPLOAD_MB} MB or smaller.")
                out.write(chunk)

        logger.info(f"📥 Analyzing upload {file.filename} ({written / 1048576:.2f} MB)")
        return JSONResponse(content=await run_analysis(temp_path, file.filename, uid))
    finally:
        remove_quietly(temp_path)


@app.post("/analyze-url")
async def analyze_url(body: UrlRequest, authorization: str = Header(None)):
    """Download a video from a public link with yt-dlp, then analyze it."""
    uid = optional_uid(authorization)
    url = body.url.strip()
    await run_in_threadpool(assert_public_url, url)

    stem = f"url_{uuid4().hex}"
    path = None
    try:
        import yt_dlp

        try:
            path, display_name = await run_in_threadpool(download_video, url, stem)
        except yt_dlp.utils.DownloadError as e:
            message = _ANSI.sub("", str(e)).replace("ERROR: ", "").strip()
            logger.warning(f"⚠️ yt-dlp failed for {url}: {message}")
            raise HTTPException(status_code=400, detail=f"Could not download that video. {message}")

        logger.info(f"🔗 Analyzing download {display_name}")
        return JSONResponse(content=await run_analysis(path, display_name, uid))
    finally:
        remove_quietly(path)
        for leftover in TEMP_DIR.glob(f"{stem}.*"):
            remove_quietly(leftover)


@app.get("/result/{result_id}")
async def get_result(result_id: str, authorization: str = Header(None)):
    """Return one of the caller's own results."""
    if not AUTH_ENABLED:
        # Local development without Firebase: in-memory results only.
        entry = analysis_results.get(result_id)
        if entry:
            return JSONResponse(content=entry["data"])
        raise HTTPException(status_code=404, detail="Result not found.")

    uid = required_uid(authorization)
    entry = analysis_results.get(result_id)
    if entry and entry["owner"] == uid:
        return JSONResponse(content=entry["data"])

    if firestore_client:
        try:
            docs = (
                firestore_client.collection("histories")
                .where("user_id", "==", uid)
                .where("data.id", "==", result_id)
                .limit(1)
                .stream()
            )
            for d in docs:
                return JSONResponse(content=d.to_dict().get("data", {}))
        except Exception as e:
            logger.warning(f"⚠️ Firestore lookup failed: {e}")

    raise HTTPException(status_code=404, detail="Result not found.")


@app.get("/history")
async def get_history(authorization: str = Header(None)):
    """Return the caller's saved analyses, newest first."""
    if not firestore_client:
        raise HTTPException(status_code=503, detail="History storage is not configured on this server.")
    uid = required_uid(authorization)

    def load():
        items = []
        for d in firestore_client.collection("histories").where("user_id", "==", uid).limit(200).stream():
            data = d.to_dict()
            data["doc_id"] = d.id
            items.append(data)
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items

    try:
        items = await run_in_threadpool(load)
    except Exception as e:
        logger.error(f"❌ Failed to fetch history from Firestore: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history.")
    return JSONResponse(content={"count": len(items), "results": items})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), log_level="info")
