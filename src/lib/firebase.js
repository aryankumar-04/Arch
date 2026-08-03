import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration loaded dynamically from environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances to use in your components
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Firestore persistence not supported by browser');
  }
});

export const googleProvider = new GoogleAuthProvider();

// Authentication Helpers
export const logInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("Error signing in", err);
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Error signing out", err);
  }
};