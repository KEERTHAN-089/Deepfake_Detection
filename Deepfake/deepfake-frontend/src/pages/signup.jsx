import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup, signInWithGoogle, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password || !passwordConfirm) {
      return setError("All fields are required");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (password !== passwordConfirm) {
      return setError("Passwords do not match");
    }

    if (!agreeTerms) {
      return setError("You must agree to the Terms and Privacy Policy");
    }

    try {
      setError("");
      setLoading(true);
      await signup(email, password);
      navigate("/profile");
    } catch (err) {
      setError(err?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      navigate("/profile");
    } catch (err) {
      setError(err?.message || "Failed to sign in with Google");
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

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#a78bfa',
              marginBottom: '10px'
            }}>
              Create Account
            </h2>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>
              Join DeepScan in seconds
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

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#fff',
              color: '#1a1a2e',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20419C17.64 8.56601 17.5827 7.95237 17.4764 7.36328H9V10.8446H13.8436C13.635 11.9696 13.0009 12.9228 12.0477 13.561V15.8192H14.9564C16.6582 14.2524 17.64 11.9451 17.64 9.20419Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957275C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8266 0.957275 13.0416L3.96409 10.7098Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            {loading ? 'Signing in...' : 'Sign up with Google'}
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
            <span>or continue with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#4c1d95' }}></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#a78bfa',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
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

            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#a78bfa',
                marginBottom: '8px',
                fontWeight: 'bold'
              }}>
                Password
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

            {/* Confirm Password Field */}
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
                placeholder="Confirm your password"
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

            {/* Terms Checkbox */}
            <div style={{ display: 'flex', alignItems: 'start', gap: '10px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
                style={{
                  marginTop: '5px',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="terms" style={{ fontSize: '12px', color: '#d1d5db', cursor: 'pointer' }}>
                I agree to the{" "}
                <span style={{ color: '#a78bfa', textDecoration: 'underline' }}>Terms of Service</span> and{" "}
                <span style={{ color: '#a78bfa', textDecoration: 'underline' }}>Privacy Policy</span>
              </label>
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
              {loading ? 'Creating Account...' : 'Create Free Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '25px 0',
            color: '#6b7280',
            fontSize: '12px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#4c1d95' }}></div>
            <span>Already have an account?</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#4c1d95' }}></div>
          </div>

          {/* Sign In Link */}
          <Link
            to="/login"
            style={{
              display: 'block',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#a78bfa',
              border: '1px solid #a78bfa',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            Sign In Instead
          </Link>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '12px',
          marginTop: '25px'
        }}>
          We'll never share your data with third parties
        </p>
      </div>
    </div>
  );
}
