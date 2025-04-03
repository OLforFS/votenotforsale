// Comments and Authentication functionality

// DOM Elements
const authButtons = document.getElementById('auth-buttons');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
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
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const postCommentBtn = document.getElementById('post-comment-btn');
const commentsList = document.getElementById('comments-list');

// Current user state
let currentUser = null;

// Collection references
const commentsCollection = db.collection('comments');
const likesCollection = db.collection('likes');
const repliesCollection = db.collection('replies');

// Check authentication state on page load
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        currentUser = user;
        showUserProfile(user);
        enableCommentForm();
        loadComments();
    } else {
        // User is signed out
        currentUser = null;
        showAuthButtons();
        disableCommentForm();
        loadComments(); // Still load comments, but disable interaction
    }
});

// Show user profile and hide auth buttons
function showUserProfile(user) {
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

// Show auth buttons and hide user profile
function showAuthButtons() {
    authButtons.style.display = 'flex';
    userProfile.style.display = 'none';
}

// Enable comment form for authenticated users
function enableCommentForm() {
    commentForm.classList.remove('disabled');
    commentInput.disabled = false;
    postCommentBtn.disabled = false;
}

// Disable comment form for unauthenticated users
function disableCommentForm() {
    commentForm.classList.add('disabled');
    commentInput.disabled = true;
    postCommentBtn.disabled = true;
    commentInput.placeholder = 'Please log in to comment';
}

// Modal event listeners
loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
});

signupBtn.addEventListener('click', () => {
    signupModal.classList.add('active');
});

closeLoginModal.addEventListener('click', () => {
    loginModal.classList.remove('active');
});

closeSignupModal.addEventListener('click', () => {
    signupModal.classList.remove('active');
});

switchToSignup.addEventListener('click', () => {
    loginModal.classList.remove('active');
    signupModal.classList.add('active');
});

switchToLogin.addEventListener('click', () => {
    signupModal.classList.remove('active');
    loginModal.classList.add('active');
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('active');
    }
    if (e.target === signupModal) {
        signupModal.classList.remove('active');
    }
});

// Login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Close modal
            loginModal.classList.remove('active');
            loginForm.reset();
        })
        .catch((error) => {
            alert(`Login error: ${error.message}`);
        });
});

// Signup form submission
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
            signupModal.classList.remove('active');
            signupForm.reset();
        })
        .catch((error) => {
            alert(`Signup error: ${error.message}`);
        });
});

// Post comment
postCommentBtn.addEventListener('click', () => {
    const commentText = commentInput.value.trim();
    
    if (!commentText) return;
    if (!currentUser) {
        alert('Please log in to post a comment');
        return;
    }
    
    const comment = {
        text: commentText,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likeCount: 0
    };
    
    commentsCollection.add(comment)
        .then(() => {
            commentInput.value = '';
        })
        .catch(error => {
            console.error('Error adding comment:', error);
            alert('Error posting comment. Please try again.');
        });
});

