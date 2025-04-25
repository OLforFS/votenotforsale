// Firebase initialization script using CDN approach

// Import the functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWxGHZp6PhpNM71kB9w2yX3eFISvRYEf0",
  authDomain: "votenotforsaleph.firebaseapp.com",
  projectId: "votenotforsaleph",
  storageBucket: "votenotforsaleph.firebasestorage.app",
  messagingSenderId: "525832942491",
  appId: "1:525832942491:web:2b94db6735e21efd92273e",
  measurementId: "G-EBB1FJWWS9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services for use in other scripts
window.firebase = {
  app,
  analytics,
  auth,
  db,
  firestore: {
    FieldValue: {
      serverTimestamp: () => new Date(),
      increment: (val) => val
    }
  }
};

console.log('Firebase initialized successfully with CDN approach');