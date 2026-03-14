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
import { getValidatedFirebaseConfig } from "./firebaseConfig";

const firebaseConfig = getValidatedFirebaseConfig(import.meta.env, {
  context: "runtime",
});

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
