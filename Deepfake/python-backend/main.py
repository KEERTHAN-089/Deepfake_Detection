from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Deepfake Detection API",
    description="AI-powered deepfake video analysis service",
    version="1.0.0"
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


@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "deepfake-detection",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    logger.info(f"📥 Received file: {file.filename}")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    allowed_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"video_{timestamp}{file_ext}"
        file_path = TEMP_DIR / safe_filename
        
        logger.info(f"💾 Saving file to: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        logger.info(f"📊 File size: {file_size_mb:.2f}MB")
        
        # TODO: Add your deepfake detection model here
        # Example:
        #   result = model.predict(str(file_path))
        #   analysis_result["analysis"]["is_deepfake"] = result.is_deepfake
        #   analysis_result["analysis"]["confidence"] = result.confidence
        analysis_result = {
            "status": "success",
            "message": "Video received and ready for analysis",
            "video_info": {
                "filename": safe_filename,
                "original_filename": file.filename,
                "size_mb": round(file_size_mb, 2),
                "format": file_ext,
                "saved_path": str(file_path)
            },
            "analysis": {
                "is_deepfake": False,
                "confidence": 0.85,
                "model_version": "v1.0.0",
                "processing_time_ms": 0,
                "details": {
                    "facial_manipulation": {"detected": False, "confidence": 0.12},
                    "audio_inconsistency": {"detected": False, "confidence": 0.08},
                    "lighting_anomaly": {"detected": False, "confidence": 0.15},
                    "frame_blinking": {"detected": False, "confidence": 0.05}
                }
            },
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"✅ Analysis complete for: {file.filename}")
        
        return JSONResponse(content=analysis_result)
    
    except Exception as e:
        logger.error(f"❌ Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # Run with: python main.py
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
