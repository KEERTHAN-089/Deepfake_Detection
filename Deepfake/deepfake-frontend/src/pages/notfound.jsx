import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function NotFound() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a2e', color: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Simple Navbar */}
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

      {/* 404 Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '60px' }}>
        
        {/* 404 Number */}
        <div style={{
          fontSize: '120px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #a78bfa, #dc2626)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '20px'
        }}>
          404
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '15px'
        }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '18px',
          color: '#d1d5db',
          marginBottom: '40px'
        }}>
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Return to Home
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
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Go to Login
          </Link>
        </div>

        {/* Support Text */}
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '40px'
        }}>
          If you think this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}
