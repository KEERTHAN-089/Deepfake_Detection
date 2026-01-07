import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { currentUser, logout, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  async function handleUpdateProfile(e) {
    e.preventDefault();

    try {
      setError("");
      setMessage("");
      setLoading(true);

      await updateUserProfile({ displayName, photoURL });
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update profile");
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
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#a78bfa',
            marginBottom: '10px'
          }}>
            Your Profile
          </h1>
          <p style={{ fontSize: '14px', color: '#d1d5db' }}>
            Manage your DeepScan account
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

        {/* Profile Card */}
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '12px',
          border: '1px solid #9333ea',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          marginBottom: '30px'
        }}>

          {/* Profile Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px' }}>
            
            {/* Avatar */}
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '12px',
                  border: '3px solid #a78bfa',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '12px',
                border: '3px solid #a78bfa',
                backgroundColor: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold'
              }}>
                {currentUser?.email?.[0]?.toUpperCase()}
              </div>
            )}

            {/* User Info */}
            <div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '5px'
              }}>
                {currentUser?.displayName || "User"}
              </h2>
              <p style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '15px' }}>
                {currentUser?.email}
              </p>

              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                <p style={{ marginBottom: '5px' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>Member Since: </span>
                  {currentUser?.metadata?.creationTime
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>Last Sign In: </span>
                  {currentUser?.metadata?.lastSignInTime
                    ? new Date(currentUser.metadata.lastSignInTime).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                width: '100%',
                marginBottom: '30px',
                padding: '12px 24px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '20px'
              }}>
                Edit Your Profile
              </h3>

              <form onSubmit={handleUpdateProfile}>

                {/* Display Name */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a78bfa',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    disabled={loading}
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

                {/* Photo URL */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#a78bfa',
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    disabled={loading}
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

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
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
                    {loading ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: 'transparent',
                      color: '#a78bfa',
                      border: '1px solid #a78bfa',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Account Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>

          {/* Account Information */}
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '12px',
            border: '1px solid #9333ea',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '20px'
            }}>
              Account Information
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '5px' }}>Email</p>
              <p style={{ color: '#fff', fontWeight: 'bold', wordBreak: 'break-all' }}>
                {currentUser?.email}
              </p>
            </div>

            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '5px' }}>User ID</p>
              <p style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                {currentUser?.uid}
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '12px',
            border: '1px solid #9333ea',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '20px'
            }}>
              Account Status
            </h3>

            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#064e3b',
              border: '1px solid #10b981',
              marginBottom: '15px'
            }}>
              <p style={{ color: '#86efac', fontWeight: 'bold', fontSize: '14px' }}>
                ✓ {currentUser?.emailVerified ? "Email Verified" : "Verification Pending"}
              </p>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#3730a3',
              border: '1px solid #6366f1'
            }}>
              <p style={{ color: '#a5b4fc', fontWeight: 'bold', fontSize: '14px' }}>Premium Member</p>
              <p style={{ color: '#9ca3af', fontSize: '12px' }}>Coming Soon</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              color: '#a78bfa',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
