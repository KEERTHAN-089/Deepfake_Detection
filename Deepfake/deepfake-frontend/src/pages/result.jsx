import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { useAuth } from "../contexts/AuthContext";

export default function Result() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL params

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // First check if result was passed via navigation state
    if (location.state?.result) {
      console.log("📊 Result data received from navigation:", location.state.result);
      setResult(location.state.result);
    } 
    // If not, and we have an ID in the URL, fetch from API
    else if (id) {
      console.log("🔍 Fetching result from API for ID:", id);
      fetchResultFromAPI(id);
    }
    // If we have an ID in the result state, fetch it
    else if (location.state?.id) {
      console.log("🔍 Fetching result from API for ID:", location.state.id);
      fetchResultFromAPI(location.state.id);
    }
  }, [location, id]);

  const fetchResultFromAPI = async (resultId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📡 Fetching from: http://localhost:8000/result/${resultId}`);
      const response = await axios.get(`http://localhost:8000/result/${resultId}`);
      console.log("✅ Result fetched:", response.data);
      setResult(response.data);
    } catch (err) {
      console.error("❌ Error fetching result:", err);
      setError(err.response?.data?.detail || "Failed to load result");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading result...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ {error}</div>
          <Link 
            to="/" 
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">No result data available</div>
          <Link 
            to="/" 
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPredictionReal = result.prediction === 'REAL';
  const realProb = parseFloat(result.real_probability || 0);
  const fakeProb = parseFloat(result.fake_probability || 0);
  const confidence = parseFloat(result.confidence || 0);
  const threshold = parseFloat(result.threshold || 35);

  return (
    <>
      {/* Navbar */}
      <Navbar currentUser={currentUser} onLogout={logout} />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 py-12 px-4 relative overflow-hidden">

        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-600 mix-blend-multiply blur-3xl opacity-15 animate-pulse"></div>
          <div
            className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-600 mix-blend-multiply blur-3xl opacity-15 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative max-w-5xl mx-auto">

          {/* RESULT HEADER */}
          <div
            className={`rounded-2xl p-8 mb-8 text-center border backdrop-blur-xl ${
              !isPredictionReal
                ? "bg-red-900/30 border-red-500/40"
                : "bg-green-900/30 border-green-500/40"
            }`}
          >
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-xl ${
                !isPredictionReal
                  ? "bg-gradient-to-br from-red-600 to-pink-600"
                  : "bg-gradient-to-br from-green-600 to-emerald-600"
              }`}
            >
              {!isPredictionReal ? (
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <h1
              className={`text-3xl font-black mb-3 bg-clip-text text-transparent ${
                !isPredictionReal
                  ? "bg-gradient-to-r from-red-400 to-pink-400"
                  : "bg-gradient-to-r from-green-400 to-emerald-400"
              }`}
            >
              {!isPredictionReal ? "⚠️ Deepfake Detected" : "✅ Authentic Content"}
            </h1>

            <p
              className={`text-lg font-semibold ${
                !isPredictionReal ? "text-red-300" : "text-green-300"
              }`}
            >
              Confidence: {confidence.toFixed(2)}%
            </p>
          </div>

          {/* PROBABILITY GRAPH */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 mb-8">
            <h2 className="text-2xl font-black text-white mb-6">
              📊 Probability Distribution
            </h2>
            
            <div className="space-y-6">
              {/* Real Bar */}
              <div>
                <div className="flex justify-between text-white mb-3">
                  <span className="font-semibold text-lg">✅ Real</span>
                  <span className="font-bold text-xl">{realProb.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-10 overflow-hidden border border-gray-600">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-10 rounded-full flex items-center justify-end pr-4 transition-all duration-1000 ease-out"
                    style={{ width: `${realProb}%` }}
                  >
                    {realProb > 10 && (
                      <span className="text-white font-bold text-sm">{realProb.toFixed(2)}%</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fake Bar */}
              <div>
                <div className="flex justify-between text-white mb-3">
                  <span className="font-semibold text-lg">❌ Fake</span>
                  <span className="font-bold text-xl">{fakeProb.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-10 overflow-hidden border border-gray-600">
                  <div
                    className="bg-gradient-to-r from-red-500 to-pink-600 h-10 rounded-full flex items-center justify-end pr-4 transition-all duration-1000 ease-out"
                    style={{ width: `${fakeProb}%` }}
                  >
                    {fakeProb > 10 && (
                      <span className="text-white font-bold text-sm">{fakeProb.toFixed(2)}%</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Threshold Indicator */}
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-300 font-semibold">🎯 Detection Threshold</span>
                  <span className="text-yellow-200 font-bold text-lg">{threshold.toFixed(2)}%</span>
                </div>
                <p className="text-yellow-200/70 text-sm mt-2">
                  Videos with fake probability above {threshold.toFixed(2)}% are classified as deepfakes
                </p>
              </div>
            </div>
          </div>

          {/* FILE INFO & VIDEO DETAILS */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">

            {/* FILE INFO CARD */}
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8">
              <h2 className="text-2xl font-black text-white mb-6">
                📁 File Information
              </h2>

              <div className="space-y-5 text-gray-300">
                <div>
                  <p className="text-sm text-gray-500">Filename</p>
                  <p className="font-semibold mt-1 break-all">{result.filename || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="font-semibold mt-1">{result.file_size_mb || 'N/A'} MB</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Processing Time</p>
                  <p className="font-semibold mt-1">{result.processing_time_ms ? (result.processing_time_ms / 1000).toFixed(2) : 'N/A'}s</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Analysis Date</p>
                  <p className="font-semibold mt-1">{result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Model Version</p>
                  <p className="font-semibold mt-1">{result.model_version || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* VIDEO DETAILS CARD */}
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8">
              <h2 className="text-2xl font-black text-white mb-6">
                🎥 Video Details
              </h2>

              <div className="space-y-5 text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Frames</p>
                    <p className="font-semibold mt-1 text-2xl">{result.video_info?.total_frames || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Analyzed</p>
                    <p className="font-semibold mt-1 text-2xl">{result.video_info?.frames_analyzed || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">FPS</p>
                    <p className="font-semibold mt-1 text-2xl">{result.video_info?.fps?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold mt-1 text-2xl">{result.video_info?.duration?.toFixed(2) || 'N/A'}s</p>
                  </div>
                </div>

                {result.video_info?.total_frames && result.video_info?.frames_analyzed && (
                  <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                    <p className="text-purple-200 text-sm">
                      <span className="font-bold">Coverage:</span> {((result.video_info.frames_analyzed / result.video_info.total_frames) * 100).toFixed(1)}% of video analyzed
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CONFIDENCE GAUGE */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 mb-8">
            <h2 className="text-2xl font-black text-white mb-6 text-center">
              Overall Confidence Score
            </h2>

            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="85" stroke="#374151" strokeWidth="16" fill="none" />

                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    strokeWidth="16"
                    fill="none"
                    stroke={`url(#${!isPredictionReal ? "red" : "green"}Gradient)`}
                    strokeDasharray={`${2 * Math.PI * 85 * (confidence / 100)} ${2 * Math.PI * 85}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />

                  <defs>
                    <linearGradient id="redGradient">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>

                    <linearGradient id="greenGradient">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p
                      className={`text-5xl font-black bg-clip-text text-transparent ${
                        !isPredictionReal
                          ? "bg-gradient-to-r from-red-400 to-pink-400"
                          : "bg-gradient-to-r from-green-400 to-emerald-400"
                      }`}
                    >
                      {confidence.toFixed(2)}%
                    </p>

                    <p className="text-gray-400 text-sm mt-2 font-semibold">Certainty</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <span
                  className={`inline-block px-6 py-3 text-lg font-bold rounded-lg border ${
                    !isPredictionReal
                      ? "bg-red-900/40 border-red-500/40 text-red-300"
                      : "bg-green-900/40 border-green-500/40 text-green-300"
                  }`}
                >
                  {!isPredictionReal ? "⚠️ DEEPFAKE" : "✅ AUTHENTIC"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button as={Link} to="/" className="px-10 py-4 text-lg">
              🔄 Analyze Another Video
            </Button>

            <Button as={Link} to="/history" variant="secondary" className="px-10 py-4 text-lg">
              📜 View History
            </Button>

            <Button
              variant="secondary"
              className="px-10 py-4 text-lg"
              onClick={() => {
                const reportData = `
DEEPFAKE DETECTION REPORT
========================

Filename: ${result.filename || 'N/A'}
Analysis Date: ${result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}

RESULT: ${result.prediction}
Confidence: ${confidence.toFixed(2)}%

PROBABILITIES:
- Real: ${realProb.toFixed(2)}%
- Fake: ${fakeProb.toFixed(2)}%

VIDEO INFORMATION:
- Total Frames: ${result.video_info?.total_frames || 'N/A'}
- Frames Analyzed: ${result.video_info?.frames_analyzed || 'N/A'}
- FPS: ${result.video_info?.fps?.toFixed(2) || 'N/A'}
- Duration: ${result.video_info?.duration?.toFixed(2) || 'N/A'}s
- File Size: ${result.file_size_mb || 'N/A'} MB

TECHNICAL DETAILS:
- Model: ${result.model_version || 'N/A'}
- Threshold: ${threshold.toFixed(2)}%
- Processing Time: ${result.processing_time_ms ? (result.processing_time_ms / 1000).toFixed(2) : 'N/A'}s

========================
Report generated by DeepScan AI
                `;
                const blob = new Blob([reportData], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `deepfake-report-${result.id || Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              📥 Download Report
            </Button>
          </div>

          {/* DISCLAIMER */}
          <div className="mt-12 p-6 rounded-lg bg-blue-900/30 border border-blue-500/30">
            <p className="text-blue-300 text-sm leading-relaxed">
              <span className="font-bold">⚠️ Disclaimer:</span> This AI analysis is intended for informational purposes only. The model analyzes {result.video_info?.frames_analyzed || 'N/A'} frames using BiLSTM and ResNet50 architecture with a detection threshold of {threshold.toFixed(2)}%. Always conduct additional verification when authenticity is crucial for legal, security, or investigative purposes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
