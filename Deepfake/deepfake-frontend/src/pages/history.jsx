import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";

export default function History() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [currentUser, navigate]);

  useEffect(() => {
    // Fetch analysis history from Firestore via backend
    const fetchHistory = async () => {
      try {
        setLoading(true);

        // Build request – send Firebase ID token so backend returns this user's docs
        const headers = {};
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("http://localhost:8000/history", { headers });
        const data = await response.json();

        // Transform backend data to frontend format
        // Firestore docs wrap the result inside a "data" field
        const transformedData = (data.results || []).map((doc) => {
          const result = doc.data || doc; // unwrap Firestore wrapper
          const date = new Date(result.timestamp || doc.created_at);
          const actualConfidence =
            result.prediction === "FAKE"
              ? result.fake_probability || result.confidence || 0
              : result.real_probability || result.confidence || 0;

          return {
            id: result.id || doc.doc_id,
            filename: result.filename,
            uploadDate: date.toLocaleDateString(),
            uploadTime: date.toLocaleTimeString(),
            fullTimestamp: date.getTime(),
            result: result.prediction === "FAKE" ? "Likely Deepfake" : "Authentic",
            confidence: Math.round(actualConfidence),
            status: "completed",
            realScore: result.real_probability,
            fakeScore: result.fake_probability,
            _raw: result, // keep full result for View Details navigation
          };
        });

        // Remove duplicates – keep only the latest upload of each filename
        const uniqueVideos = {};
        transformedData.forEach((analysis) => {
          if (
            !uniqueVideos[analysis.filename] ||
            analysis.fullTimestamp > uniqueVideos[analysis.filename].fullTimestamp
          ) {
            uniqueVideos[analysis.filename] = analysis;
          }
        });

        setAnalyses(Object.values(uniqueVideos));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError("Failed to load analysis history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

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

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "50px", color: "#a78bfa" }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>⏳</div>
            <p>Loading analysis history...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            padding: "20px",
            backgroundColor: "#7f1d1d",
            borderRadius: "8px",
            border: "1px solid #dc2626",
            color: "#fecaca",
            marginBottom: "20px"
          }}>
            ❌ {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && analyses.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "50px",
            backgroundColor: "#16213e",
            borderRadius: "8px",
            border: "1px solid #9333ea",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>📊</div>
            <h3 style={{ color: "#a78bfa", marginBottom: "10px" }}>No Analysis History Yet</h3>
            <p style={{ color: "#d1d5db", marginBottom: "20px" }}>
              Upload your first video to get started
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
              Upload Video
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && !error && analyses.length > 0 && (
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
        )}

        {/* History Table */}
        {!loading && !error && analyses.length > 0 && (
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
                  {["Filename", "Date & Time", "Result", "Confidence", "Status"].map(
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#d1d5db' }}>{analysis.uploadDate}</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{analysis.uploadTime}</span>
                      </div>
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
                            overflow: "hidden",
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
                          to={`/result/${analysis.id}`}
                          state={{ result: analysis._raw }}
                          style={{
                            fontSize: '12px',
                            color: '#a78bfa',
                            textDecoration: 'none',
                            fontWeight: 'bold'
                          }}
                        >
                          📋 View Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* CTA Section */}
        {!loading && !error && analyses.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
