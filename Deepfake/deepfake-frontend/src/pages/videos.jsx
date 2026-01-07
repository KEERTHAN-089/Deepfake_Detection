import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Videos() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) navigate("/login");
    fetchVideos();
  }, [currentUser, navigate]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch('http://localhost:3001/videos');
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.videos);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    
    try {
      const response = await fetch(`http://localhost:3001/videos/${filename}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVideos(videos.filter(v => v.filename !== filename));
      } else {
        alert('Failed to delete video');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const playVideo = (filename) => {
    setSelectedVideo(filename);
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  const downloadVideo = (filename) => {
    window.open(`http://localhost:3001/videos/download/${filename}`, '_blank');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a2e', color: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Navbar */}
      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #9333ea' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ margin: 0, color: '#a78bfa', textDecoration: 'none', fontSize: '20px', fontWeight: 'bold' }}>
            DeepScan
          </Link>
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
            ) : null}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={closeVideoPlayer}
        >
          <div style={{
            maxWidth: '90%',
            maxHeight: '90%',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeVideoPlayer}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✕ Close
            </button>

            {/* Video Player */}
            <video
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 100px)',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              <source 
                src={`http://localhost:3001/videos/stream/${selectedVideo}`} 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>

            {/* Video Info */}
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#16213e',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '14px', color: '#d1d5db' }}>
                📹 {selectedVideo}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '10px' }}>
            Downloaded Videos
          </h1>
          <p style={{ fontSize: '14px', color: '#d1d5db' }}>
            Videos stored on the server
          </p>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#16213e', borderRadius: '8px', border: '1px solid #9333ea' }}>
          <div style={{ display: 'flex', gap: '30px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '5px' }}>Total Videos</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{videos.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '5px' }}>Total Size</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                {videos.reduce((sum, v) => sum + parseFloat(v.size), 0).toFixed(2)}MB
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchVideos}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>

        {/* Error */}
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

        {/* Videos List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div style={{
            padding: '40px',
            backgroundColor: '#16213e',
            borderRadius: '8px',
            border: '1px solid #9333ea',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '18px', color: '#d1d5db', marginBottom: '10px' }}>
              No videos downloaded yet
            </p>
            <Link to="/" style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              Upload Your First Video
            </Link>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '8px',
            border: '1px solid #9333ea',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #9333ea' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#a78bfa' }}>
                    Filename
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#a78bfa' }}>
                    Size
                  </th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#a78bfa' }}>
                    Created
                  </th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#a78bfa' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #4c1d95' }}>
                    <td style={{ padding: '15px', color: '#d1d5db' }}>
                      📹 {video.filename}
                    </td>
                    <td style={{ padding: '15px', color: '#9ca3af' }}>
                      {video.size}
                    </td>
                    <td style={{ padding: '15px', color: '#9ca3af' }}>
                      {new Date(video.created).toLocaleString()}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => playVideo(video.filename)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#7c3aed',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ▶️ Play
                        </button>
                        <button
                          onClick={() => downloadVideo(video.filename)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#0891b2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          💾 Download
                        </button>
                        <button
                          onClick={() => deleteVideo(video.filename)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Back Link */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Link to="/" style={{
            color: '#a78bfa',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
