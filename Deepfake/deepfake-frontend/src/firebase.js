import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your new Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9_NcjbJweTYi14YHdiye3gE7Wk1xFPtk",
  authDomain: "deepfake-auth-e79a8-b4ffa.firebaseapp.com",
  projectId: "deepfake-auth-e79a8-b4ffa",
  storageBucket: "deepfake-auth-e79a8-b4ffa.firebasestorage.app",
  messagingSenderId: "350920339876",
  appId: "1:350920339876:web:848f77d4d92f5b63ba5131",
  measurementId: "G-P5LTT34SCK"
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
