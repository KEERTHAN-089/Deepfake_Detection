from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
import cv2
import numpy as np
from pathlib import Path
import json
import os
import shutil
from datetime import datetime
import time
import logging
import torchvision.transforms as T
from PIL import Image
import timm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Deepfake Detection API",
    description="AI-powered deepfake video analysis service",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)
logger.info(f"✅ Created temp directory: {TEMP_DIR.absolute()}")

analysis_results = {}

# --- Firebase Admin / Firestore initialization (optional) ---
firestore_client = None
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth, firestore as firebase_firestore

    # Prefer a service account path from env var, otherwise look for local file
    sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if sa_path and Path(sa_path).exists():
        cred = credentials.Certificate(sa_path)
    else:
        local_sa = Path(__file__).parent / "firebase_service_account.json"
        if local_sa.exists():
            cred = credentials.Certificate(str(local_sa))
        else:
            # Try application default
            cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)
    firestore_client = firebase_firestore.client()
    logger.info("✅ Firebase Admin initialized; Firestore client available")
except Exception as e:
    logger.warning(f"⚠️ Firebase Admin not initialized: {e}")
    firestore_client = None

# ==================== XCEPTION + LSTM MODEL ====================

class XceptionLSTM(nn.Module):
    """
    Xception + LSTM Model for Deepfake Detection
    All-in-one: Direct video processing (no separate feature extraction)
    """
    def __init__(self, num_classes=2, lstm_hidden=512, lstm_layers=2, dropout=0.5):
        super(XceptionLSTM, self).__init__()
        
        # Load Xception model (designed for deepfake detection)
        self.xception = timm.create_model('xception', pretrained=True, num_classes=0)
        xception_dim = self.xception.num_features
        
        # Freeze early layers
        for param in list(self.xception.parameters())[:-20]:
            param.requires_grad = False
        
        # Bi-directional LSTM
        self.lstm = nn.LSTM(
            input_size=xception_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if lstm_layers > 1 else 0
        )
        
        # Classifier
        self.fc = nn.Sequential(
            nn.Linear(lstm_hidden * 2, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_classes)
        )
        
        logger.info(f"✅ XceptionLSTM model initialized")
        logger.info(f"   Xception features: {xception_dim}")
        logger.info(f"   LSTM hidden: {lstm_hidden}, layers: {lstm_layers}")
        logger.info(f"   Total parameters: {sum(p.numel() for p in self.parameters()):,}")
    
    def forward(self, frames):
        # frames shape: (batch, num_frames, C, H, W)
        batch_size, num_frames, C, H, W = frames.shape
        frames = frames.view(batch_size * num_frames, C, H, W)
        
        # Extract features from all frames
        with torch.set_grad_enabled(self.training):
            features = self.xception(frames)
        
        # Reshape to (batch, num_frames, feature_dim)
        features = features.view(batch_size, num_frames, -1)
        
        # LSTM processing
        lstm_out, _ = self.lstm(features)
        final_hidden = lstm_out[:, -1, :]  # Take last hidden state
        
        # Classification
        logits = self.fc(final_hidden)
        return logits

# ==================== LOAD MODEL ====================

MODEL_DIR = Path(__file__).parent.parent / "xception_lstm_20260129_074841"

MODEL_PATH = MODEL_DIR / "best_model.pth"
RESULTS_PATH = MODEL_DIR / "results.json"

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
logger.info(f"🖥️  Using device: {device}")

# Load config from results.json
with open(RESULTS_PATH, 'r') as f:
    results = json.load(f)
    MODEL_CONFIG = results['config']
logger.info(f"✅ Loaded config from: {RESULTS_PATH}")

# Initialize Xception+LSTM model
model = XceptionLSTM(
    num_classes=2,
    lstm_hidden=MODEL_CONFIG['LSTM_HIDDEN'],    # 512
    lstm_layers=MODEL_CONFIG['LSTM_LAYERS'],    # 2
    dropout=MODEL_CONFIG['DROPOUT']             # 0.5
)

