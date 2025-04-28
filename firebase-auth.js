// Firebase Authentication Module

// This module handles Firebase authentication functionality for the Vote Not For Sale web app

// Use globally available Firebase services from firebase-init-compat.js
let auth;
let db; // Add db variable to store Firestore instance

// Current user state
let currentUser = null;

// Initialize the auth module
function initAuth() {
    // Check if Firebase auth and db are available from the window object
    if (window.firebase && window.firebase.auth && window.firebase.db) {
        auth = window.firebase.auth(); // Get auth instance
        db = window.firebase.db;     // Get db instance from global scope

        // Listen for auth state changes
        auth.onAuthStateChanged(user => {
            currentUser = user; // Update currentUser state
            if (user) {
                // User is signed in
                console.log('User signed in:', user.uid);
                showUserProfile(user);
                // Enable comment form if on comments page
                if (document.getElementById('comment-form')) {
                    enableCommentForm();
                }
            } else {
                // User is signed out
                console.log('User signed out');
                showAuthButtons();
                // Disable comment form if on comments page
                if (document.getElementById('comment-form')) {
                    disableCommentForm();
                }
            }
        });

        // Set up auth UI event listeners
        setupAuthUIListeners();

        console.log('Firebase Auth and Firestore initialized successfully in firebase-auth.js');
    } else {
        console.error('Firebase auth or db is not available globally (window.firebase). Auth module not initialized.');
    }
}

// Show user profile and hide auth buttons
function showUserProfile(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (authButtons && userProfile && userAvatar && userName) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Set user avatar initial
        const displayName = user.displayName || user.email.split('@')[0];
        userAvatar.textContent = displayName.charAt(0).toUpperCase();
        userName.textContent = displayName;
        
        // Add logout functionality to user profile
        userProfile.onclick = () => {
            if (confirm('Do you want to log out?')) {
                auth.signOut().then(() => {
                    console.log('User signed out');
                }).catch(error => {
                    console.error('Error signing out:', error);
                });
            }
        };
    }
}

// Show auth buttons and hide user profile
function showAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (authButtons && userProfile) {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
}

// Enable comment form for authenticated users
function enableCommentForm() {
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const postCommentBtn = document.getElementById('post-comment-btn');
    
    if (commentForm && commentInput && postCommentBtn) {
        commentForm.classList.remove('disabled');
        commentInput.disabled = false;
        postCommentBtn.disabled = false;
        commentInput.placeholder = 'Share your thoughts...';
    }
}

// Disable comment form for unauthenticated users
function disableCommentForm() {
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const postCommentBtn = document.getElementById('post-comment-btn');
    
    if (commentForm && commentInput && postCommentBtn) {
        commentForm.classList.add('disabled');
        commentInput.disabled = true;
        postCommentBtn.disabled = true;
        commentInput.placeholder = 'Please log in to comment';
    } else {
        // Added check: Log if elements are missing on the current page
        // console.log('Comment form elements not found on this page.');
    }
}


// Consolidated and cleaned-up function to set up auth UI event listeners
function setupAuthUIListeners() {
    // Get DOM elements
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const closeSignupModal = document.getElementById('close-signup-modal');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Check if essential auth UI elements exist on the page
    if (!loginBtn || !signupBtn || !loginModal || !signupModal) {
        console.log("Auth buttons or modals not found on this page. Skipping auth UI listeners setup.");
        return; // Exit if core elements aren't present
    }

    console.log("Setting up Auth UI Listeners...");

    // --- Modal Opening ---
    loginBtn.addEventListener('click', () => loginModal.classList.add('active'));
    signupBtn.addEventListener('click', () => signupModal.classList.add('active'));

    // --- Modal Closing ---
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', () => loginModal.classList.remove('active'));
    }
    if (closeSignupModal) {
        closeSignupModal.addEventListener('click', () => signupModal.classList.remove('active'));
    }

    // Close modal when clicking overlay
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.classList.remove('active');
    });
    signupModal.addEventListener('click', (e) => {
        if (e.target === signupModal) signupModal.classList.remove('active');
    });

    // --- Switching Modals ---
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.remove('active');
            signupModal.classList.add('active');
        });
    }
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    }

    // --- Form Submissions ---

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showAuthNotification('Please enter both email and password.', 'error');
                return;
            }

            const loginSubmitBtn = loginForm.querySelector('button[type="submit"]');
            if (loginSubmitBtn) loginSubmitBtn.disabled = true;

            try {
                console.log('Attempting login for:', email);
                // Use the globally initialized auth object
                await auth.signInWithEmailAndPassword(email, password);
                // onAuthStateChanged handles UI updates after successful login
                console.log('Login successful for:', email);
                showAuthNotification('Logged in successfully!', 'success');
                loginModal.classList.remove('active');
                loginForm.reset();
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Login failed. Please try again.'; // Default message
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMessage = 'Invalid email or password. Please try again.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Please enter a valid email address.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.';
                }
                showAuthNotification(`Login error: ${errorMessage}`, 'error');
            } finally {
                if (loginSubmitBtn) loginSubmitBtn.disabled = false;
            }
        });
    }

    // Handle Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const emailOrPhone = document.getElementById('signup-email').value.trim(); // Assuming email for now
            const password = document.getElementById('signup-password').value;

            if (!name || !emailOrPhone || !password) {
                showAuthNotification('Please fill in all fields.', 'error');
                return;
            }

            // Basic email validation
            const email = emailOrPhone;
            if (!/\S+@\S+\.\S+/.test(email)) {
                showAuthNotification('Please enter a valid email address.', 'error');
                // Add handling for phone numbers later if needed
                return;
            }

            const signupSubmitBtn = signupForm.querySelector('button[type="submit"]'); // More specific selector
            if (signupSubmitBtn) signupSubmitBtn.disabled = true;

            try {
                console.log('Attempting signup for:', email);
                // Use the globally initialized auth object
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log('User created in Auth:', user.uid);

                // Update Firebase Auth profile (displayName)
                await user.updateProfile({ displayName: name });
                console.log('Auth profile updated with displayName:', name);

                // Save additional user data to Firestore
                await saveUserDataToFirestore(user, name); // Ensure this uses the global db

                showAuthNotification('Sign up successful! You are now logged in.', 'success');
                signupModal.classList.remove('active');
                signupForm.reset();
                // onAuthStateChanged will handle showing the user profile
            } catch (error) {
                console.error('Signup error:', error);
                let errorMessage = 'Signup failed. Please try again.'; // Default message
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'This email address is already registered. Please log in or use a different email.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Please enter a valid email address.';
                }
                showAuthNotification(`Signup error: ${errorMessage}`, 'error');
            } finally {
                if (signupSubmitBtn) signupSubmitBtn.disabled = false;
            }
        });
    }

    console.log("Auth UI Listeners setup complete.");
}


