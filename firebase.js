// Firebase configuration and database functionality

// Import the functions from the Firebase SDK (npm package)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, onSnapshot, getCountFromServer } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCNY7zWuipfrxlrToo7Lco6dc51RQKUeQ",
  authDomain: "myvoteisnotforsale-eb79e.firebaseapp.com",
  projectId: "myvoteisnotforsale-eb79e",
  storageBucket: "myvoteisnotforsale-eb79e.firebasestorage.app",
  messagingSenderId: "787887322996",
  appId: "1:787887322996:web:29b41d348ac5b7bed69e21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the Firestore db object for use in other parts of the application
export { db };

// Additional utility functions (similar to those in firebase-config.js)

// Save document to a Firestore collection
export async function saveToFirestore(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`Document successfully saved to ${collectionName} with ID: `, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`Error saving document to ${collectionName}: `, error);
    throw error; // Re-throw to handle in the calling function
  }
}

// Get document count from a Firestore collection
export async function getCollectionCount(collectionName) {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getCountFromServer(collectionRef);
    return snapshot.data().count;
  } catch (error) {
    console.error(`Error getting count from ${collectionName}: `, error);
    throw error;
  }
}

// Setup real-time listener for collection updates
export function setupCollectionListener(collectionName, callback) {
  try {
    const collectionRef = collection(db, collectionName);
    
    // Listen for changes in the collection
    return onSnapshot(collectionRef, (snapshot) => {
      callback(snapshot);
    }, (error) => {
      console.error(`Error listening to ${collectionName}: `, error);
    });
  } catch (error) {
    console.error(`Error setting up listener for ${collectionName}: `, error);
    return null;
  }
}