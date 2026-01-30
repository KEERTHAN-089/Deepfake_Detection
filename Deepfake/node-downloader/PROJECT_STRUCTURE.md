# Project Structure & Architecture Documentation

## 📁 Folder Structure

```
node-downloader/
├── src/
│   ├── controllers/
│   │   └── video.controller.js      # Video endpoints logic
│   ├── middlewares/
│   │   └── error.middleware.js      # Global error handling
│   ├── models/
│   │   └── video.model.js           # Mongoose schema (skeleton)
│   ├── routes/
│   │   └── video.routes.js          # API routes
│   ├── utils/
│   │   ├── asyncHandler.js          # Async error wrapper
│   │   ├── apiError.js              # Custom error class
│   │   ├── apiResponse.js           # Response formatter
│   │   └── videoDownloader.js       # Video download utilities
│   ├── db/
│   │   └── connect.js               # Database connection (skeleton)
│   └── index.js                     # Main app server
├── videos/                          # Downloaded videos storage
├── package.json                     # Dependencies
├── .env.example                     # Environment template
├── index.js                         # Entry point (legacy - use src/index.js)
└── utils/
    └── videoDownloader.js           # Legacy (moved to src/utils/)
```

## 🎯 Architecture Overview

### **Utilities (src/utils/)**
- **asyncHandler.js**: Wrapper for async middleware/controllers to catch errors automatically
- **apiError.js**: Custom error class for standardized error responses
- **apiResponse.js**: Standardized response format for all endpoints
- **videoDownloader.js**: Video downloading and metadata extraction using yt-dlp

### **Controllers (src/controllers/)**
- **video.controller.js**: Handles all video operations
  - `downloadAndAnalyzeVideo()` - Download video and send to Python backend
  - `streamVideo()` - Stream video with range request support
  - `downloadVideoFile()` - Download video file
  - `healthCheck()` - Service health status

### **Middlewares (src/middlewares/)**
- **error.middleware.js**: Global error handling
  - `globalErrorHandler()` - Catches all errors and returns standardized responses
  - `notFoundHandler()` - Handles 404 routes

### **Models (src/models/)**
- **video.model.js**: Mongoose model skeleton for video metadata storage (ready to enable)

### **Database (src/db/)**
- **connect.js**: MongoDB connection setup (skeleton, ready to enable)

### **Routes (src/routes/)**
- **video.routes.js**: All video endpoints
  - `POST /api/video/download` - Download & analyze
  - `GET /api/video/stream/:filename` - Stream video
  - `GET /api/video/download/:filename` - Download file
  - `GET /api/video/health` - Health check

## 📡 API Endpoints

### Health Check
```
GET /api/video/health
Response: { success: true, data: { status: 'healthy', ... }, message: 'Service is healthy' }
```

### Download & Analyze Video
```
POST /api/video/download
Body: { "videoUrl": "https://..." }
Response: { success: true, data: { videoInfo: {...}, analysis: {...} }, message: "Video analyzed successfully" }
```

### Stream Video
```
GET /api/video/stream/:filename
Supports HTTP Range requests for seeking
```

### Download Video File
```
GET /api/video/download/:filename
```

## 🔄 Request Flow

1. **Frontend** → Sends video URL to `/download`
2. **Node Backend** → 
   - Downloads video using yt-dlp
   - Extracts metadata (duration, size)
   - Reads file into buffer
3. **Python Backend** → Analyzes video for deepfake patterns
4. **Node Backend** → Returns analysis results to frontend

## 🛡️ Error Handling

All errors:
- Are caught by `asyncHandler` wrapper
- Converted to `ApiError` instances
- Handled by `globalErrorHandler` middleware
- Return standardized error responses with statusCode, message, and errors array

## 🔧 Configuration

Environment variables in `.env`:
- `NODE_ENV` - Development/Production
- `PORT` - Server port (default: 3001)
- `PYTHON_BACKEND_URL` - Python FastAPI backend URL
- `MONGODB_URI` - MongoDB connection (optional)

## 🚀 Usage

### Start the Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

### Make Requests
```bash
# Download & analyze video
curl -X POST http://localhost:3001/api/video/download \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"https://example.com/video.mp4"}'

# Check health
curl http://localhost:3001/api/video/health
```

## 📦 Dependencies

- **express**: Web framework
- **cors**: CORS middleware
- **axios**: HTTP client for Python backend
- **form-data**: FormData for multipart requests
- **dotenv**: Environment variables
- **yt-dlp**: Video downloading
- **ffprobe**: Video metadata extraction

## 🔮 Future Enhancements

### Ready to Enable:
1. **Database Integration**: Uncomment MongoDB code in `src/db/connect.js` and `src/models/video.model.js`
2. **Video History**: Store analysis results with video metadata
3. **Authentication**: Add JWT middleware for protected routes
4. **Caching**: Store analysis results to avoid reprocessing

### Potential Additions:
- Video upload endpoint (instead of URL download)
- Batch processing
- Webhooks for async processing
- Rate limiting
- Request logging middleware
- API versioning

## 📝 File Descriptions

| File | Purpose |
|------|---------|
| `asyncHandler.js` | DRY error handling for async functions |
| `apiError.js` | Consistent error responses across app |
| `apiResponse.js` | Consistent success responses across app |
| `videoDownloader.js` | Encapsulates yt-dlp and ffprobe logic |
| `video.controller.js` | Business logic for video operations |
| `error.middleware.js` | Global error and 404 handling |
| `video.routes.js` | Route definitions and mapping |
| `index.js` | Application bootstrap and configuration |
