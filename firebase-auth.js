// Firebase Authentication Module

// This module handles Firebase authentication functionality for the Vote Not For Sale web app

// Make this a module script to work with firebase-init-new.js
// Import Firebase auth if needed (will use window.firebase.auth if available)
let auth;

// Current user state
let currentUser = null;

// Initialize the auth module
function initAuth() {
    // Check if Firebase auth is available from the window object (set by firebase-init-new.js)
    if (window.firebase && window.firebase.auth) {
        auth = window.firebase.auth;
        
        // Listen for auth state changes
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                currentUser = user;
                showUserProfile(user);
                // Enable comment form if on comments page
                if (document.getElementById('comment-form')) {
                    enableCommentForm();
                }
            } else {
                // User is signed out
                currentUser = null;
                showAuthButtons();
                // Disable comment form if on comments page
                if (document.getElementById('comment-form')) {
                    disableCommentForm();
                }
            }
        });
        
        // Set up auth UI event listeners
        setupAuthUIListeners();
        
        console.log('Firebase Auth initialized successfully');
    } else {
        console.error('Firebase is not available. Auth module not initialized.');
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
    }
}

// Set up auth UI event listeners
function setupAuthUIListeners() {
    // Get DOM elements
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    let loginModal = document.getElementById('login-modal');
    let signupModal = document.getElementById('signup-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const closeSignupModal = document.getElementById('close-signup-modal');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginModalOverlay = document.getElementById('login-modal'); // Assuming overlay has same ID as modal
    const signupModalOverlay = document.getElementById('signup-modal'); // Assuming overlay has same ID as modal

    // Check if we're on a page with auth UI elements
    if (!loginBtn || !signupBtn || !loginModal || !signupModal) return;

    // --- Add Event Listeners for Modals ---

    // Open Login Modal
    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
    });

    // Open Signup Modal
    signupBtn.addEventListener('click', () => {
        signupModal.classList.add('active');
    });

    // Close Login Modal
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
    }
    // Close Signup Modal
    if (closeSignupModal) {
        closeSignupModal.addEventListener('click', () => {
            signupModal.classList.remove('active');
        });
    }

    // Close modal when clicking overlay (for both modals)
    if (loginModalOverlay) {
        loginModalOverlay.addEventListener('click', (e) => {
            if (e.target === loginModalOverlay) { // Only close if clicking the overlay itself
                loginModal.classList.remove('active');
            }
        });
    }
    if (signupModalOverlay) {
        signupModalOverlay.addEventListener('click', (e) => {
            if (e.target === signupModalOverlay) { // Only close if clicking the overlay itself
                signupModal.classList.remove('active');
            }
        });
    }

    // Switch from Login to Signup
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.remove('active');
            signupModal.classList.add('active');
        });
    }

    // Switch from Signup to Login
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    }

    // --- End Event Listeners for Modals ---

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            try {
                // Create user with email and password
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                // Update user profile with display name
                await userCredential.user.updateProfile({
                    displayName: name
                });
                // Add user data to Firestore
                const db = window.firebase.db;
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                // Close signup modal and reset form
                signupModal.classList.remove('active');
                signupForm.reset();
                // Show success message with animation
                const successMessage = document.createElement('div');
                successMessage.id = 'auth-success-message';
                successMessage.innerHTML = `
                    <div class="success-content">
                        <span class="success-icon">✓</span>
                        <p>Account created successfully!</p>
                        <div class="countdown-bar">
                            <div class="countdown-progress"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(successMessage);
                // Add styles if not already present
                if (!document.getElementById('auth-notification-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'auth-notification-styles';
                    styles.textContent = `
                        #auth-success-message {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #4CAF50;
                            color: white;
                            padding: 15px;
                            border-radius: 4px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                            opacity: 0;
                            transform: translateX(100%);
                            transition: all 0.3s ease;
                            z-index: 1000;
                        }
                        #auth-success-message.active {
                            opacity: 1;
                            transform: translateX(0);
                        }
                        .success-content {
                            display: flex;
                            align-items: center;
                        }
                        .success-icon {
                            font-size: 24px;
                            margin-right: 10px;
                        }
                        .countdown-bar {
                            width: 100px;
                            height: 4px;
                            background: rgba(255,255,255,0.3);
                            border-radius: 2px;
                            margin-left: 10px;
                            overflow: hidden;
                        }
                        .countdown-progress {
                            width: 100%;
                            height: 100%;
                            background: white;
                            animation: countdown 2s linear forwards;
                        }
                        @keyframes countdown {
                            from { width: 100%; }
                            to { width: 0; }
                        }
                    `;
                    document.head.appendChild(styles);
                }
                setTimeout(() => {
                    successMessage.classList.add('active');
                    setTimeout(() => {
                        successMessage.classList.remove('active');
                        setTimeout(() => successMessage.remove(), 300);
                    }, 2000);
                }, 100);
            } catch (error) {
                console.error('Signup error:', error);
                // Show error message with animation
                const errorMessage = document.createElement('div');
                errorMessage.id = 'auth-error-message';
                errorMessage.innerHTML = `
                    <div class="error-content">
                        <span class="error-icon">⚠</span>
                        <p>${error.message || 'Signup failed. Please try again.'}</p>
                        <div class="countdown-bar">
                            <div class="countdown-progress"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(errorMessage);
                if (!document.getElementById('auth-notification-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'auth-notification-styles';
                    styles.textContent = `
                        #auth-error-message {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #f44336;
                            color: white;
                            padding: 15px;
                            border-radius: 4px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                            opacity: 0;
                            transform: translateX(100%);
                            transition: all 0.3s ease;
                            z-index: 1000;
                        }
                        #auth-error-message.active {
                            opacity: 1;
                            transform: translateX(0);
                        }
                        .error-content {
                            display: flex;
                            align-items: center;
                        }
                        .error-icon {
                            font-size: 24px;
                            margin-right: 10px;
                        }
                        .countdown-bar {
                            width: 100px;
                            height: 4px;
                            background: rgba(255,255,255,0.3);
                            border-radius: 2px;
                            margin-left: 10px;
                            overflow: hidden;
                        }
                        .countdown-progress {
                            width: 100%;
                            height: 100%;
                            background: white;
                            animation: countdown 2s linear forwards;
                        }
                        @keyframes countdown {
                            from { width: 100%; }
                            to { width: 0; }
                        }
                    `;
                    document.head.appendChild(styles);
                }
                setTimeout(() => {
                    errorMessage.classList.add('active');
                    setTimeout(() => {
                        errorMessage.classList.remove('active');
                        setTimeout(() => errorMessage.remove(), 300);
                    }, 2000);
                }, 100);
            }
        });
    }
    
    // Create auth modals if they don't exist
    if (!loginModal || !signupModal) {
        createAuthModals();
        loginModal = document.getElementById('login-modal');
        signupModal = document.getElementById('signup-modal');
    }
    
    // Modal event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked');
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.classList.add('active');
            } else {
                console.error('Login modal not found in the DOM');
                createAuthModals();
                document.getElementById('login-modal').classList.add('active');
            }
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            console.log('Signup button clicked');
            const signupModal = document.getElementById('signup-modal');
            if (signupModal) {
                signupModal.classList.add('active');
            } else {
                console.error('Signup modal not found in the DOM');
                createAuthModals();
                document.getElementById('signup-modal').classList.add('active');
            }
        });
    }
    
    // Close buttons for modals
    document.querySelectorAll('.close-auth-modal').forEach(button => {
        // Add event listener directly instead of cloning and replacing
        button.addEventListener('click', () => {
            button.closest('.auth-modal-overlay').classList.remove('active');
        });
    });
    
    // Switch between login and signup
    if (switchToSignup) {
        // Add event listener directly instead of cloning and replacing
        switchToSignup.addEventListener('click', () => {
            document.getElementById('login-modal').classList.remove('active');
            document.getElementById('signup-modal').classList.add('active');
        });
    }
    
    if (switchToLogin) {
        // Add event listener directly instead of cloning and replacing
        switchToLogin.addEventListener('click', () => {
            document.getElementById('signup-modal').classList.remove('active');
            document.getElementById('login-modal').classList.add('active');
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('auth-modal-overlay')) {
            e.target.classList.remove('active');
        }
    });
    
    // Login form submission
    if (loginForm) {
        // Add event listener directly instead of cloning and replacing
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            console.log('Login form submitted with email:', email);
            
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log('Login successful');
                    // Close modal
                    document.getElementById('login-modal').classList.remove('active');
                    loginForm.reset();
                })
                .catch((error) => {
                    console.error('Login error:', error);
                    alert(`Login error: ${error.message}`);
                });
        });
    }
    
    // Signup form submission
    if (signupForm) {
        console.log('Setting up signup form submission handler');
        
        // Add event listener to the signup button instead of form submission
        const signupSubmitBtn = document.getElementById('signup-submit-btn');
        if (signupSubmitBtn) {
            console.log('Adding click event listener to signup button');
            signupSubmitBtn.addEventListener('click', function(event) {
                console.log('Signup button clicked');
                
                // Stop event propagation to prevent conflicts
                event.stopPropagation();
                
                const name = document.getElementById('signup-name').value;
                const emailOrPhone = document.getElementById('signup-email').value.trim();
                const password = document.getElementById('signup-password').value;
                
                // Check if input is a Philippine phone number
                const isPhilippinePhone = /^(\+?639|09)\d{9}$/.test(emailOrPhone);
                
                if (isPhilippinePhone) {
                    // Format phone number to international format for Firebase
                    let formattedPhone = emailOrPhone;
                    if (emailOrPhone.startsWith('09')) {
                        formattedPhone = '+63' + emailOrPhone.substring(1);
                    } else if (emailOrPhone.startsWith('639')) {
                        formattedPhone = '+' + emailOrPhone;
                    }
                    
                    console.log('Attempting to sign up with phone number:', formattedPhone);
                    
                    // For phone authentication, we need to set up reCAPTCHA verification
                    alert('Phone authentication is not fully implemented yet. Please use an email address to sign up.');
                    
                    // This is where phone authentication would be implemented
                    // We would need to set up reCAPTCHA and use signInWithPhoneNumber
                    // For now, we'll just show an error message
                } else {
                    // Proceed with email authentication
                    console.log('Attempting to sign up with email:', emailOrPhone);
                    
                    auth.createUserWithEmailAndPassword(emailOrPhone, password)
                        .then((userCredential) => {
                            // Update profile with display name
                            return userCredential.user.updateProfile({
                                displayName: name
                            });
                        })
                        .then(() => {
                            // Close modal
                            document.getElementById('signup-modal').classList.remove('active');
                            signupForm.reset();
                            console.log('User registered successfully');
                        })
                        .catch((error) => {
                            console.error('Signup error:', error);
                            alert(`Signup error: ${error.message}`);
                        });
                }
            });
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create auth modals first to ensure they exist
    createAuthModals();
    addAuthModalStyles();
    // Then initialize auth
    setTimeout(initAuth, 100);
    // Remove signup button event listener here to avoid duplicate/conflicting logic
});

