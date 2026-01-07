import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function History() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const [analyses] = useState([
    {
      id: 1,
      filename: "video_sample_1.mp4",
      uploadDate: "2025-01-15",
      result: "Likely Deepfake",
      confidence: 94,
      status: "completed",
    },
    {
      id: 2,
      filename: "interview_footage.mp4",
      uploadDate: "2025-01-14",
      result: "Authentic",
      confidence: 98,
      status: "completed",
    },
    {
      id: 3,
      filename: "presentation_video.mov",
      uploadDate: "2025-01-13",
      result: "Likely Deepfake",
      confidence: 87,
      status: "completed",
    },
  ]);

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const viewVideo = (filename) => {
    // Navigate to videos page or show video player
    navigate(`/videos?play=${filename}`);
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#1a1a2e",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Simple Navbar */}
      <div
        style={{
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "1px solid #9333ea",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            style={{
              margin: 0,
              color: "#a78bfa",
              textDecoration: "none",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            DeepScan
          </Link>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {currentUser ? (
              <>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#d1d5db",
                  }}
                >
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Container */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          paddingTop: "20px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#a78bfa",
              marginBottom: "10px",
            }}
          >
            Analysis History
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#d1d5db",
            }}
          >
            View all previously analyzed videos
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {[
            {
              label: "Total Analyses",
              value: analyses.length,
              icon: "📊",
            },
            {
              label: "Authentic",
              value: analyses.filter((a) => a.result === "Authentic").length,
              icon: "✓",
            },
            {
              label: "Deepfakes Detected",
              value: analyses.filter((a) => a.result !== "Authentic").length,
              icon: "⚠",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#16213e",
                borderRadius: "8px",
                border: "1px solid #9333ea",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                {stat.icon}
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "5px",
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* History Table */}
        <div
          style={{
            backgroundColor: "#16213e",
            borderRadius: "8px",
            border: "1px solid #9333ea",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#0f172a",
                    borderBottom: "1px solid #9333ea",
                  }}
                >
                  {["Filename", "Upload Date", "Result", "Confidence", "Status"].map(
                    (header) => (
                      <th
                        key={header}
                        style={{
                          padding: "15px",
                          textAlign: "left",
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#a78bfa",
                          borderRight: "1px solid #9333ea",
                        }}
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {analyses.map((analysis) => (
                  <tr
                    key={analysis.id}
                    style={{ borderBottom: "1px solid #4c1d95" }}
                  >
                    {/* Filename */}
                    <td
                      style={{
                        padding: "15px",
                        color: "#d1d5db",
                        borderRight: "1px solid #4c1d95",
                      }}
                    >
                      {analysis.filename}
                    </td>

                    {/* Date */}
                    <td
                      style={{
                        padding: "15px",
                        color: "#9ca3af",
                        borderRight: "1px solid #4c1d95",
                      }}
                    >
                      {analysis.uploadDate}
                    </td>

                    {/* Result */}
                    <td
                      style={{
                        padding: "15px",
                        borderRight: "1px solid #4c1d95",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          backgroundColor:
                            analysis.result === "Authentic"
                              ? "#064e3b"
                              : "#7f1d1d",
                          color:
                            analysis.result === "Authentic"
                              ? "#86efac"
                              : "#fecaca",
                          border:
                            analysis.result === "Authentic"
                              ? "1px solid #10b981"
                              : "1px solid #dc2626",
                        }}
                      >
                        {analysis.result}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td
                      style={{
                        padding: "15px",
                        borderRight: "1px solid #4c1d95",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "60px",
                            height: "6px",
                            backgroundColor: "#4c1d95",
                            borderRadius: "3px",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${analysis.confidence}%`,
                              backgroundColor:
                                analysis.confidence >= 90
                                  ? "#dc2626"
                                  : "#f59e0b",
                              borderRadius: "3px",
                            }}
                          ></div>
                        </div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            fontWeight: "bold",
                          }}
                        >
                          {analysis.confidence}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "15px" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ color: "#86efac", fontSize: "12px", fontWeight: "bold" }}>
                          ✓ Completed
                        </span>
                        <Link
                          to={`/videos`}
                          style={{
                            fontSize: '12px',
                            color: '#a78bfa',
                            textDecoration: 'none',
                            fontWeight: 'bold'
                          }}
                        >
                          📹 View Video
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div
          style={{
            marginTop: "40px",
            padding: "25px",
            backgroundColor: "#16213e",
            borderRadius: "8px",
            border: "1px solid #9333ea",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#a78bfa",
              marginBottom: "10px",
            }}
          >
            Ready to Analyze More Videos?
          </h3>
          <p
            style={{
              color: "#d1d5db",
              marginBottom: "15px",
            }}
          >
            Upload new videos to check whether they're authentic or deepfakes.
          </p>
          <Link
            to="/"
            style={{
              padding: "10px 20px",
              backgroundColor: "#7c3aed",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "4px",
              display: "inline-block",
              fontWeight: "bold",
            }}
          >
            Upload New Video
          </Link>
        </div>
      </div>
    </div>
  );
}
