// ---------------------------------------------------------------------------
// FIREBASE INITIALIZATION — Singleton, HMR-Safe, Vite-Compatible
// ---------------------------------------------------------------------------
// Prevents:
//   - duplicate Firebase apps during hot reload
//   - broken Firestore listeners
//   - missing environment variables
//   - SSR issues (if you ever expand platform)
// ---------------------------------------------------------------------------

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Safely read config from Vite environment
const firebaseConfig = {
 // apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 apiKey: "AIzaSyBvRciJasrFPscQrFs52mg0Bmxq3LEm1qk",
  authDomain: "intima-date.firebaseapp.com",
  projectId: "intima-date",
  storageBucket: "intima-date.firebasestorage.app",
  messagingSenderId: "1059417189725",
  appId: "1:1059417189725:web:2dfbd47e2c7d6bef678cb4",
  measurementId: "G-F8PQ70C0QV",
};

// Validate config early — prevents silent crashes in Firestore
function validateConfig(config) {
  if (!config.apiKey) {
    console.error(
      "%cFirebase Error:%c Missing environment variables (VITE_FIREBASE_API_KEY).",
      "color:red;font-weight:bold;", ""
    );
  }
}

validateConfig(firebaseConfig);

// ---------------------------------------------------------------------------
// SINGLETON INITIALIZATION (HMR Safe)
// ---------------------------------------------------------------------------
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Export Firestore instance
export const db = getFirestore(app);
export const auth = getAuth(app);

let authPromise = null;

export function ensureAnonymousAuth() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  if (!authPromise) {
    authPromise = signInAnonymously(auth)
      .then((credential) => credential.user)
      .catch((error) => {
        authPromise = null;
        throw error;
      });
  }

  return authPromise;
}

// Export the app too (useful for auth/storage in future)
export { app };
