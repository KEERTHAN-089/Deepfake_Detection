import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Google accounts are verified by Google, so only email/password users need this check.
  const isGoogleUser = currentUser.providerData.some((p) => p.providerId === "google.com");
  if (!currentUser.emailVerified && !isGoogleUser) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}
