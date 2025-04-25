import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Get DOM elements
const pledgeButton = document.getElementById('pledge-button');
const pledgeModal = document.getElementById('pledge-modal');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.querySelector('.cancel-btn');
const pledgeForm = document.getElementById('pledge-form');

// Open modal when pledge button is clicked
pledgeButton.addEventListener('click', () => {
    pledgeModal.style.display = 'block';
});

// Close modal when X is clicked
closeBtn.addEventListener('click', () => {
    pledgeModal.style.display = 'none';
});

// Close modal when Cancel is clicked
cancelBtn.addEventListener('click', () => {
    pledgeModal.style.display = 'none';
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === pledgeModal) {
        pledgeModal.style.display = 'none';
    }
});

// Handle form submission
pledgeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const hasPledged = document.getElementById('pledge-checkbox').checked;
    
    if (hasPledged) {
        try {
            // Add a new document to Firestore
            await addDoc(collection(db, "pledges"), {
                name: name,
                email: email,
                pledged: true,
                timestamp: serverTimestamp()
            });
            
            // Show success message
            alert("Thank you for taking the pledge!");
            
            // Reset form and close modal
            pledgeForm.reset();
            pledgeModal.style.display = 'none';
        } catch (error) {
            console.error("Error adding pledge: ", error);
            alert("There was an error submitting your pledge. Please try again.");
        }
    }
});