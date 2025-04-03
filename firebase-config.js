// Firebase configuration

// Import Firebase SDK functions
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, getCountFromServer } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the Firestore db object and Firebase app
export { db, app };

// Utility functions for Firestore operations

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