# Load trained weights
try:
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.to(device)
    model.eval()
    
    logger.info(f"✅ Xception+LSTM model loaded successfully!")
    logger.info(f"   Model: {MODEL_DIR.name}")
    
except Exception as e:
    logger.error(f"❌ Failed to load model: {e}")
    model = None

MAX_FRAMES = MODEL_CONFIG['MAX_FRAMES']  # 32
IMG_SIZE = MODEL_CONFIG['IMG_SIZE']      # 299
THRESHOLD = MODEL_CONFIG['THRESHOLD']     # 0.45

logger.info(f"⚙️  Model Config - Threshold: {THRESHOLD}, Max Frames: {MAX_FRAMES}, Image Size: {IMG_SIZE}")

# ==================== VIDEO PROCESSING ====================

def extract_frames_from_video(video_path, max_frames, img_size):
    """Extract and preprocess frames from video for Xception model"""
    try:
        cap = cv2.VideoCapture(str(video_path))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        logger.info(f"📹 Video: {total_frames} frames, {fps:.2f} fps, {duration:.2f}s")
        
        if total_frames == 0:
            cap.release()
            return None, {"error": "No frames found in video"}
        
        # Sample frames uniformly
        if total_frames > max_frames:
            indices = np.linspace(0, total_frames - 1, max_frames, dtype=int)
        else:
            indices = list(range(total_frames))
        
        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            
            if ret:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame)
        
        cap.release()
        
        video_info = {
            "total_frames": total_frames,
            "fps": float(fps),
            "duration_seconds": float(duration),
            "frames_extracted": len(frames)
        }
        
        logger.info(f"✅ Extracted {len(frames)} frames")
        return frames, video_info
        
    except Exception as e:
        logger.error(f"❌ Frame extraction error: {e}")
        return None, {"error": str(e)}

def preprocess_frames(frames, max_frames, img_size):
    """Preprocess frames with proper padding for Xception model"""
    transform = T.Compose([
        T.ToPILImage(),
        T.Resize((img_size, img_size)),
        T.ToTensor(),
        T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
    ])
    
    transformed_frames = []
    for frame in frames:
        try:
            transformed_frames.append(transform(frame))
        except:
            continue
    
    num_frames = len(transformed_frames)
    
    if num_frames == 0:
        # If no frames, create dummy frames
        frames_tensor = torch.zeros(max_frames, 3, img_size, img_size)
    elif num_frames < max_frames:
        # Pad with zeros to reach max_frames
        frames_tensor = torch.stack(transformed_frames)
        padding = torch.zeros(max_frames - num_frames, 3, img_size, img_size)
        frames_tensor = torch.cat([frames_tensor, padding], dim=0)
    else:
        # Take exactly max_frames
        frames_tensor = torch.stack(transformed_frames[:max_frames])
    
    return frames_tensor, num_frames

def predict_video(video_path):
    """Predict if video is deepfake using Xception+LSTM"""
    start_time = time.time()
    
    if model is None:
        return {
            "success": False,
            "error": "Model not loaded. Check backend logs for details."
        }
    
    try:
        # Step 1: Extract frames from video
        frames, video_info = extract_frames_from_video(video_path, MAX_FRAMES, IMG_SIZE)
        
        if frames is None:
            return {
                "success": False,
                "error": video_info.get("error", "Failed to extract frames")
            }
        
        # Step 2: Preprocess frames for Xception model
        logger.info(f"🔧 Preprocessing {len(frames)} frames for Xception...")
        frames_tensor, num_valid_frames = preprocess_frames(frames, MAX_FRAMES, IMG_SIZE)
        
        # Step 3: Add batch dimension and move to device
        frames_tensor = frames_tensor.unsqueeze(0).to(device)  # (1, MAX_FRAMES, 3, IMG_SIZE, IMG_SIZE)
        
        logger.info(f"✅ Frames shape: {frames_tensor.shape}")
        
        # Step 4: Model prediction
        logger.info("🤖 Running Xception+LSTM inference...")
        with torch.no_grad():
            output = model(frames_tensor)  # (1, 2)
            probabilities = torch.softmax(output, dim=1)
            
            prob_real = probabilities[0, 0].item()  # class 0 = REAL
            prob_fake = probabilities[0, 1].item()  # class 1 = FAKE
        
        # Step 5: Determine prediction based on threshold
        if prob_fake >= THRESHOLD:
            prediction = "FAKE"
            confidence = prob_fake
        else:
            prediction = "REAL"
            confidence = prob_real
        
        processing_time = (time.time() - start_time) * 1000
        
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
            "processing_time_ms": round(processing_time, 2),
            "model_version": "Xception-LSTM-v2.0",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"✅ Prediction: {result['prediction']} ({result['confidence']:.2f}%)")
        logger.info(f"   Real: {prob_real*100:.2f}% | Fake: {prob_fake*100:.2f}%")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }

