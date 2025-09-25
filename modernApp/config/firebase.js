// modernApp/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { Logger } from '../utils/Logger.js';

// Firebase configuration
// Note: These are public configuration values and are safe to include in client code
const firebaseConfig = {
  // This will be replaced with actual values when you run `firebase init`
  // For now, using placeholder values that work with Firebase emulator
  apiKey: "demo-api-key",
  authDomain: "vitality-system-builder.firebaseapp.com",
  projectId: "vitality-system-builder",
  storageBucket: "vitality-system-builder.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase app
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Connect to emulator in development if running locally
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    try {
      // Only connect to emulator if not already connected
      if (!db._delegate._databaseId.projectId.includes('(default)')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        Logger.info('[Firebase] Connected to local emulators');
      }
    } catch (error) {
      // Emulator connection errors are non-fatal in development
      Logger.warn('[Firebase] Could not connect to emulators:', error.message);
    }
  }
  
  Logger.info('[Firebase] Initialized successfully');
} catch (error) {
  Logger.error('[Firebase] Initialization failed:', error);
  // Create fallback objects to prevent app crashes
  db = null;
  auth = null;
}

// Firebase service instances
export { db, auth };

// Firebase app instance
export { app };

// Utility function to check if Firebase is available
export function isFirebaseAvailable() {
  return db !== null && auth !== null;
}

// Utility function to get connection status
export function getFirebaseStatus() {
  return {
    connected: isFirebaseAvailable(),
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    emulator: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  };
}

// Export configuration for debugging
export { firebaseConfig };