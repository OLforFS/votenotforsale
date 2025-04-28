// ... existing code ...

// Import Firestore functions if using modules, otherwise use window.firebase
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";

// Reference to Firestore
const db = getFirestore(); // Assumes Firebase is already initialized

// Handle form submission
document.getElementById('pledge-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const amount = Number(document.getElementById('amount').value);

    if (!name || !email || isNaN(amount)) {
        alert('Please fill in all fields correctly.');
        return;
    }

    try {
        // Check for duplicate email
        const pledgesRef = collection(db, "pledges");
        const q = query(pledgesRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert("A pledge with this email already exists.");
            return;
        }

        // Add new pledge
        await addDoc(pledgesRef, {
            name,
            email,
            amount
        });

        console.log("Pledge submitted successfully");
        alert("Pledge submitted successfully");
        // Optionally reset the form
        e.target.reset();
    } catch (error) {
        console.error("Error submitting pledge:", error);
        alert("Error submitting pledge: " + error.message);
    }
});

// ... existing code ...