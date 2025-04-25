// Comments and Authentication functionality

// Variables for Firebase services
let db;
let auth;
let currentUser = null;
let commentsCollection;
let likesCollection;
let repliesCollection;
let signOutBtn;

// Initialize Firebase references
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (window.firebase) {
        // Get Firestore and Auth references from the window.firebase object
        db = window.firebase.db;
        auth = window.firebase.auth;
        
        // Initialize collections
        commentsCollection = db.collection('comments');
        likesCollection = db.collection('likes');
        repliesCollection = db.collection('replies');
        
        // Initialize UI
        initializeUI();
        
        // Check authentication state
        // UI updates based on auth state are handled by firebase-auth.js
        auth.onAuthStateChanged(user => {
             if (user) {
                 // User is signed in
                 currentUser = user;
                 loadComments(); // Load comments relevant to the user
             } else {
                 // User is signed out
                 currentUser = null;
                 loadComments(); // Still load comments, interaction state handled by firebase-auth.js
             }
         });
        
        // Auth form handlers are managed by firebase-auth.js
        
        console.log('Firebase services initialized in comments.js');
    } else {
        console.error('Firebase is not available in comments.js. Check initialization.');
    }
});

// Utility function to show notifications
function showAuthNotification(message, type = 'success') {
    let notification = document.getElementById('auth-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'auth-notification';
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.className = `auth-notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
    // Add styles if not present
    if (!document.getElementById('auth-notification-style')) {
        const style = document.createElement('style');
        style.id = 'auth-notification-style';
        style.textContent = `
        .auth-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #323232;
            color: #fff;
            padding: 14px 28px;
            border-radius: 6px;
            font-size: 1rem;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            opacity: 0.97;
            transition: opacity 0.3s;
        }
        .auth-notification.success { background: #4CAF50; }
        .auth-notification.error { background: #f44336; }
        `;
        document.head.appendChild(style);
    }
}

// Authentication form handlers and sign out are managed by firebase-auth.js

// Initialize UI elements specific to comments
function initializeUI() {
    // DOM Elements needed for comments
    window.commentForm = document.getElementById('comment-form');
    window.commentInput = document.getElementById('comment-input');
    window.postCommentBtn = document.getElementById('post-comment-btn');
    window.commentsList = document.getElementById('comments-list');

    // Setup event listeners specific to comments
    setupCommentEventListeners();
    
    // Comment form enabled/disabled state is handled by firebase-auth.js based on auth state
}

// Setup event listeners specific to comment functionality
function setupCommentEventListeners() {
    // Comment form submission
    if (window.commentForm) {
        // Use submit event on the form itself
        window.commentForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission
            postComment();
        });
    }

    // Add listeners for dynamic elements like reply/like buttons inside loadComments or similar
}

// Event listeners for auth modals, user profile display, and comment form state are handled by firebase-auth.js

// Post comment function (Keep and ensure it uses currentUser correctly)
function postComment() {
    const commentText = window.commentInput.value.trim();

    if (!commentText) return;
    if (!currentUser) {
        showAuthNotification('Please log in to post a comment', 'error');
        // Attempt to open the login modal if it exists
        document.getElementById('login-modal')?.classList.add('active');
        return;
    }

    const comment = {
        text: commentText,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        userAvatar: currentUser.photoURL || '', // Add avatar URL if available
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        likeCount: 0,
        replyCount: 0 // Initialize reply count
    };

    console.log('Attempting to add comment:', comment);

    commentsCollection.add(comment)
        .then(() => {
            console.log('Comment added successfully');
            window.commentInput.value = '';
            // Optionally show success notification
            // showAuthNotification('Comment posted!', 'success');
        })
        .catch(error => {
            console.error('Error adding comment:', error);
            showAuthNotification('Error posting comment. Please try again.', 'error');
        });
}

// ... rest of the comments-specific functions (loadComments, displayComment, etc.) ...

// Ensure loadComments is defined and handles rendering comments, likes, replies
async function loadComments() {
    if (!commentsCollection) {
        console.error("Comments collection not initialized.");
        return;
    }
    console.log("Loading comments...");
    window.commentsList.innerHTML = '<p class="loading-comments">Loading comments...</p>'; // Show loading indicator

    try {
        const snapshot = await commentsCollection.orderBy('createdAt', 'desc').limit(50).get();
        window.commentsList.innerHTML = ''; // Clear loading/previous comments
        if (snapshot.empty) {
            window.commentsList.innerHTML = '<p>No comments yet. Be the first to share your thoughts!</p>';
            return;
        }
        snapshot.forEach(doc => {
            displayComment(doc);
        });
    } catch (error) {
        console.error("Error loading comments: ", error);
        window.commentsList.innerHTML = '<p class="error-loading">Error loading comments. Please try refreshing the page.</p>';
    }
}

// Display a single comment
async function displayComment(doc) {
    const comment = doc.data();
    const commentId = doc.id;
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.dataset.id = commentId;

    const userInitial = comment.userName ? comment.userName.charAt(0).toUpperCase() : '?';
    const avatarColor = getUserColor(comment.userId);

    // Check if user has liked this comment
    let isLiked = false;
    if (currentUser) {
        const likeQuery = await likesCollection
            .where('userId', '==', currentUser.uid)
            .where('itemId', '==', commentId)
            .where('itemType', '==', 'comment')
            .limit(1)
            .get();
        isLiked = !likeQuery.empty;
    }

    commentElement.innerHTML = `
        <div class="comment-header">
            <div class="comment-avatar" style="background-color: ${avatarColor};">${userInitial}</div>
            <span class="comment-author">${comment.userName || 'Anonymous'}</span>
            <span class="comment-timestamp">${formatTimestamp(comment.createdAt)}</span>
        </div>
        <div class="comment-body">
            <p>${escapeHTML(comment.text)}</p>
        </div>
        <div class="comment-actions">
            <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${commentId}" data-type="comment">
                <i class="fas fa-thumbs-up"></i> <span class="like-count">${comment.likeCount || 0}</span>
            </button>
            <button class="reply-btn" data-id="${commentId}">
                <i class="fas fa-reply"></i> Reply (<span class="reply-count">${comment.replyCount || 0}</span>)
            </button>
        </div>
        <div class="reply-form-container" id="reply-form-${commentId}" style="display: none;">
            <textarea placeholder="Write a reply..."></textarea>
            <button class="post-reply-btn">Post Reply</button>
            <button class="cancel-reply-btn">Cancel</button>
        </div>
        <div class="replies-container" id="replies-${commentId}"></div>
    `;

    window.commentsList.appendChild(commentElement);

    // Add event listeners for like and reply buttons
    const likeButton = commentElement.querySelector('.like-btn');
    if (likeButton) {
        likeButton.addEventListener('click', () => handleLike(commentId, 'comment', likeButton));
    }

    const replyButton = commentElement.querySelector('.reply-btn');
    if (replyButton) {
        replyButton.addEventListener('click', () => toggleReplyForm(commentId));
    }

    const postReplyButton = commentElement.querySelector('.post-reply-btn');
    const cancelReplyButton = commentElement.querySelector('.cancel-reply-btn');
    const replyTextarea = commentElement.querySelector('.reply-form-container textarea');

    if (postReplyButton && replyTextarea) {
        postReplyButton.addEventListener('click', () => postReply(commentId, replyTextarea));
    }
    if (cancelReplyButton) {
        cancelReplyButton.addEventListener('click', () => toggleReplyForm(commentId, false)); // Force close
    }

    // Load replies for this comment
    loadReplies(commentId);
}

// Format Firestore timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Generate a consistent color based on user ID
function getUserColor(userId) {
    if (!userId) return '#cccccc'; // Default color for anonymous
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - color.length) + color;
}

// Handle liking/unliking comments or replies
async function handleLike(itemId, itemType, likeButtonElement) {
    if (!currentUser) {
        showAuthNotification('Please log in to like.', 'error');
        document.getElementById('login-modal')?.classList.add('active');
        return;
    }

    const userId = currentUser.uid;
    const likeRef = likesCollection.doc(`${userId}_${itemId}`);
    const itemRef = (itemType === 'comment' ? commentsCollection : repliesCollection).doc(itemId);

    try {
        const likeDoc = await likeRef.get();
        const itemDoc = await itemRef.get(); // Get current like count
        if (!itemDoc.exists) return; // Item might have been deleted
        let currentLikeCount = itemDoc.data().likeCount || 0;

        if (likeDoc.exists) {
            // User already liked, so unlike
            await likeRef.delete();
            await itemRef.update({ likeCount: firebase.firestore.FieldValue.increment(-1) });
            currentLikeCount--;
            likeButtonElement?.classList.remove('liked');
            console.log(`${itemType} unliked successfully`);
        } else {
            // User hasn't liked, so like
            await likeRef.set({
                userId: userId,
                itemId: itemId,
                itemType: itemType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await itemRef.update({ likeCount: firebase.firestore.FieldValue.increment(1) });
            currentLikeCount++;
            likeButtonElement?.classList.add('liked');
            console.log(`${itemType} liked successfully`);
        }
        // Update like count display immediately
        const likeCountSpan = likeButtonElement?.querySelector('.like-count');
        if (likeCountSpan) {
            likeCountSpan.textContent = currentLikeCount;
        }

    } catch (error) {
        console.error(`Error handling like for ${itemType}:`, error);
        showAuthNotification('Error updating like. Please try again.', 'error');
    }
}

// Toggle reply form visibility
    // We're removing the event listener here to avoid conflicts
    if (window.signupForm) {
        console.log('Signup form handling delegated to firebase-auth.js');
        
        // Add click event listener to signup button if not already added in firebase-auth.js
        const signupSubmitBtn = document.getElementById('signup-submit-btn');
        if (signupSubmitBtn && !signupSubmitBtn._hasClickListener) {
            signupSubmitBtn._hasClickListener = true;
            signupSubmitBtn.addEventListener('click', function(event) {
                console.log('Signup button clicked from comments.js');
                // The actual signup logic is handled in firebase-auth.js
            });
        }
    }
    // Post comment

    // Post comment
    if (window.postCommentBtn) {
        window.postCommentBtn.addEventListener('click', () => {
            const commentText = window.commentInput.value.trim();
            
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
            
            console.log('Attempting to add comment:', comment);
            
            commentsCollection.add(comment)
                .then(() => {
                    console.log('Comment added successfully');
                    window.commentInput.value = '';
                })
                .catch(error => {
                    console.error('Error adding comment:', error);
                    alert('Error posting comment. Please try again.');
                });
        });
    }

    // Sign out button listener
    if (window.signOutBtn) {
        window.signOutBtn.addEventListener('click', handleSignOut);
    }
}

// Handle user sign out
async function handleSignOut() {
    try {
        await auth.signOut();
        showAuthNotification('Signed out successfully', 'success');
        // Redirect to login page (assuming index.html or reload to show login state)
        window.location.href = 'index.html'; 
    } catch (error) {
        console.error('Sign out error:', error);
        showAuthNotification(`Sign out failed: ${error.message}`, 'error');
    }
}

// Add event listeners for comment actions
function addCommentActionListeners() {
    // Reaction buttons
    document.querySelectorAll('.reaction-action').forEach(button => {
        button.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please log in to react to comments');
                return;
            }
            
            const commentId = button.dataset.commentId;
            const reactionType = button.dataset.reaction;
            handleReaction(commentId, reactionType);
        });
    });
    
    // Reply buttons
    document.querySelectorAll('.reply-action').forEach(button => {
        button.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please log in to reply to comments');
                return;
            }
            
            const commentId = button.dataset.commentId;
            const replyForm = document.getElementById(`reply-form-${commentId}`);
            replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
        });
    });
    
    // Reply submit buttons
    document.querySelectorAll('.reply-submit').forEach(button => {
        button.addEventListener('click', () => {
            const commentId = button.dataset.commentId;
            const replyInput = button.parentElement.querySelector('.reply-input');
            const replyText = replyInput.value.trim();
            
            if (!replyText) return;
            
            const reply = {
                text: replyText,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                commentId: commentId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            repliesCollection.add(reply)
                .then(() => {
                    replyInput.value = '';
                    document.getElementById(`reply-form-${commentId}`).style.display = 'none';
                })
                .catch(error => {
                    console.error('Error adding reply:', error);
                    alert('Error posting reply. Please try again.');
                });
        });
    });
}

// Handle reactions to comments
function handleReaction(commentId, reactionType) {
    const userId = currentUser.uid;
    const reactionRef = likesCollection.doc(`${commentId}_${userId}_${reactionType}`);
    
    reactionRef.get().then(doc => {
        if (doc.exists) {
            // User already reacted - remove reaction
            return reactionRef.delete().then(() => {
                return commentsCollection.doc(commentId).update({
                    [`${reactionType}Count`]: firebase.firestore.FieldValue.increment(-1)
                });
            });
        } else {
            // Add new reaction
            return reactionRef.set({
                userId: userId,
                commentId: commentId,
                type: reactionType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                return commentsCollection.doc(commentId).update({
                    [`${reactionType}Count`]: firebase.firestore.FieldValue.increment(1)
                });
            });
        }
    }).catch(error => {
        console.error('Error handling reaction:', error);
        alert('Error processing reaction. Please try again.');
    });
}

// Check user reactions
function checkUserReactions(commentId, userId) {
    likesCollection.where('commentId', '==', commentId)
        .where('userId', '==', userId)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const reaction = doc.data();
                const button = document.querySelector(`.reaction-action[data-comment-id="${commentId}"][data-reaction="${reaction.type}"]`);
                if (button) {
                    button.classList.add('active');
                }
            });
        })
        .catch(error => {
            console.error('Error checking user reactions:', error);
        });
}

// Load comments
function loadComments() {
    commentsCollection.onSnapshot(snapshot => {
        const commentsArr = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            // Calculate total reactions
            let totalReactions = 0;
            if (data.reactions && typeof data.reactions === 'object') {
                totalReactions = Object.values(data.reactions).reduce((a, b) => a + b, 0);
            }
            data.totalReactions = totalReactions;
            commentsArr.push(data);
        });
        // Sort by total reactions descending, then by createdAt descending
        commentsArr.sort((a, b) => {
            if (b.totalReactions !== a.totalReactions) {
                return b.totalReactions - a.totalReactions;
            }
            if (b.createdAt && a.createdAt) {
                return b.createdAt.seconds - a.createdAt.seconds;
            }
            return 0;
        });
        renderMasonryComments(commentsArr);
    }, error => {
        commentsList.innerHTML = '<p class="error-message">Error loading comments. Please refresh the page.</p>';
    });
}

function renderMasonryComments(commentsArr) {
    // 3-column vertical masonry
    commentsList.innerHTML = '';
    const columns = [[], [], []];
    for (let i = 0; i < commentsArr.length; i++) {
        columns[i % 3].push(commentsArr[i]);
    }
    // Create column containers
    const masonry = document.createElement('div');
    masonry.className = 'flex flex-row gap-4 masonry-responsive';
    for (let col = 0; col < 3; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'flex flex-col gap-4 flex-1';
        columns[col].forEach(comment => {
            colDiv.appendChild(createCommentCard(comment));
        });
        masonry.appendChild(colDiv);
    }
    commentsList.appendChild(masonry);
}

function createCommentCard(comment) {
    const card = document.createElement('div');
    card.className = 'comment-card flex flex-col';
    // Profile icon
    const initial = (comment.userName || 'U')[0].toUpperCase();
    const profileIcon = `<div class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">${initial}</div>`;
    // Timestamp
    let dateStr = '';
    if (comment.createdAt && comment.createdAt.toDate) {
        dateStr = comment.createdAt.toDate().toLocaleString();
    }
    // Comment content
    const content = `<div class="comment-content mb-2">${comment.text || comment.content}</div>`;
    // Reactions
    const reactions = [
        { type: '👍', key: 'thumbs_up' },
        { type: '❤️', key: 'heart' },
        { type: '😂', key: 'laugh' },
        { type: '😢', key: 'cry' }
    ];
    let reactionsHtml = '';
    const userReactions = comment.userReactions || {};
    let userReactionType = null;
    if (currentUser && comment.userReactions && comment.userReactions[currentUser.uid]) {
        userReactionType = comment.userReactions[currentUser.uid];
    }
    reactions.forEach(r => {
        const count = (comment.reactions && comment.reactions[r.type]) ? comment.reactions[r.type] : 0;
        const active = userReactionType === r.type ? 'active-reaction' : '';
        reactionsHtml += `<span class="comment-action reaction-action ${active}" data-comment-id="${comment.id}" data-reaction="${r.type}">${r.type} <span>${count}</span></span>`;
    });
    // Share button (reuse from index page)
    const shareBtn = `<button class="share-btn mt-2" data-share-id="${comment.id}" data-share-text="${comment.text || comment.content}">Share</button>`;
    card.innerHTML = `
        <div class="flex items-center gap-3 mb-2">${profileIcon}<span class="font-semibold">${comment.userName}</span></div>
        ${content}
        <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>${dateStr}</span>
        </div>
        <div class="flex gap-2 mb-2">${reactionsHtml}</div>
        ${shareBtn}
    `;
    return card;
}

// Reaction logic: only one reaction per user per comment
commentsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('reaction-action')) {
        if (!currentUser) {
            alert('Please log in to react to comments');
            return;
        }
        const commentId = e.target.dataset.commentId;
        const reactionType = e.target.dataset.reaction;
        const commentRef = commentsCollection.doc(commentId);
        const commentSnap = await commentRef.get();
        if (!commentSnap.exists) return;
        const data = commentSnap.data();
        let reactions = data.reactions || {};
        let userReactions = data.userReactions || {};
        const prevReaction = userReactions[currentUser.uid];
        if (prevReaction === reactionType) {
            // Remove reaction
            reactions[reactionType] = (reactions[reactionType] || 1) - 1;
            if (reactions[reactionType] < 0) reactions[reactionType] = 0;
            delete userReactions[currentUser.uid];
        } else {
            // Remove previous reaction if exists
            if (prevReaction) {
                reactions[prevReaction] = (reactions[prevReaction] || 1) - 1;
                if (reactions[prevReaction] < 0) reactions[prevReaction] = 0;
            }
            // Add new reaction
            reactions[reactionType] = (reactions[reactionType] || 0) + 1;
            userReactions[currentUser.uid] = reactionType;
        }
        await commentRef.update({ reactions, userReactions });
    }
    // Share button logic
    if (e.target.classList.contains('share-btn')) {
        const shareText = e.target.dataset.shareText;
        const shareUrl = window.location.href.split('#')[0] + '#' + e.target.dataset.shareId;
        if (navigator.share) {
            navigator.share({ title: 'Vote Not For Sale', text: shareText, url: shareUrl });
        } else {
            // Fallback: open custom share modal
            window.currentShareData = { title: 'Vote Not For Sale', text: shareText, url: shareUrl };
            document.getElementById('share-modal-overlay').classList.add('active');
        }
    }
});


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
const shareModalOverlay = document.getElementById('share-modal-overlay');
const closeShareModal = document.getElementById('close-share-modal');
if (shareModalOverlay && closeShareModal) {
    closeShareModal.addEventListener('click', () => {
        shareModalOverlay.classList.remove('active');
    });
    shareModalOverlay.addEventListener('click', (e) => {
        if (e.target === shareModalOverlay) {
            shareModalOverlay.classList.remove('active');
        }
    });
}
function getShareData() {
    return window.currentShareData || { title: 'Vote Not For Sale', text: '', url: window.location.href };
}
function openShareUrl(url) {
    window.open(url, '_blank', 'noopener');
}
const shareFacebook = document.getElementById('share-facebook');
const shareMessenger = document.getElementById('share-messenger');
const shareTelegram = document.getElementById('share-telegram');
const shareWhatsapp = document.getElementById('share-whatsapp');
const shareTwitter = document.getElementById('share-twitter');
const shareLinkedin = document.getElementById('share-linkedin');
const shareEmail = document.getElementById('share-email');
const shareCopy = document.getElementById('share-copy');
if (shareFacebook) {
    shareFacebook.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}&quote=${encodeURIComponent(data.text)}`;
        openShareUrl(url);
    });
}
if (shareMessenger) {
    shareMessenger.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        const url = `https://www.facebook.com/dialog/send?app_id=936439947551747&link=${encodeURIComponent(data.url)}&redirect_uri=${encodeURIComponent(data.url)}`;
        openShareUrl(url);
    });
}
if (shareTelegram) {
    shareTelegram.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        const url = `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}`;
        openShareUrl(url);
    });
}
if (shareWhatsapp) {
    shareWhatsapp.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(data.text + ' ' + data.url)}`;
        openShareUrl(url);
    });
}
if (shareTwitter) {
    shareTwitter.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}`;
        openShareUrl(url);
    });
}
if (shareLinkedin) {
    shareLinkedin.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`;
        openShareUrl(url);
    });
}
if (shareEmail) {
    shareEmail.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        const url = `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.text + '\n\n' + data.url)}`;
        window.location.href = url;
    });
}
if (shareCopy) {
    shareCopy.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getShareData();
        navigator.clipboard.writeText(data.url);
        shareModalOverlay.classList.remove('active');
        alert('Share link copied to clipboard!');
    });
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}