import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Web config for the "deepscan-keerthan" Firebase project. These values are public by design.
const firebaseConfig = {
  apiKey: "AIzaSyAFNfKttrQe6yz_cGZiGzjfRjof88FbE_w",
  authDomain: "deepscan-keerthan.firebaseapp.com",
  projectId: "deepscan-keerthan",
  storageBucket: "deepscan-keerthan.firebasestorage.app",
  messagingSenderId: "221801267069",
  appId: "1:221801267069:web:737104591fdb7b0fe41614",
};

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error("Missing required Firebase configuration");
}

// Initialize Firebase
let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Configure Google Provider with custom parameters
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  console.log("✅ Firebase initialized successfully with project:", firebaseConfig.projectId);
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  throw error;
}

export { auth, googleProvider };
export default app;