// Function to save user data to Firestore
// Ensures it uses the globally initialized 'db' instance
async function saveUserDataToFirestore(user, name) {
    // Ensure db is initialized (should be done in initAuth)
    if (!db) {
        console.error("Firestore database (db) is not initialized in firebase-auth.js. Cannot save user data.");
        showAuthNotification('Error saving profile. Firestore not available.', 'error');
        return;
    }
    // Use the user's UID as the document ID in the 'users' collection
    const userRef = db.collection('users').doc(user.uid);
    console.log(`Preparing to save data for user ${user.uid} to Firestore path: ${userRef.path}`);
    try {
        // Prepare user data object
        const userData = {
            uid: user.uid,
            displayName: name || user.displayName || user.email.split('@')[0], // Use provided name, fallback to auth display name or email part
            email: user.email,
            photoURL: user.photoURL || null, // Save photoURL from auth profile, default to null
            // Use Firestore server timestamp for creation time
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };
        // Use set with merge: true to create or update the document without overwriting existing fields unnecessarily
        await userRef.set(userData, { merge: true });
        console.log("User data successfully saved/merged in Firestore for UID:", user.uid);
    } catch (error) {
        console.error("Error saving user data to Firestore:", error);
        // Notify the user about the error saving profile details
        showAuthNotification('Could not save user profile information to the database.', 'error');
        // Optionally, re-throw the error if higher-level handling is needed
        // throw error;
    }
}

// Utility function to show notifications (ensure it's defined or imported if needed)
// Assuming showAuthNotification is defined elsewhere or copy it here if needed.
function showAuthNotification(message, type = 'success') {
    let notification = document.getElementById('auth-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'auth-notification';
        // Add basic styles inline or ensure CSS is loaded
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.color = 'white';
        notification.style.zIndex = '1000';
        notification.style.display = 'none'; // Initially hidden
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50'; // Red for error, Green for success
    notification.style.display = 'block';
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}


// Call initAuth when the DOM is ready, or ensure it's called after firebase-init-compat.js runs
document.addEventListener('DOMContentLoaded', initAuth);


// Get current user
function getCurrentUser() {
    return currentUser;
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add auth modal styles
    addAuthModalStyles();
    
    // Load the compatibility version of Firebase initialization
    const firebaseInitScript = document.createElement('script');
    firebaseInitScript.src = 'firebase-init-compat.js';
    firebaseInitScript.onload = function() {
        console.log('Firebase initialization script loaded');
    };
    firebaseInitScript.onerror = function() {
        console.error('Failed to load Firebase initialization script');
    };
    
    // Check if Firebase is already initialized
    if (window.firebase && window.firebase.auth) {
        console.log('Firebase already loaded, initializing auth...');
        initAuth();
    } else {
        console.log('Firebase not yet loaded, waiting before initializing auth...');
        // Initialize auth with a small delay to ensure Firebase is loaded
        let attempts = 0;
        const maxAttempts = 15; // Increased max attempts
        const checkInterval = 300; // Check more frequently
        
        const checkFirebase = setInterval(() => {
            attempts++;
            if (window.firebase && window.firebase.auth) {
                console.log(`Firebase available after ${attempts} attempts, initializing auth...`);
                clearInterval(checkFirebase);
                initAuth();
            } else if (attempts >= maxAttempts) {
                console.error('Firebase still not available after multiple attempts. Check Firebase initialization.');
                clearInterval(checkFirebase);
                // Try to load the script again as a last resort
                document.head.appendChild(firebaseInitScript);
            }
        }, checkInterval);
        
        // Add the initialization script to the document
        document.head.appendChild(firebaseInitScript);
    }
});


