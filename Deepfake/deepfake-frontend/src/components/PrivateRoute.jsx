import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  // Not logged in - redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user signed in with Google (Google users are auto-verified)
  const isGoogleUser = currentUser.providerData.some(
    provider => provider.providerId === "google.com"
  );

  // Logged in but email not verified (and not a Google user) - redirect to verification page
  if (!currentUser.emailVerified && !isGoogleUser) {
    return <Navigate to="/verify-email" replace />;
  }

  // Logged in and email verified (or Google user) - render the protected content
  return children;
}
