import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { FullScreenLoader } from "../components/ui";
import { toFriendlyError } from "../lib/authErrors";

const AuthContext = createContext(null);

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
  // Firebase mutates the same User object on profile changes, so bump this to re-render.
  const [, setUserVersion] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  async function signup(email, password) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      await signOut(auth);
      return credential;
    } catch (err) {
      throw toFriendlyError(err, "Could not create your account. Please try again.");
    }
  }

  async function login(email, password) {
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw toFriendlyError(err, "Could not sign you in. Please try again.");
    }
    if (!credential.user.emailVerified) {
      await signOut(auth);
      throw toFriendlyError({ code: "auth/email-not-verified" });
    }
    return credential;
  }

  async function signInWithGoogle() {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      throw toFriendlyError(err, "Google sign-in failed. Try again or use email and password.");
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw toFriendlyError(err, "Could not send the reset email. Please try again.");
    }
  }

  async function sendVerificationEmail() {
    if (!auth.currentUser) throw new Error("No user is currently signed in.");
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      throw toFriendlyError(err, "Could not send the verification email.");
    }
  }

  async function updateUserProfile(updates) {
    if (!auth.currentUser) throw new Error("No user is currently signed in.");
    try {
      await updateProfile(auth.currentUser, updates);
      await auth.currentUser.reload();
      setCurrentUser(auth.currentUser);
      setUserVersion((v) => v + 1);
    } catch (err) {
      throw toFriendlyError(err, "Could not update your profile.");
    }
  }

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    sendPasswordReset,
    resetPassword: sendPasswordReset,
    sendVerificationEmail,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <FullScreenLoader /> : children}
    </AuthContext.Provider>
  );
}