# ==================== API ROUTES ====================

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "deepfake-detection",
        "version": "2.0.0",
        "model_loaded": model is not None,
        "device": str(device),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model": "Xception-LSTM",
        "device": str(device),
        "threshold": THRESHOLD,
        "model_loaded": model is not None,
        "max_frames": MAX_FRAMES,
        "img_size": IMG_SIZE,
        "message": "Deepfake Detection API is running with Xception-LSTM"
    }

@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """Analyze uploaded video for deepfake detection - NO TIMEOUT"""
    logger.info(f"📥 Received file: {file.filename}")
    
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded or filename is missing")
    
    allowed_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm']
    file_ext = Path(file.filename).suffix.lower()
    
    # If no extension, try to detect from content-type or assume mp4
    if not file_ext:
        content_type = file.content_type or ""
        if "video" in content_type:
            file_ext = ".mp4"  # Default to mp4 if no extension but is video
            logger.info(f"⚠️ No file extension, using default: {file_ext}")
        else:
            raise HTTPException(
                status_code=400,
                detail=f"File has no extension and content-type is: {content_type}"
            )
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    temp_file_path = None
    
    try:
        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"video_{timestamp}{file_ext}"
        temp_file_path = TEMP_DIR / safe_filename
        
        logger.info(f"💾 Saving file to: {temp_file_path}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size_mb = temp_file_path.stat().st_size / (1024 * 1024)
        logger.info(f"📊 File size: {file_size_mb:.2f}MB")
        
        # Run analysis
        analysis_result = predict_video(str(temp_file_path))
        
        # Always add metadata and store result (even if error)
        analysis_result['filename'] = file.filename
        analysis_result['file_size_mb'] = round(file_size_mb, 2)
        analysis_result['id'] = timestamp
        
        # Store result for later retrieval
        analysis_results[timestamp] = analysis_result
        
        if analysis_result.get('success'):
            logger.info(f"✅ Analysis complete for: {file.filename}")
            logger.info(f"📊 Result ID: {timestamp}")
        else:
            logger.error(f"❌ Analysis failed for: {file.filename}")
            logger.error(f"📊 Error: {analysis_result.get('error', 'Unknown error')}")
        
        return JSONResponse(content=analysis_result)
    
    except Exception as e:
        logger.error(f"❌ Error processing video: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")
    
    finally:
        # Cleanup temp file
        if temp_file_path and temp_file_path.exists():
            try:
                os.unlink(temp_file_path)
                logger.info(f"🗑️  Deleted temp file: {temp_file_path}")
            except Exception as e:
                logger.warning(f"⚠️  Could not delete temp file: {e}")

@app.get("/result/{result_id}")
async def get_result(result_id: str):
    """Get analysis result by ID"""
    logger.info(f"🔍 Looking for result ID: {result_id}")
    logger.info(f"📊 Available result IDs: {list(analysis_results.keys())}")
    
    if result_id in analysis_results:
        logger.info(f"✅ Result found in memory for ID: {result_id}")
        return JSONResponse(content=analysis_results[result_id])

    # Fallback: search Firestore
    if firestore_client:
        try:
            logger.info(f"🔎 Searching Firestore for result ID: {result_id}")
            docs = firestore_client.collection("histories").where("data.id", "==", result_id).limit(1).stream()
            for d in docs:
                doc_data = d.to_dict()
                result_data = doc_data.get("data", doc_data)
                logger.info(f"✅ Result found in Firestore for ID: {result_id}")
                return JSONResponse(content=result_data)
        except Exception as e:
            logger.warning(f"⚠️ Firestore lookup failed: {e}")

    logger.error(f"❌ Result not found for ID: {result_id}")
    raise HTTPException(
        status_code=404,
        detail=f"Result not found for ID: {result_id}"
    )

@app.get("/results")
async def list_results():
    """List all analysis results"""
    results_list = []
    for result_id, result_data in analysis_results.items():
        # Make sure each result has the result_id field
        result_copy = result_data.copy()
        result_copy['result_id'] = result_id
        results_list.append(result_copy)
    
    return JSONResponse(content={
        "count": len(results_list),
        "results": results_list
    })


@app.post("/history")
async def save_history(request: Request, authorization: str = Header(None)):
    """Save analysis result to Firestore (requires Firebase ID token) or fall back to in-memory storage."""
    payload = await request.json()

    # If Firestore is configured, require and verify ID token
    if firestore_client:
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing Authorization header")

        try:
            token = authorization.split(" ", 1)[1] if authorization.lower().startswith("bearer ") else authorization
            decoded = firebase_auth.verify_id_token(token)
            uid = decoded.get("uid")
        except Exception as e:
            logger.warning(f"⚠️ Token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        # Prepare document
        doc = {
            "user_id": uid,
            "data": payload,
            "created_at": datetime.now().isoformat()
        }

        try:
            doc_ref = firestore_client.collection("histories").add(doc)
            # doc_ref returns (write_result, ref)
            doc_id = None
            try:
                doc_id = doc_ref[1].id
            except Exception:
                doc_id = None

            return JSONResponse(content={"saved": True, "doc_id": doc_id})
        except Exception as e:
            logger.error(f"❌ Failed to save history to Firestore: {e}")
            raise HTTPException(status_code=500, detail="Failed to save history")

    # Fallback: store in-memory if an `id` is provided in payload
    if payload and isinstance(payload, dict) and payload.get("id"):
        analysis_results[payload["id"]] = payload
        return JSONResponse(content={"saved": True, "storage": "memory", "id": payload.get("id")})

    raise HTTPException(status_code=501, detail="Firestore not configured and no id provided for in-memory storage")


@app.get("/history")
async def get_history(authorization: str = Header(None)):
    """Fetch user's history from Firestore (requires Firebase ID token)."""
    if not firestore_client:
        # Fallback: return all in-memory results
        results_list = []
        for result_id, result_data in analysis_results.items():
            rr = result_data.copy()
            rr["result_id"] = result_id
            results_list.append(rr)
        return JSONResponse(content={"count": len(results_list), "results": results_list})

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        token = authorization.split(" ", 1)[1] if authorization.lower().startswith("bearer ") else authorization
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get("uid")
    except Exception as e:
        logger.warning(f"⚠️ Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        # Simple query without order_by to avoid requiring a composite index
        q = firestore_client.collection("histories").where("user_id", "==", uid).limit(200)
        docs = q.stream()
        items = []
        for d in docs:
            data = d.to_dict()
            data["doc_id"] = d.id
            items.append(data)

        # Sort in Python by created_at descending
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        return JSONResponse(content={"count": len(items), "results": items})
    except Exception as e:
        logger.error(f"❌ Failed to fetch history from Firestore: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")


if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting Deepfake Detection API...")
    logger.info(f"📊 Model: Xception-LSTM | Device: {device}")
    logger.info(f"📊 Config: {MAX_FRAMES} frames @ {IMG_SIZE}x{IMG_SIZE}, threshold: {THRESHOLD}")
    logger.info("📡 Available endpoints: /, /health, /analyze, /result/{id}, /results")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        log_level="info",
        timeout_keep_alive=0,  # Unlimited keep-alive timeout
        timeout_graceful_shutdown=None  # No timeout for graceful shutdown
    )
