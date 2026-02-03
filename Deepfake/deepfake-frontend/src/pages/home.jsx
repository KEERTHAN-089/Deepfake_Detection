import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

export default function Home() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [uploadType, setUploadType] = useState("file"); // "file" or "url"
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setError("");
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadType === "file" && !file) {
      setError("Please select a video file");
      return;
    }
    
    if (uploadType === "url" && !url) {
      setError("Please enter a video URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setDownloadProgress(0);
    setAnalysisProgress("");

    try {
      let videoFile = file;

      // If URL upload, download from node-downloader first
      if (uploadType === "url") {
        setAnalysisProgress("Downloading and analyzing video from URL...");
        
        const downloadResponse = await axios.post(
          "http://localhost:3001/download",
          { url },
          {
            timeout: 0, // UNLIMITED TIMEOUT for downloading
            onDownloadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setDownloadProgress(percentCompleted);
            },
          }
        );

        if (!downloadResponse.data.success) {
          throw new Error(downloadResponse.data.error || "Download failed");
        }

        console.log("✅ Download and analysis complete");
        console.log("📊 Result:", downloadResponse.data.analysis);

        // The node-downloader already analyzed it, so we have the result
        const analysisResult = downloadResponse.data.analysis;
        
        setResult(analysisResult);
        setAnalysisProgress("Analysis complete!");

        // Navigate to result page with data
        navigate("/result", { state: { result: analysisResult } });
        
        // Exit early since we're done
        return;
      }

      // FILE UPLOAD: Send to Python backend for deepfake analysis
      setAnalysisProgress("Analyzing video... This may take several minutes");
      console.log("🚀 Sending to Python backend...");

      const formData = new FormData();
      formData.append("file", file, file.name);

      const analysisResponse = await axios.post(
        "http://localhost:8000/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 0, // ✅ UNLIMITED TIMEOUT - No time restriction
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDownloadProgress(percentCompleted);
          },
        }
      );

      console.log("✅ Analysis complete:", analysisResponse.data);

      setResult(analysisResponse.data);
      setAnalysisProgress("Analysis complete!");

      // Navigate to result page with data - REMOVE TIMEOUT
      navigate("/result", { state: { result: analysisResponse.data } });

    } catch (err) {
      console.error("❌ Error:", err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        "An error occurred during processing"
      );
      setAnalysisProgress("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a2e', 
      color: '#fff', 
      minHeight: '100vh', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      
      {/* Navbar */}
      <div style={{ 
        marginBottom: '30px', 
        paddingBottom: '20px', 
        borderBottom: '1px solid #9333ea' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h1 style={{ 
            margin: 0, 
            color: '#a78bfa', 
            fontSize: '24px', 
            fontWeight: 'bold' 
          }}>
            DeepScan AI
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentUser ? (
              <>
                <Link 
                  to="/history" 
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#7c3aed', 
                    color: '#fff', 
                    textDecoration: 'none', 
                    borderRadius: '4px', 
                    fontWeight: 'bold' 
                  }}
                >
                  History
                </Link>
                <span style={{ fontSize: '14px', color: '#d1d5db' }}>
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#7c3aed', 
                  color: '#fff', 
                  textDecoration: 'none', 
                  borderRadius: '4px', 
                  fontWeight: 'bold' 
                }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '20px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#a78bfa', 
            marginBottom: '10px' 
          }}>
            🎬 Deepfake Detection
          </h2>
          <p style={{ fontSize: '16px', color: '#d1d5db' }}>
            Upload a video or provide a URL to analyze for deepfake content
          </p>
        </div>

        {/* Upload Type Selector */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '30px', 
          justifyContent: 'center' 
        }}>
          <button
            onClick={() => setUploadType("file")}
            style={{
              padding: '12px 24px',
              backgroundColor: uploadType === "file" ? '#7c3aed' : '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            📁 Upload File
          </button>
          <button
            onClick={() => setUploadType("url")}
            style={{
              padding: '12px 24px',
              backgroundColor: uploadType === "url" ? '#7c3aed' : '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🔗 From URL
          </button>
        </div>

        {/* Upload Form */}
        <div style={{ 
          backgroundColor: '#16213e', 
          padding: '30px', 
          borderRadius: '12px', 
          border: '1px solid #9333ea' 
        }}>
          <form onSubmit={handleSubmit}>
            
            {/* File Upload */}
            {uploadType === "file" && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#d1d5db' 
                }}>
                  Select Video File
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #4c1d95',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                />
                {file && (
                  <p style={{ 
                    marginTop: '10px', 
                    fontSize: '12px', 
                    color: '#34d399' 
                  }}>
                    ✅ Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            {/* URL Input */}
            {uploadType === "url" && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#d1d5db' 
                }}>
                  Video URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/video.mp4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #4c1d95',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {/* Progress Bar */}
            {loading && downloadProgress > 0 && downloadProgress < 100 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '5px' 
                }}>
                  <span style={{ fontSize: '12px', color: '#d1d5db' }}>
                    {uploadType === "url" ? "Downloading..." : "Uploading..."}
                  </span>
                  <span style={{ fontSize: '12px', color: '#d1d5db' }}>
                    {downloadProgress}%
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#374151', 
                  borderRadius: '8px', 
                  height: '8px' 
                }}>
                  <div
                    style={{
                      width: `${downloadProgress}%`,
                      backgroundColor: '#7c3aed',
                      height: '8px',
                      borderRadius: '8px',
                      transition: 'width 0.3s'
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Analysis Progress */}
            {analysisProgress && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#1e3a8a',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#93c5fd', fontSize: '14px', margin: 0 }}>
                  ⏳ {analysisProgress}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#7f1d1d',
                border: '1px solid #dc2626',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#fecaca', fontSize: '14px', margin: 0 }}>
                  ❌ {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (uploadType === "file" && !file) || (uploadType === "url" && !url)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: loading ? '#6b7280' : '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? (
                <span>🔄 Processing... (This may take a few minutes)</span>
              ) : (
                <span>🚀 Analyze Video</span>
              )}
            </button>
          </form>
        </div>

        {/* Quick Result Preview - REMOVED to prevent confusion */}
      </div>
    </div>
  );
}
