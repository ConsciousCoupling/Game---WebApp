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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config early — prevents silent crashes in Firestore
function validateConfig(config) {
  if (!config.apiKey) {
    throw new Error(
      "Firebase configuration error: VITE_FIREBASE_API_KEY is missing. Check your .env file and rebuild the app."
    );
  }

  if (!config.apiKey.startsWith("AIza")) {
    throw new Error(
      "Firebase configuration error: API key format is invalid."
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
