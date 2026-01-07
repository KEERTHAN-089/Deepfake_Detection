import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export default function ResetPassword() {
  const { currentUser, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validLink, setValidLink] = useState(true);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get("oobCode");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    if (!code) {
      setValidLink(false);
      setError("Invalid or expired password reset link");
    }
  }, [code]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!password || !passwordConfirm)
      return setError("All fields are required");

    if (password !== passwordConfirm)
      return setError("Passwords do not match");

    if (password.length < 6)
      return setError("Password must be at least 6 characters");

    try {
      setError("");
      setMessage("");
      setLoading(true);

      await confirmPasswordReset(auth, code, password);

      setMessage("Password has been reset successfully!");
      setPassword("");
      setPasswordConfirm("");

      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      if (error.code === "auth/expired-action-code") {
        setError("Password reset link has expired. Please request a new one.");
      } else if (error.code === "auth/invalid-action-code") {
        setError("Invalid password reset link.");
      } else {
        setError(error.message || "Failed to reset password");
      }
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

          {/* Invalid Link */}
          {!validLink && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  marginBottom: '10px'
                }}>
                  Invalid Link
                </h2>
              </div>

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

              <Link
                to="/forgot-password"
                style={{
                  display: 'block',
                  padding: '12px 24px',
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                Request New Reset Link
              </Link>
            </>
          )}

          {/* Valid Link */}
          {validLink && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#a78bfa',
                  marginBottom: '10px'
                }}>
                  Create New Password
                </h2>
                <p style={{ fontSize: '14px', color: '#d1d5db' }}>
                  Choose a strong password for your account
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

              {/* Form */}
              <form onSubmit={handleSubmit}>

                {/* New Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a78bfa',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    disabled={loading}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #4c1d95',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Minimum 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a78bfa',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={loading}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #4c1d95',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
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
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              {/* Footer */}
              <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #4c1d95', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#d1d5db' }}>
                  Remember your password?{" "}
                  <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 'bold' }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
