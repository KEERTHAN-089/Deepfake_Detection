import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [uploadType, setUploadType] = useState("file"); // "file" or "url"
  const [videoFile, setVideoFile] = useState(null);
  const [videoURL, setVideoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid video file (MP4, MOV, AVI)");
        setVideoFile(null);
        return;
      }
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError("File size must be less than 500MB");
        setVideoFile(null);
        return;
      }
      setVideoFile(file);
      setError("");
      setMessage(`File selected: ${file.name}`);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError("Please log in first");
      navigate("/login");
      return;
    }

    if (!videoFile) {
      setError("Please select a video file");
      return;
    }

    try {
      setError("");
      setMessage("");
      setUploading(true);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage(`Video uploaded successfully! Starting analysis...`);
      // Navigate to result page after 2 seconds
      setTimeout(() => {
        navigate("/result?type=authentic");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleURLSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError("Please log in first");
      navigate("/login");
      return;
    }

    if (!videoURL.trim()) {
      setError("Please enter a video URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(videoURL);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    try {
      setError("");
      setMessage("");
      setUploading(true);

      // UPDATED: Send to Node.js downloader service
      const response = await fetch('http://localhost:3001/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: videoURL })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      setMessage(`Video analyzed successfully!`);
      
      // Navigate to result page with actual analysis data
      setTimeout(() => {
        navigate(`/result?data=${encodeURIComponent(JSON.stringify(data.analysis))}`);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to process video URL");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a2e', color: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Simple Navbar */}
      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #9333ea' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#a78bfa' }}>DeepScan</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentUser ? (
              <>
                <span style={{ fontSize: '14px', color: '#d1d5db' }}>{currentUser.email}</span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', marginRight: '10px' }}>
                  Login
                </Link>
                <Link to="/signup" style={{ color: '#a78bfa', textDecoration: 'none' }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '36px', marginBottom: '20px', color: '#a78bfa' }}>
          Detect Deepfakes with AI Power
        </h2>
        <p style={{ fontSize: '18px', color: '#d1d5db', marginBottom: '30px' }}>
          Advanced AI-powered deepfake detection. Analyze videos instantly with bank-level security.
        </p>

        {!currentUser && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link
              to="/signup"
              style={{
                padding: '12px 24px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              Get Started
            </Link>
            <Link
              to="/login"
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#a78bfa',
                textDecoration: 'none',
                border: '1px solid #a78bfa',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '30px', color: '#a78bfa' }}>
          Why Choose DeepScan?
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Results in seconds' },
            { icon: '🔒', title: 'Secure', desc: 'Military-grade encryption' },
            { icon: '📊', title: 'Analytics', desc: 'Detailed reports' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '20px',
              backgroundColor: '#16213e',
              borderRadius: '8px',
              border: '1px solid #9333ea',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{f.icon}</div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px', color: '#a78bfa' }}>{f.title}</h4>
              <p style={{ fontSize: '14px', color: '#d1d5db' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Video Upload Section */}
      {currentUser && (
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
          <div style={{
            padding: '30px',
            backgroundColor: '#16213e',
            borderRadius: '8px',
            border: '1px solid #9333ea'
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '20px', color: '#a78bfa' }}>
              Upload Video to Analyze
            </h3>

            {/* Error Alert */}
            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#7f1d1d',
                border: '1px solid #dc2626',
                borderRadius: '8px',
                color: '#fecaca',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Success Alert */}
            {message && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#15803d',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                color: '#86efac',
                fontSize: '14px'
              }}>
                {message}
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => setUploadType("file")}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: uploadType === "file" ? '#7c3aed' : 'transparent',
                  color: '#fff',
                  border: uploadType === "file" ? 'none' : '1px solid #9333ea',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📁 Upload File
              </button>
              <button
                onClick={() => setUploadType("url")}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: uploadType === "url" ? '#7c3aed' : 'transparent',
                  color: '#fff',
                  border: uploadType === "url" ? 'none' : '1px solid #9333ea',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔗 Enter URL
              </button>
            </div>

            {/* File Upload Form */}
            {uploadType === "file" && (
              <form onSubmit={handleFileUpload}>
                <div style={{
                  padding: '30px',
                  border: '2px dashed #9333ea',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  backgroundColor: '#0f172a'
                }}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="video/*"
                    style={{ display: 'none' }}
                    id="videoInput"
                    disabled={uploading}
                  />
                  <label htmlFor="videoInput" style={{
                    display: 'block',
                    cursor: 'pointer',
                    color: '#a78bfa'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>📹</div>
                    <p style={{ marginBottom: '5px', color: '#d1d5db' }}>
                      {videoFile ? videoFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                      MP4, MOV, AVI (max 500MB)
                    </p>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!videoFile || uploading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: !videoFile || uploading ? '#6b7280' : '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: !videoFile || uploading ? 'not-allowed' : 'pointer',
                    opacity: !videoFile || uploading ? 0.6 : 1
                  }}
                >
                  {uploading ? 'Uploading...' : 'Analyze Video'}
                </button>
              </form>
            )}

            {/* URL Input Form */}
            {uploadType === "url" && (
              <form onSubmit={handleURLSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a78bfa',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={videoURL}
                    onChange={(e) => setVideoURL(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    disabled={uploading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #4c1d95',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
                    Enter a direct link to the video file
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!videoURL.trim() || uploading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: !videoURL.trim() || uploading ? '#6b7280' : '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: !videoURL.trim() || uploading ? 'not-allowed' : 'pointer',
                    opacity: !videoURL.trim() || uploading ? 0.6 : 1
                  }}
                >
                  {uploading ? 'Processing...' : 'Analyze Video'}
                </button>
              </form>
            )}

            {/* View History Link */}
            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #4c1d95', paddingTop: '20px' }}>
              <Link to="/history" style={{
                color: '#a78bfa',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                marginRight: '20px'
              }}>
                📊 View Analysis History
              </Link>
              <Link to="/videos" style={{
                color: '#a78bfa',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                📹 View Downloaded Videos
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
