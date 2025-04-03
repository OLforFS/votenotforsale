// Firebase Authentication Module

// This module handles Firebase authentication functionality for the Vote Not For Sale web app

// Initialize auth when Firebase is available
let auth;

// Current user state
let currentUser = null;

// Initialize the auth module
function initAuth() {
    if (typeof firebase !== 'undefined') {
        auth = firebase.auth();
        
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
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const closeSignupModal = document.getElementById('close-signup-modal');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // Check if we're on a page with auth UI elements
    if (!loginBtn || !signupBtn) return;
    
    // Create auth modals if they don't exist
    if (!loginModal || !signupModal) {
        createAuthModals();
    }
    
    // Modal event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('login-modal').classList.add('active');
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            document.getElementById('signup-modal').classList.add('active');
        });
    }
    
    // Close buttons for modals
    document.querySelectorAll('.close-auth-modal').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.auth-modal-overlay').classList.remove('active');
        });
    });
    
    // Switch between login and signup
    if (switchToSignup) {
        switchToSignup.addEventListener('click', () => {
            document.getElementById('login-modal').classList.remove('active');
            document.getElementById('signup-modal').classList.add('active');
        });
    }
    
    if (switchToLogin) {
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
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Close modal
                    document.getElementById('login-modal').classList.remove('active');
                    loginForm.reset();
                })
                .catch((error) => {
                    alert(`Login error: ${error.message}`);
                });
        });
    }
    
    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            auth.createUserWithEmailAndPassword(email, password)
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
                })
                .catch((error) => {
                    alert(`Signup error: ${error.message}`);
                });
        });
    }
}

// Create auth modals if they don't exist in the DOM
function createAuthModals() {
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
            <form class="auth-form" id="signup-form">
                <div class="form-group">
                    <label for="signup-name">Name</label>
                    <input type="text" id="signup-name" required>
                </div>
                <div class="form-group">
                    <label for="signup-email">Email</label>
                    <input type="email" id="signup-email" required>
                </div>
                <div class="form-group">
                    <label for="signup-password">Password</label>
                    <input type="password" id="signup-password" required>
                </div>
                <button type="submit" class="auth-submit-btn">Sign Up</button>
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
            display: flex;
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
    
    // Initialize auth with a small delay to ensure Firebase is loaded
    setTimeout(() => {
        initAuth();
    }, 1000);
});

// Export functions for use in other scripts
window.firebaseAuth = {
    getCurrentUser,
    initAuth,
    showUserProfile,
    showAuthButtons
};