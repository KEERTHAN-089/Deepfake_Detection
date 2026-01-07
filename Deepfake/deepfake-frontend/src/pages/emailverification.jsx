import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";

export default function EmailVerification() {
  const { currentUser, sendVerificationEmail, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const navigate = useNavigate();

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
    if (currentUser?.emailVerified) {
      setMessage("Email already verified! Redirecting to profile...");
      setTimeout(() => navigate("/profile"), 2000);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  async function handleResendEmail() {
    try {
      setError("");
      setMessage("");
      setLoading(true);
      await sendVerificationEmail();
      setMessage("Verification email sent! Check your inbox.");
      setResendCountdown(60);
    } catch (err) {
      setError(err.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerified() {
    try {
      setError("");
      setLoading(true);
      // Reload the user from Firebase to get latest verification status
      await currentUser.reload();
      // Get the fresh user object after reload
      const refreshedUser = auth.currentUser;
      
      if (refreshedUser && refreshedUser.emailVerified) {
        setMessage("Email verified! Redirecting to profile...");
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  }

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
            ) : null}
          </div>
        </div>
      </div>

      {/* Container */}
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '40px' }}>

        {/* Card */}
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '12px',
          border: '1px solid #9333ea',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#a78bfa',
              marginBottom: '10px'
            }}>
              Verify Email
            </h2>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>
              Confirm your email to continue
            </p>
          </div>

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

          {/* Email Info */}
          <div style={{ marginBottom: '25px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '10px' }}>
              Verification email sent to:
            </p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#a78bfa' }}>
              {currentUser?.email}
            </p>
          </div>

          {/* Instructions */}
          <div style={{
            marginBottom: '25px',
            padding: '15px',
            backgroundColor: '#0f172a',
            border: '1px solid #4c1d95',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#d1d5db'
          }}>
            <p style={{ marginBottom: '10px' }}>✉️ Check your email inbox for a verification link</p>
            <p style={{ marginBottom: '10px' }}>📧 If you don't see it, check your spam folder</p>
            <p>⏱️ The link expires in 24 hours</p>
          </div>

          {/* Verified Button */}
          <button
            onClick={handleVerified}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginBottom: '15px'
            }}
          >
            {loading ? "Checking..." : "I've Verified My Email"}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '20px 0',
            color: '#6b7280',
            fontSize: '12px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#4c1d95' }}></div>
            <span>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#4c1d95' }}></div>
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={loading || resendCountdown > 0}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: resendCountdown > 0 ? '#6b7280' : '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: resendCountdown > 0 || loading ? 'not-allowed' : 'pointer',
              opacity: resendCountdown > 0 || loading ? 0.6 : 1
            }}
          >
            {resendCountdown > 0
              ? `Resend in ${resendCountdown}s`
              : loading
              ? "Sending..."
              : "Resend Verification Email"}
          </button>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '12px',
          marginTop: '25px'
        }}>
          Need help? Check your spam folder or contact support
        </p>
      </div>
    </div>
  );
}