// Load comments
function loadComments() {
    commentsCollection.orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            commentsList.innerHTML = '';
            
            if (snapshot.empty) {
                commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const comment = doc.data();
                comment.id = doc.id;
                
                // Format date
                const date = comment.createdAt ? comment.createdAt.toDate() : new Date();
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const commentElement = document.createElement('div');
                commentElement.className = 'comment-card';
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-author">${comment.userName}</span>
                        <span class="comment-date">${formattedDate}</span>
                    </div>
                    <div class="comment-content">${comment.text}</div>
                    <div class="comment-actions">
                        <div class="comment-action like-action" data-comment-id="${comment.id}">
                            <i class="like-icon">👍</i>
                            <span class="like-count">${comment.likeCount || 0}</span>
                        </div>
                        <div class="comment-action reply-action" data-comment-id="${comment.id}">
                            <i class="reply-icon">💬</i>
                            <span>Reply</span>
                        </div>
                    </div>
                    <div class="comment-replies" id="replies-${comment.id}"></div>
                    <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none;">
                        <div class="reply-form">
                            <input type="text" class="reply-input" placeholder="Write a reply...">
                            <button class="reply-submit" data-comment-id="${comment.id}">Reply</button>
                        </div>
                    </div>
                `;
                
                commentsList.appendChild(commentElement);
                
                // Load replies for this comment
                loadReplies(comment.id);
                
                // Check if user has liked this comment
                if (currentUser) {
                    checkUserLike(comment.id, currentUser.uid);
                }
            });
            
            // Add event listeners for like and reply buttons
            addCommentActionListeners();
        }, error => {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '<p class="error-message">Error loading comments. Please refresh the page.</p>';
        });
}

// Load replies for a comment
function loadReplies(commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    
    repliesCollection.where('commentId', '==', commentId)
        .orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
            repliesContainer.innerHTML = '';
            
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const reply = doc.data();
                    
                    // Format date
                    const date = reply.createdAt ? reply.createdAt.toDate() : new Date();
                    const formattedDate = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const replyElement = document.createElement('div');
                    replyElement.className = 'reply-item';
                    replyElement.innerHTML = `
                        <div class="reply-header">
                            <span class="reply-author">${reply.userName}</span>
                            <span class="reply-date">${formattedDate}</span>
                        </div>
                        <div class="reply-content">${reply.text}</div>
                    `;
                    
                    repliesContainer.appendChild(replyElement);
                });
            }
        });
}

// Add event listeners for comment actions (like and reply)
function addCommentActionListeners() {
    // Like action
    document.querySelectorAll('.like-action').forEach(element => {
        element.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please log in to like comments');
                return;
            }
            
            const commentId = element.dataset.commentId;
            toggleLike(commentId, currentUser.uid);
        });
    });
    
    // Reply action
    document.querySelectorAll('.reply-action').forEach(element => {
        element.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please log in to reply to comments');
                return;
            }
            
            const commentId = element.dataset.commentId;
            const replyFormContainer = document.getElementById(`reply-form-${commentId}`);
            
            // Toggle reply form visibility
            if (replyFormContainer.style.display === 'none') {
                replyFormContainer.style.display = 'block';
            } else {
                replyFormContainer.style.display = 'none';
            }
        });
    });
    
    // Reply submit
    document.querySelectorAll('.reply-submit').forEach(button => {
        button.addEventListener('click', () => {
            const commentId = button.dataset.commentId;
            const replyInput = button.previousElementSibling;
            const replyText = replyInput.value.trim();
            
            if (!replyText) return;
            if (!currentUser) {
                alert('Please log in to reply');
                return;
            }
            
            const reply = {
                commentId: commentId,
                text: replyText,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            repliesCollection.add(reply)
                .then(() => {
                    replyInput.value = '';
                    // Hide the reply form after submitting
                    document.getElementById(`reply-form-${commentId}`).style.display = 'none';
                })
                .catch(error => {
                    console.error('Error adding reply:', error);
                    alert('Error posting reply. Please try again.');
                });
        });
    });
}

// Toggle like on a comment
function toggleLike(commentId, userId) {
    const likeRef = likesCollection.doc(`${commentId}_${userId}`);
    
    likeRef.get().then(doc => {
        if (doc.exists) {
            // User already liked this comment, remove the like
            return likeRef.delete().then(() => {
                // Decrement like count
                return commentsCollection.doc(commentId).update({
                    likeCount: firebase.firestore.FieldValue.increment(-1)
                });
            });
        } else {
            // User hasn't liked this comment yet, add the like
            return likeRef.set({
                userId: userId,
                commentId: commentId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Increment like count
                return commentsCollection.doc(commentId).update({
                    likeCount: firebase.firestore.FieldValue.increment(1)
                });
            });
        }
    }).catch(error => {
        console.error('Error toggling like:', error);
    });
}

// Check if user has liked a comment and update UI accordingly
function checkUserLike(commentId, userId) {
    likesCollection.doc(`${commentId}_${userId}`).get().then(doc => {
        const likeAction = document.querySelector(`.like-action[data-comment-id="${commentId}"]`);
        if (doc.exists) {
            // User has liked this comment
            likeAction.classList.add('liked');
        } else {
            // User hasn't liked this comment
            likeAction.classList.remove('liked');
        }
    }).catch(error => {
        console.error('Error checking like status:', error);
    });
}