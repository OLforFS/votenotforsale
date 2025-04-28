// Initialize the Firebase Pledge System
import { initPledgeSystem } from './firebase-pledge.js';
import { initializeApp, getApps } from 'firebase/app';

// Make initPledgeSystem available globally
window.initPledgeSystem = initPledgeSystem;

// Initialize the pledge system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Firebase Pledge System...');
  
  // Add a small delay to ensure Firebase is fully loaded
  setTimeout(() => {
    // Ensure Firebase is loaded before initializing the pledge system
    if (typeof firebase !== 'undefined') {
      console.log('Firebase is loaded. Initializing pledge system...');
      initPledgeSystem();
    } else {
      console.error('Firebase is not loaded. Cannot initialize pledge system.');
      // Try to load Firebase from the global scope if available
      if (window.firebase) {
        console.log('Found Firebase in window object. Initializing pledge system...');
        initPledgeSystem();
      } else {
        // If Firebase is still not available, show an error message
        alert('Firebase could not be loaded. Please refresh the page and try again.');
      }
    }
  }, 1000); // Increased delay to ensure scripts are fully loaded
});

if (!getApps().length) {
  initializeApp(firebaseConfig);
}