const AUTH_MESSAGES = {
  "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
  "auth/weak-password": "That password is too weak. Use at least 6 characters.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  "auth/cancelled-popup-request": "Google sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups for this site and try again.",
  "auth/expired-action-code": "This link has expired. Request a new one.",
  "auth/invalid-action-code": "This link is invalid or has already been used.",
  "auth/requires-recent-login": "Please sign in again to make this change.",
  "auth/email-not-verified":
    "Please verify your email before signing in. Check your inbox for the verification link.",
};

/** Maps a Firebase error to a readable message while keeping its code. */
export function toFriendlyError(err, fallback = "Something went wrong. Please try again.") {
  const friendly = new Error(AUTH_MESSAGES[err?.code] || fallback);
  friendly.code = err?.code;
  return friendly;
}
