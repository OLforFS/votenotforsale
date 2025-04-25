// Firebase initialization script using compatibility version

// This script initializes Firebase using the compatibility version of the SDK
// which works better with Content Security Policy and doesn't require module imports

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCNY7zWuipfrxlrToo7Lco6dc51RQKUeQ",
  authDomain: "myvoteisnotforsale-eb79e.firebaseapp.com",
  projectId: "myvoteisnotforsale-eb79e",
  storageBucket: "myvoteisnotforsale-eb79e.firebasestorage.app",
  messagingSenderId: "787887322996",
  appId: "1:787887322996:web:29b41d348ac5b7bed69e21"
};

// Initialize Firebase
// This script assumes the following Firebase SDK scripts are loaded in the HTML:
// - firebase-app-compat.js
// - firebase-firestore-compat.js
// - firebase-analytics-compat.js
// - firebase-auth-compat.js

// Initialize Firebase if it hasn't been initialized yet
if (typeof firebase !== 'undefined') {
  try {
    // Initialize Firebase app
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig, { merge: true });
    }
  
    // Initialize Firebase services
    const app = firebase.app();
    const analytics = firebase.analytics();
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Set Firestore settings to allow offline persistence
    db.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    
    // Enable offline persistence when possible
    try {
      db.enablePersistence({
        synchronizeTabs: true
      }).catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          console.log('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          // The current browser does not support persistence
          console.log('Persistence not supported in this browser');
        }
      });
    } catch (persistenceError) {
      console.warn('Error enabling persistence:', persistenceError);
    }
    
    // Make Firebase services available globally
    window.firebase = {
      app,
      analytics,
      auth,
      db,
      firestore: firebase.firestore
    };
    
    console.log('Firebase initialized successfully with compatibility version');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  console.error('Firebase SDK not loaded. Make sure to include the Firebase scripts in your HTML.');
}