// Export functions for use in other scripts
window.firebaseAuth = {
    getCurrentUser,
    initAuth,
    showUserProfile,
    showAuthButtons
};


// Function to create user profile in Firestore
async function createUserProfile(user) {
    if (!user) return; // Exit if no user object is provided

    const userRef = doc(db, "users", user.uid); // Use user.uid as the document ID
    const defaultAvatar = "img/default-avatar.png"; // Define your default avatar path

    try {
        await setDoc(userRef, {
            userId: user.uid,
            email: user.email,
            avatarUrl: defaultAvatar,
            createdAt: serverTimestamp() // Optional: track when the profile was created
        });
        console.log("User profile created successfully in Firestore for:", user.email);
    } catch (error) {
        console.error("Error creating user profile in Firestore:", error);
        // Optionally notify the user, but signup itself was successful
        showAuthNotification(`Account created, but profile setup failed: ${error.message}`, 'warning');
    }
}

// Sign Up Handler
async function handleSignUp(event) {
    event.preventDefault(); // Prevent form submission from reloading the page

    const emailInput = document.getElementById('signup-email'); // Replace with your actual input ID
    const passwordInput = document.getElementById('signup-password'); // Replace with your actual input ID
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthNotification("Please enter both email and password.", "error");
        return;
    }
    // Basic password length check (Firebase enforces minimum 6)
    if (password.length < 6) {
         showAuthNotification("Password must be at least 6 characters long.", "error");
         return;
    }


    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Sign up successful for:", user.email);

        // Create user profile in Firestore after successful signup
        await createUserProfile(user);

        showAuthNotification(`Welcome, ${user.email}! Sign up successful.`, "success");
        // Optionally close the modal or redirect
        closeAuthModal(); // Example function call

    } catch (error) {
        console.error("Sign up error:", error);
        // Provide user-friendly error messages
        let errorMessage = "Sign up failed. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email address is already registered. Please log in.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password is too weak. Please choose a stronger password.";
        } else if (error.code === 'auth/invalid-email') {
             errorMessage = "Please enter a valid email address.";
        }
        showAuthNotification(errorMessage, "error");
    }
}

// Add event listener to your sign-up button
const signupButton = document.getElementById('signup-submit-btn'); // Replace with your actual button ID
if (signupButton) {
    signupButton.addEventListener('click', handleSignUp);
} else {
    console.error("Sign up button not found.");
}

// Log In Handler
async function handleLogin(event) {
    event.preventDefault(); // Prevent form submission

    const emailInput = document.getElementById('login-email'); // Replace with your actual input ID
    const passwordInput = document.getElementById('login-password'); // Replace with your actual input ID
    const email = emailInput.value.trim();
    const password = passwordInput.value;

     if (!email || !password) {
        showAuthNotification("Please enter both email and password.", "error");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Login successful for:", user.email);
        showAuthNotification(`Welcome back, ${user.email}!`, "success");

        // NOTE: We don't typically need to create/update the profile on *every* login,
        // as it was created during signup. You could add a check here if needed,
        // e.g., to update a 'lastLogin' timestamp in the Firestore profile.

        // Optionally close the modal or redirect
        closeAuthModal(); // Example function call

    } catch (error) {
        console.error("Login error:", error);
         // Provide user-friendly error messages
        let errorMessage = "Login failed. Please check your credentials.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             errorMessage = "Invalid email or password. Please try again.";
        } else if (error.code === 'auth/invalid-email') {
             errorMessage = "Please enter a valid email address.";
        } else if (error.code === 'auth/too-many-requests') {
             errorMessage = "Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.";
        }
        showAuthNotification(errorMessage, "error");
    }
}

// Add event listener to your login button
const loginButton = document.getElementById('login-submit-btn'); // Replace with your actual button ID
if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
} else {
    console.error("Login button not found.");
}

// --- Helper functions (you might already have these) ---

// Example function to show notifications to the user
function showAuthNotification(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    // Replace with your actual UI notification logic
    const notificationElement = document.getElementById('auth-notification'); // Example ID
    if (notificationElement) {
        notificationElement.textContent = message;
        notificationElement.className = `notification ${type}`; // Add type class for styling
        notificationElement.style.display = 'block'; // Or add a class to show it
        // Optional: Hide after a few seconds
        setTimeout(() => {
             if (notificationElement) notificationElement.style.display = 'none';
        }, 5000);
    } else {
         alert(`${type.toUpperCase()}: ${message}`); // Fallback
    }
}

// Example function to close login/signup modal
function closeAuthModal() {
    const loginModal = document.getElementById('login-modal'); // Example ID
    const signupModal = document.getElementById('signup-modal'); // Example ID
    if (loginModal) loginModal.classList.remove('active'); // Or hide it appropriately
    if (signupModal) signupModal.classList.remove('active');
    console.log("Closing auth modal (example)");
}