import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { useAuth } from "../contexts/AuthContext";

export default function Result() {
  const { currentUser, logout } = useAuth();

  const [searchParams] = useSearchParams();

  const [result, setResult] = useState({
    isDeepfake: true,
    confidence: 94,
    filename: "video_sample.mp4",
    analysisTime: 2.5,
    details: [
      { label: "Facial Manipulation", confidence: 96, detected: true },
      { label: "Audio Inconsistency", confidence: 87, detected: true },
      { label: "Lighting Anomaly", confidence: 91, detected: true },
      { label: "Frame Blinking", confidence: 98, detected: true },
    ],
  });

  // Switch result based on ?type parameter
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "authentic") {
      setResult({
        isDeepfake: false,
        confidence: 98,
        filename: "authentic_video.mp4",
        analysisTime: 3.2,
        details: [
          { label: "Facial Manipulation", confidence: 2, detected: false },
          { label: "Audio Consistency", confidence: 99, detected: false },
          { label: "Natural Lighting", confidence: 97, detected: false },
          { label: "Normal Blinking Pattern", confidence: 99, detected: false },
        ],
      });
    }
  }, [searchParams]);

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
              result.isDeepfake
                ? "bg-red-900/30 border-red-500/40"
                : "bg-green-900/30 border-green-500/40"
            }`}
          >
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-xl ${
                result.isDeepfake
                  ? "bg-gradient-to-br from-red-600 to-pink-600"
                  : "bg-gradient-to-br from-green-600 to-emerald-600"
              }`}
            >
              {result.isDeepfake ? (
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9..." />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m..." />
                </svg>
              )}
            </div>

            <h1
              className={`text-3xl font-black mb-3 bg-clip-text text-transparent ${
                result.isDeepfake
                  ? "bg-gradient-to-r from-red-400 to-pink-400"
                  : "bg-gradient-to-r from-green-400 to-emerald-400"
              }`}
            >
              {result.isDeepfake ? "Likely Deepfake Detected" : "Authentic Content"}
            </h1>

            <p
              className={`text-lg font-semibold ${
                result.isDeepfake ? "text-red-300" : "text-green-300"
              }`}
            >
              Confidence: {result.confidence}%
            </p>
          </div>

          {/* FILE INFO & CONFIDENCE GAUGE */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">

            {/* FILE INFO CARD */}
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8">
              <h2 className="text-2xl font-black text-white mb-6">
                File Information
              </h2>

              <div className="space-y-5 text-gray-300">
                <div>
                  <p className="text-sm text-gray-500">Filename</p>
                  <p className="font-semibold mt-1">{result.filename}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Analysis Time</p>
                  <p className="font-semibold mt-1">{result.analysisTime}s</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Result Status</p>

                  <span
                    className={`inline-block mt-2 px-4 py-2 text-sm font-bold rounded-lg border ${
                      result.isDeepfake
                        ? "bg-red-900/40 border-red-500/40 text-red-300"
                        : "bg-green-900/40 border-green-500/40 text-green-300"
                    }`}
                  >
                    {result.isDeepfake ? "⚠ Deepfake" : "✓ Authentic"}
                  </span>
                </div>
              </div>
            </div>

            {/* CONFIDENCE GAUGE */}
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8">
              <h2 className="text-2xl font-black text-white mb-6">
                Confidence Score
              </h2>

              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                    <circle cx="100" cy="100" r="90" stroke="#374151" strokeWidth="12" fill="none" />

                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      strokeWidth="12"
                      fill="none"
                      stroke={`url(#${result.isDeepfake ? "red" : "green"}Gradient)`}
                      strokeDasharray={`${2 * Math.PI * 90 * (result.confidence / 100)} ${
                        2 * Math.PI * 90
                      }`}
                      strokeLinecap="round"
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
                        className={`text-4xl font-black bg-clip-text text-transparent ${
                          result.isDeepfake
                            ? "bg-gradient-to-r from-red-400 to-pink-400"
                            : "bg-gradient-to-r from-green-400 to-emerald-400"
                        }`}
                      >
                        {result.confidence}%
                      </p>

                      <p className="text-gray-400 text-sm mt-1">Certainty</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* DETAILED ANALYSIS */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 mb-10">

            <h2 className="text-2xl font-black text-white mb-6">
              Detailed Analysis
            </h2>

            <div className="space-y-4">
              {result.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-700 hover:border-purple-500/40 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        detail.detected ? "bg-red-900/40" : "bg-green-900/40"
                      }`}
                    >
                      {detail.detected ? (
                        <svg
                          className="w-6 h-6 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 18a8 8 0..."></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 18a8 8..."></path>
                        </svg>
                      )}
                    </div>

                    <span className="text-white font-medium">{detail.label}</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-2 rounded-full bg-gray-700">
                      <div
                        className={`h-full rounded-full ${
                          detail.confidence >= 90
                            ? "bg-gradient-to-r from-red-500 to-pink-500"
                            : detail.confidence >= 70
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                        style={{ width: `${detail.confidence}%` }}
                      ></div>
                    </div>

                    <span className="text-gray-400 text-sm font-semibold">
                      {detail.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">

            <Button as={Link} to="/" className="px-10 py-4 text-lg">
              Analyze Another Video
            </Button>

            <Button as={Link} to="/videos" variant="secondary" className="px-10 py-4 text-lg">
              View All Videos
            </Button>

            <Button
              variant="secondary"
              className="px-10 py-4 text-lg"
            >
              Download Report
            </Button>
          </div>

          {/* DISCLAIMER */}
          <div className="mt-12 p-6 rounded-lg bg-blue-900/30 border border-blue-500/30">
            <p className="text-blue-300 text-sm leading-relaxed">
              <span className="font-bold">Disclaimer:</span> This AI analysis is intended for informational purposes only. Always conduct additional verification when authenticity is crucial.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
