import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { sendPasswordReset, currentUser, logout } = useAuth(); // CHANGED: resetPassword → sendPasswordReset
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

    if (!email) return setError("Please enter your email");

    try {
      setMessage("");
      setError("");
      setLoading(true);

      await sendPasswordReset(email); // CHANGED: resetPassword → sendPasswordReset

      setMessage(
        "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."
      );

      setEmail("");
    } catch (error) {
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

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
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: "#a78bfa",
                    textDecoration: "none",
                    marginRight: "10px",
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  style={{
                    color: "#a78bfa",
                    textDecoration: "none",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Container */}
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          paddingTop: "40px",
        }}
      >
        {/* Card */}
        <div
          style={{
            backgroundColor: "#16213e",
            borderRadius: "12px",
            border: "1px solid #9333ea",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#a78bfa",
                marginBottom: "10px",
              }}
            >
              Reset Password
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#d1d5db",
              }}
            >
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#7f1d1d",
                border: "1px solid #dc2626",
                borderRadius: "8px",
                color: "#fecaca",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* Success Alert */}
          {message && (
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#15803d",
                border: "1px solid #22c55e",
                borderRadius: "8px",
                color: "#86efac",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  color: "#a78bfa",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
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
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "#0f172a",
                  border: "1px solid #4c1d95",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              margin: "25px 0",
              color: "#6b7280",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "#4c1d95",
              }}
            ></div>
            <span>Remember your password?</span>
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "#4c1d95",
              }}
            ></div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            style={{
              display: "block",
              padding: "12px 24px",
              backgroundColor: "transparent",
              color: "#a78bfa",
              border: "1px solid #a78bfa",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Sign In Instead
          </Link>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            fontSize: "12px",
            marginTop: "25px",
          }}
        >
          Check your email and spam folder for the reset link
        </p>
      </div>
    </div>
  );
}