// Make createAuthModals function globally accessible
window.firebase = window.firebase || {};
window.firebase.createAuthModals = createAuthModals;

// Create auth modals if they don't exist in the DOM
function createAuthModals() {
    console.log('Creating auth modals');
    // Check if modals already exist
    if (document.getElementById('login-modal') && document.getElementById('signup-modal')) {
        return;
    }
    
    // Create login modal
    const loginModal = document.createElement('div');
    loginModal.className = 'auth-modal-overlay';
    loginModal.id = 'login-modal';
    loginModal.innerHTML = `
        <div class="auth-modal">
            <div class="auth-modal-header">
                <h2 class="auth-modal-title">Log In</h2>
                <button class="close-auth-modal" id="close-login-modal">&times;</button>
            </div>
            <form class="auth-form" id="login-form">
                <div class="form-group">
                    <label for="login-email">Email</label>
                    <input type="email" id="login-email" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" required>
                </div>
                <button type="submit" class="auth-submit-btn">Log In</button>
                <div class="auth-switch">
                    Don't have an account? <a id="switch-to-signup">Sign Up</a>
                </div>
            </form>
        </div>
    `;
    
    // Create signup modal
    const signupModal = document.createElement('div');
    signupModal.className = 'auth-modal-overlay';
    signupModal.id = 'signup-modal';
    signupModal.innerHTML = `
        <div class="auth-modal">
            <div class="auth-modal-header">
                <h2 class="auth-modal-title">Sign Up</h2>
                <button class="close-auth-modal" id="close-signup-modal">&times;</button>
            </div>
            <form class="auth-form" id="signup-form" onsubmit="return false;">
                <div class="form-group">
                    <label for="signup-name">Name</label>
                    <input type="text" id="signup-name" required>
                </div>
                <div class="form-group">
                    <label for="signup-email">Email or Phone Number</label>
                    <input type="text" id="signup-email" placeholder="Email or Philippine phone number (e.g., +639123456789)" required>
                </div>
                <div class="form-group">
                    <label for="signup-password">Password</label>
                    <input type="password" id="signup-password" required>
                </div>
                <button type="button" id="signup-submit-btn" class="auth-submit-btn">Sign Up</button>
                <div class="auth-switch">
                    Already have an account? <a id="switch-to-login">Log In</a>
                </div>
            </form>
        </div>
    `;
    
    // Add modals to the document
    document.body.appendChild(loginModal);
    document.body.appendChild(signupModal);
    
    // Re-setup event listeners
    setupAuthUIListeners();
    
    // Add auth modal styles
    addAuthModalStyles();
    
    return { loginModal, signupModal };
}

// Add auth modal styles if not already present
function addAuthModalStyles() {
    // Check if styles already exist
    if (document.getElementById('auth-modal-styles')) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'auth-modal-styles';
    styleElement.textContent = `
        /* Auth modals */
        .auth-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .auth-modal-overlay.active {
            opacity: 1;
            visibility: visible;
            display: flex !important;
            pointer-events: auto;
            z-index: 9999;
        }
        
        .auth-modal {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .auth-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .auth-modal-title {
            font-size: 1.5rem;
            color: #2c3e50;
            margin: 0;
        }
        
        .close-auth-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #7f8c8d;
        }
        
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }
        
        .form-group label {
            font-weight: 500;
            color: #2c3e50;
        }
        
        .form-group input {
            padding: 0.8rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .auth-submit-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 0.8rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            margin-top: 0.5rem;
        }
        
        .auth-submit-btn:hover {
            background-color: #2980b9;
        }
        
        .auth-switch {
            text-align: center;
            margin-top: 1rem;
            color: #7f8c8d;
        }
        
        .auth-switch a {
            color: #3498db;
            text-decoration: none;
            cursor: pointer;
        }
    `;
    
    document.head.appendChild(styleElement);
}

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