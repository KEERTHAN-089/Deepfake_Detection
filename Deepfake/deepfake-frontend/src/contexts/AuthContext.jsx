


import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function signup(email, password) {
    try {
      setError("");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      return userCredential;
    } catch (err) {
      console.error("Signup error:", err);

      // Provide user-friendly error messages
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
      throw err;
    }
  }

  async function login(email, password) {
    try {
      setError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        const verificationError = new Error("Please verify your email before logging in. Check your inbox for the verification link.");
        verificationError.code = "auth/email-not-verified";
        throw verificationError;
      }

      return userCredential;
    } catch (err) {
      console.error("Login error:", err);

      // Provide user-friendly error messages
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again or reset your password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else if (err.code === "auth/email-not-verified") {
        setError(err.message);
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.message || "Failed to log in. Please try again.");
      }
      throw err;
    }
  }

  async function logout() {
    try {
      setError("");
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function sendPasswordReset(email) {
    try {
      setError("");
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function sendVerificationEmail() {
    try {
      setError("");
      if (!currentUser) {
        throw new Error("No user is currently signed in");
      }
      await sendEmailVerification(currentUser);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function updateUserProfile(updates) {
    try {
      setError("");
      if (!currentUser) {
        throw new Error("No user is currently signed in");
      }
      await updateProfile(currentUser, updates);
      await currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function signInWithGoogle() {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (err) {
      console.error("Google sign-in error:", err);

      // Provide user-friendly error messages
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked. Please allow popups for this site and try again.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Sign-in cancelled. Please try again.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Failed to sign in with Google. Please try again or use email/password.");
      }
      throw err;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    sendPasswordReset,
    resetPassword: sendPasswordReset, // ADD THIS LINE - creates an alias
    sendVerificationEmail,
    updateUserProfile,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
