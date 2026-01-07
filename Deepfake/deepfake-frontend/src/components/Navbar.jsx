import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await onLogout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DS</span>
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            DeepScan
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <span className="text-gray-300 text-sm">{currentUser.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-medium transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
