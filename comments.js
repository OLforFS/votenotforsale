// Comments and Authentication functionality

// Use globally available Firebase services from firebase-init-compat.js
let db;
let auth;
let currentUser = null; // Keep track of the currently logged-in user
let commentsCollection;
let likesCollection;
let repliesCollection;

// Initialize Firebase references and UI elements
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase services are available globally
    if (window.firebase && window.firebase.db && window.firebase.auth) {
        // Get Firestore and Auth references from the window.firebase object
        db = window.firebase.db;
        auth = window.firebase.auth(); // Get auth instance

        // Initialize Firestore collection references
        commentsCollection = db.collection('comments');
        likesCollection = db.collection('likes'); // Collection for storing likes
        repliesCollection = db.collection('replies'); // Collection for storing replies

        // Initialize UI elements specific to comments
        initializeCommentUI();

        // Listen for authentication state changes to update currentUser and UI
        auth.onAuthStateChanged(user => {
             currentUser = user; // Update the global currentUser variable
             if (user) {
                 // User is signed in
                 console.log('User signed in (comments.js):', user.uid);
                 // Enable comment form (handled by firebase-auth.js, but ensure consistency)
                 enableCommentForm(); // Make sure this function exists or is handled globally
             } else {
                 // User is signed out
                 console.log('User signed out (comments.js)');
                 currentUser = null;
                 // Disable comment form (handled by firebase-auth.js, but ensure consistency)
                 disableCommentForm(); // Make sure this function exists or is handled globally
             }
             // Load comments regardless of auth state, but interaction depends on currentUser
             loadComments();
         });

        console.log('Firebase services initialized successfully in comments.js');
    } else {
        console.error('Firebase db or auth is not available globally (window.firebase). comments.js initialization failed.');
        // Optionally display an error message to the user on the page
        const commentsList = document.getElementById('comments-list');
        if (commentsList) {
            commentsList.innerHTML = '<p class="error-loading">Could not connect to the commenting service. Please refresh the page.</p>';
        }
    }
});

// Initialize UI elements specific to the comments section
function initializeCommentUI() {
    // DOM Elements needed for comments
    window.commentForm = document.getElementById('comment-form');
    window.commentInput = document.getElementById('comment-input');
    window.postCommentBtn = document.getElementById('post-comment-btn'); // Assuming button ID is this
    window.commentsList = document.getElementById('comments-list');

    // Check if elements exist before adding listeners
    if (window.commentForm && window.commentInput && window.postCommentBtn && window.commentsList) {
        // Setup event listeners specific to comments
        setupCommentEventListeners();
    } else {
        console.warn('One or more comment UI elements (form, input, button, list) not found.');
    }

    // Initial state of the comment form is handled by the onAuthStateChanged listener
}

// Setup event listeners specific to comment functionality
function setupCommentEventListeners() {
    // Comment form submission
    if (window.commentForm) {
        window.commentForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission which reloads the page
            postComment();
        });
    } else {
         console.error("Comment form not found, cannot add submit listener.");
    }

    // Add listeners for dynamic elements (like, reply buttons) inside the comments list
    // Use event delegation on the commentsList container
    if (window.commentsList) {
        window.commentsList.addEventListener('click', handleCommentInteraction);
    } else {
        console.error("Comments list not found, cannot add interaction listener.");
    }
}

// Handle clicks within the comments list (for likes, replies, etc.)
function handleCommentInteraction(event) {
    const target = event.target;
    const commentElement = target.closest('.comment'); // Find the parent comment element

    if (!commentElement) return; // Click was not inside a comment

    const commentId = commentElement.dataset.id;

    // Handle Like button click
    if (target.classList.contains('like-btn')) {
        toggleLike(commentId, target);
    }

    // Handle Reply button click
    if (target.classList.contains('reply-btn')) {
        // Implement reply functionality (e.g., show reply form)
        console.log(`Reply clicked for comment: ${commentId}`);
        showReplyForm(commentElement); // Example function call
    }

    // Handle Submit Reply button click (if reply form is dynamically added)
    if (target.classList.contains('submit-reply-btn')) {
        const replyForm = target.closest('.reply-form');
        const replyInput = replyForm.querySelector('.reply-input');
        postReply(commentId, replyInput.value.trim(), replyForm);
    }
     // Handle Delete button click
    if (target.classList.contains('delete-btn')) {
        const commentUserId = commentElement.dataset.userId; // Assuming you add data-user-id to the comment element
        if (currentUser && currentUser.uid === commentUserId) {
            if (confirm('Are you sure you want to delete this comment?')) {
                deleteComment(commentId, commentElement);
            }
        } else {
            showAuthNotification('You can only delete your own comments.', 'error');
        }
    }
}


// Post a new comment to Firestore
function postComment() {
    if (!window.commentInput) {
        console.error("Comment input element not found.");
        return;
    }
    const commentText = window.commentInput.value.trim();

    // Check if user is logged in
    if (!currentUser) {
        showAuthNotification('Please log in to post a comment.', 'error');
        // Optionally, trigger the login modal to open
        document.getElementById('login-modal')?.classList.add('active');
        return;
    }

    // Check if comment text is empty
    if (!commentText) {
        showAuthNotification('Comment cannot be empty.', 'error');
        return;
    }

    // Disable button while posting
    if(window.postCommentBtn) window.postCommentBtn.disabled = true;


    // Prepare comment data object
    const commentData = {
        text: commentText,
        userId: currentUser.uid,
        // Get displayName from auth, fallback to email part if needed
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        // Get photoURL from auth, fallback to empty string or default avatar
        userAvatar: currentUser.photoURL || '',
        // Use Firestore server timestamp for consistent time across clients
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        likeCount: 0, // Initialize like count
        replyCount: 0 // Initialize reply count
    };

    console.log('Attempting to add comment:', commentData);

    // Add the comment document to the 'comments' collection
    commentsCollection.add(commentData)
        .then((docRef) => {
            console.log('Comment added successfully with ID:', docRef.id);
            window.commentInput.value = ''; // Clear the input field
            showAuthNotification('Comment posted!', 'success');
            // No need to manually reload comments if using onSnapshot listener
        })
        .catch(error => {
            console.error('Error adding comment:', error);
            showAuthNotification('Error posting comment. Please try again.', 'error');
        })
        .finally(() => {
             // Re-enable button
            if(window.postCommentBtn) window.postCommentBtn.disabled = false;
        });
}

// Load comments from Firestore and display them
// Use onSnapshot for real-time updates
let commentsListener = null; // Variable to hold the listener unsubscribe function

function loadComments() {
    if (!commentsCollection) {
        console.error("Comments collection not initialized. Cannot load comments.");
        if (window.commentsList) window.commentsList.innerHTML = '<p class="error-loading">Error: Comment service not available.</p>';
        return;
    }

    console.log("Setting up real-time comments listener...");
    if (window.commentsList) window.commentsList.innerHTML = '<p class="loading-comments">Loading comments...</p>'; // Show loading indicator

    // Unsubscribe from previous listener if it exists
    if (commentsListener) {
        console.log("Unsubscribing from previous comments listener.");
        commentsListener();
    }

    // Listen for real-time updates, ordered by creation date
    commentsListener = commentsCollection.orderBy('createdAt', 'desc')
        // .limit(50) // Optionally limit the number of comments loaded initially
        .onSnapshot(async (snapshot) => {
            console.log(`Received ${snapshot.docChanges().length} comment changes.`);
            if (!window.commentsList) return; // Ensure list element exists

            if (snapshot.empty) {
                window.commentsList.innerHTML = '<p>No comments yet. Be the first to share your thoughts!</p>';
                return;
            }

            // Process changes (added, modified, removed) for efficiency
            for (const change of snapshot.docChanges()) {
                const commentId = change.doc.id;
                const commentElement = window.commentsList.querySelector(`.comment[data-id="${commentId}"]`);

                if (change.type === "added") {
                    console.log("New comment added:", commentId);
                    // Display the new comment, potentially checking if it already exists due to latency
                    if (!commentElement) {
                         await displayComment(change.doc); // Pass the DocumentSnapshot
                    } else {
                        console.warn(`Comment element ${commentId} already exists, skipping add.`);
                        // Optionally update it anyway if needed
                        // await updateCommentElement(commentElement, change.doc);
                    }
                }
                if (change.type === "modified") {
                    console.log("Comment modified:", commentId);
                    // Update the existing comment element
                    if (commentElement) {
                        await updateCommentElement(commentElement, change.doc); // Pass element and new data
                    } else {
                         console.warn(`Comment element ${commentId} not found for modification, adding instead.`);
                         await displayComment(change.doc); // Add if somehow missing
                    }
                }
                if (change.type === "removed") {
                    console.log("Comment removed:", commentId);
                    // Remove the comment element from the DOM
                    if (commentElement) {
                        commentElement.remove();
                    } else {
                         console.warn(`Comment element ${commentId} not found for removal.`);
                    }
                }
            }

             // Clear loading message if it's still there after processing initial batch
            const loadingMessage = window.commentsList.querySelector('.loading-comments');
            if (loadingMessage) loadingMessage.remove();

            // Re-sort comments visually if order might have changed (e.g., due to modification timestamp updates)
            // This is a simple approach; more complex sorting might be needed depending on requirements.
            sortCommentElements();


        }, (error) => {
            console.error("Error listening to comments collection: ", error);
            if (window.commentsList) window.commentsList.innerHTML = '<p class="error-loading">Error loading comments. Please try refreshing.</p>';
            // Potentially show a notification to the user
            showAuthNotification('Could not load comments.', 'error');
        });
}

// Helper function to sort comment elements in the DOM based on timestamp
function sortCommentElements() {
    if (!window.commentsList) return;
    const comments = Array.from(window.commentsList.querySelectorAll('.comment'));
    comments.sort((a, b) => {
        const timeA = parseInt(a.dataset.timestamp || '0', 10);
        const timeB = parseInt(b.dataset.timestamp || '0', 10);
        return timeB - timeA; // Descending order (newest first)
    });
    // Re-append sorted elements
    comments.forEach(comment => window.commentsList.appendChild(comment));
}


// Display a single comment document
// Takes a Firestore DocumentSnapshot as input
async function displayComment(doc) {
    if (!window.commentsList) return;

    const commentData = doc.data();
    const commentId = doc.id;

    // Basic validation of comment data
    if (!commentData || !commentData.userId || !commentData.text || !commentData.createdAt) {
        console.warn(`Skipping invalid comment data for ID: ${commentId}`, commentData);
        return;
    }

    // Create the main comment container
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.dataset.id = commentId; // Store comment ID
    commentElement.dataset.userId = commentData.userId; // Store user ID for deletion check
    // Store timestamp for sorting
    commentElement.dataset.timestamp = commentData.createdAt?.seconds || Date.now() / 1000;


    // User Info section
    const userInfo = document.createElement('div');
    userInfo.classList.add('comment-user-info');
    const userAvatar = document.createElement('img');
    userAvatar.classList.add('comment-avatar');
    // Use provided avatar or a default placeholder
    userAvatar.src = commentData.userAvatar || 'img/default-avatar.png'; // Make sure you have a default avatar image
    userAvatar.alt = `${commentData.userName || 'User'}'s avatar`;
    const userNameSpan = document.createElement('span');
    userNameSpan.classList.add('comment-username');
    // Use displayName or fallback
    userNameSpan.textContent = commentData.userName || 'Anonymous';
    // Generate a consistent color for the username based on userId
    userNameSpan.style.color = getUserColor(commentData.userId);

    userInfo.appendChild(userAvatar);
    userInfo.appendChild(userNameSpan);

    // Comment Content section
    const commentContent = document.createElement('div');
    commentContent.classList.add('comment-content');
    const commentTextP = document.createElement('p');
    commentTextP.classList.add('comment-text');
    // Escape HTML to prevent XSS attacks
    commentTextP.textContent = commentData.text; // Use textContent for safety
    const commentMeta = document.createElement('div');
    commentMeta.classList.add('comment-meta');
    const commentTimestamp = document.createElement('span');
    commentTimestamp.classList.add('comment-timestamp');
    // Format the timestamp (handle potential null value)
    commentTimestamp.textContent = commentData.createdAt ? formatDate(commentData.createdAt.toDate()) : 'Just now';
    commentMeta.appendChild(commentTimestamp);

    commentContent.appendChild(commentTextP);
    commentContent.appendChild(commentMeta);

    // Comment Actions section (Like, Reply, Delete)
    const commentActions = document.createElement('div');
    commentActions.classList.add('comment-actions');

    // Like Button
    const likeButton = document.createElement('button');
    likeButton.classList.add('like-btn');
    likeButton.innerHTML = `<i class="fas fa-thumbs-up"></i> Like (<span class="like-count">${commentData.likeCount || 0}</span>)`; // Using Font Awesome icon example
    // Check if current user has liked this comment
    await checkUserLike(commentId, likeButton);

    // Reply Button
    const replyButton = document.createElement('button');
    replyButton.classList.add('reply-btn');
    replyButton.innerHTML = `<i class="fas fa-reply"></i> Reply`;

    // Delete Button (only show if the current user is the author)
    let deleteButton = null;
    if (currentUser && currentUser.uid === commentData.userId) {
        deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-btn');
        deleteButton.innerHTML = `<i class="fas fa-trash-alt"></i> Delete`;
    }

    commentActions.appendChild(likeButton);
    commentActions.appendChild(replyButton);
    if (deleteButton) {
        commentActions.appendChild(deleteButton);
    }

    // Replies Section (placeholder for where replies will be loaded)
    const repliesContainer = document.createElement('div');
    repliesContainer.classList.add('replies-container');
    repliesContainer.id = `replies-${commentId}`;
    // Load replies for this comment (implement loadReplies function)
    // loadReplies(commentId, repliesContainer);

    // Reply Form (initially hidden)
    const replyFormContainer = document.createElement('div');
    replyFormContainer.classList.add('reply-form-container');
    replyFormContainer.id = `reply-form-${commentId}`;
    replyFormContainer.style.display = 'none'; // Hide by default
    replyFormContainer.innerHTML = `
        <textarea class="reply-input" placeholder="Write a reply..."></textarea>
        <button class="submit-reply-btn">Submit Reply</button>
    `;

    // Assemble the comment element
    commentElement.appendChild(userInfo);
    commentElement.appendChild(commentContent);
    commentElement.appendChild(commentActions);
    commentElement.appendChild(replyFormContainer); // Add reply form
    commentElement.appendChild(repliesContainer); // Add replies container

    // Add the new comment element to the top of the list (or sort later)
    // window.commentsList.prepend(commentElement); // Prepend for newest first visually immediately
    // Or append and rely on sorting:
    window.commentsList.appendChild(commentElement);

    // Remove "no comments" message if present
    const noCommentsMsg = window.commentsList.querySelector('p:not([class])'); // Basic selector for the message
    if (noCommentsMsg && noCommentsMsg.textContent.includes('No comments yet')) {
        noCommentsMsg.remove();
    }
}

// Update an existing comment element in the DOM
// Takes the DOM element and a Firestore DocumentSnapshot as input
async function updateCommentElement(commentElement, doc) {
    const commentData = doc.data();
    const commentId = doc.id;

    if (!commentData) return; // No data to update with

    console.log(`Updating comment element: ${commentId}`);

    // Update Like Count
    const likeCountSpan = commentElement.querySelector('.like-count');
    if (likeCountSpan) {
        likeCountSpan.textContent = commentData.likeCount || 0;
    }

    // Update Timestamp (if needed, though usually static)
    const commentTimestamp = commentElement.querySelector('.comment-timestamp');
    if (commentTimestamp && commentData.createdAt) {
        commentTimestamp.textContent = formatDate(commentData.createdAt.toDate());
    }
     // Update timestamp data attribute for sorting
    commentElement.dataset.timestamp = commentData.createdAt?.seconds || Date.now() / 1000;


    // Update Text (if comments are editable - not implemented here)
    // const commentTextP = commentElement.querySelector('.comment-text');
    // if (commentTextP && commentTextP.textContent !== commentData.text) {
    //     commentTextP.textContent = commentData.text;
    // }

    // Re-check user's like status (in case it changed elsewhere)
    const likeButton = commentElement.querySelector('.like-btn');
    if (likeButton) {
        await checkUserLike(commentId, likeButton);
    }

    // Update Reply Count (if displayed)
    // const replyCountSpan = commentElement.querySelector('.reply-count');
    // if (replyCountSpan) {
    //     replyCountSpan.textContent = commentData.replyCount || 0;
    // }

    // Note: If other fields like userName or userAvatar can change, update them here too.
}

// Toggle like status for a comment
async function toggleLike(commentId, likeButtonElement) {
    if (!currentUser) {
        showAuthNotification('Please log in to like comments.', 'error');
        document.getElementById('login-modal')?.classList.add('active');
        return;
    }

    const userId = currentUser.uid;
    // Use a composite key for the like document ID for easy lookup
    const likeDocId = `${userId}_${commentId}`;
    const likeRef = likesCollection.doc(likeDocId);
    const commentRef = commentsCollection.doc(commentId);

    console.log(`Toggling like for comment: ${commentId} by user: ${userId}`);

    try {
        // Use a transaction to ensure atomicity
        await db.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            const commentDoc = await transaction.get(commentRef);

            if (!commentDoc.exists) {
                throw new Error("Comment does not exist.");
            }

            let currentLikeCount = commentDoc.data().likeCount || 0;

            if (likeDoc.exists) {
                // User has already liked, so unlike
                console.log("Unliking comment...");
                transaction.delete(likeRef);
                transaction.update(commentRef, { likeCount: window.firebase.firestore.FieldValue.increment(-1) });
                currentLikeCount--; // For immediate UI update
                likeButtonElement?.classList.remove('liked'); // Update button style
            } else {
                // User hasn't liked, so like
                console.log("Liking comment...");
                transaction.set(likeRef, {
                    userId: userId,
                    itemId: commentId, // Store comment ID
                    itemType: 'comment', // Specify item type
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                transaction.update(commentRef, { likeCount: window.firebase.firestore.FieldValue.increment(1) });
                currentLikeCount++; // For immediate UI update
                likeButtonElement?.classList.add('liked'); // Update button style
            }

            // Update like count display immediately (outside transaction is fine for UI)
            const likeCountSpan = likeButtonElement?.querySelector('.like-count');
            if (likeCountSpan) {
                likeCountSpan.textContent = Math.max(0, currentLikeCount); // Ensure count doesn't go below 0
            }
        });
        console.log("Like transaction successful.");

    } catch (error) {
        console.error("Error toggling like:", error);
        showAuthNotification('Error updating like. Please try again.', 'error');
        // Optionally revert UI changes if transaction failed
        // await checkUserLike(commentId, likeButtonElement); // Re-check state from DB
    }
}

// Check if the current user has liked a specific comment and update button state
async function checkUserLike(commentId, likeButtonElement) {
    if (!currentUser || !likeButtonElement) {
        likeButtonElement?.classList.remove('liked'); // Ensure not liked if logged out
        return;
    }

    const userId = currentUser.uid;
    const likeDocId = `${userId}_${commentId}`;
    const likeRef = likesCollection.doc(likeDocId);

    try {
        const likeDoc = await likeRef.get();
        if (likeDoc.exists) {
            likeButtonElement.classList.add('liked');
        } else {
            likeButtonElement.classList.remove('liked');
        }
    } catch (error) {
        console.error(`Error checking like status for comment ${commentId}:`, error);
        // Don't change button state on error, might be temporary network issue
    }
}


// Show or hide the reply form for a specific comment
function showReplyForm(commentElement) {
    if (!currentUser) {
        showAuthNotification('Please log in to reply.', 'error');
        document.getElementById('login-modal')?.classList.add('active');
        return;
    }
    const commentId = commentElement.dataset.id;
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    if (replyForm) {
        // Toggle visibility
        const isVisible = replyForm.style.display === 'block';
        replyForm.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            // Focus the input when showing the form
            replyForm.querySelector('.reply-input')?.focus();
        }
    } else {
        console.error(`Reply form for comment ${commentId} not found.`);
    }
}

// Post a reply to a specific comment
function postReply(commentId, replyText, replyFormElement) {
     if (!currentUser) {
        showAuthNotification('Please log in to post a reply.', 'error');
        document.getElementById('login-modal')?.classList.add('active');
        return;
    }

    if (!replyText) {
        showAuthNotification('Reply cannot be empty.', 'error');
        return;
    }

    const replyInput = replyFormElement.querySelector('.reply-input');
    const submitButton = replyFormElement.querySelector('.submit-reply-btn');

    // Disable form while posting
    if(replyInput) replyInput.disabled = true;
    if(submitButton) submitButton.disabled = true;

    const replyData = {
        text: replyText,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        userAvatar: currentUser.photoURL || '', // Add avatar URL
        commentId: commentId, // Link reply to the parent comment
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        likeCount: 0 // Replies can also be liked
    };

    console.log(`Attempting to add reply to comment ${commentId}:`, replyData);

    // Add reply to the 'replies' collection
    repliesCollection.add(replyData)
        .then(async (docRef) => {
            console.log('Reply added successfully with ID:', docRef.id);
            if(replyInput) replyInput.value = ''; // Clear input
            replyFormElement.style.display = 'none'; // Hide form
            showAuthNotification('Reply posted!', 'success');

            // Increment replyCount on the parent comment document
            const commentRef = commentsCollection.doc(commentId);
            try {
                 await commentRef.update({
                     replyCount: window.firebase.firestore.FieldValue.increment(1)
                 });
                 console.log(`Incremented replyCount for comment ${commentId}`);
            } catch (updateError) {
                 console.error(`Failed to increment replyCount for comment ${commentId}:`, updateError);
                 // Handle error - maybe retry or log it
            }

            // Optionally, immediately display the new reply (if replies are shown)
            // displayReply(docRef.id, replyData, commentId); // Need a displayReply function
        })
        .catch(error => {
            console.error('Error adding reply:', error);
            showAuthNotification('Error posting reply. Please try again.', 'error');
        })
        .finally(() => {
            // Re-enable form
            if(replyInput) replyInput.disabled = false;
            if(submitButton) submitButton.disabled = false;
        });
}

// Delete a comment (and potentially its replies and likes - requires careful handling)
async function deleteComment(commentId, commentElement) {
    if (!currentUser) {
        showAuthNotification('Authentication error.', 'error');
        return;
    }
    console.log(`Attempting to delete comment: ${commentId}`);

    const commentRef = commentsCollection.doc(commentId);

    try {
        // Check ownership again just before deleting (server-side rules are the primary defense)
        const doc = await commentRef.get();
        if (!doc.exists) {
             console.warn(`Comment ${commentId} not found for deletion.`);
             commentElement?.remove(); // Remove from UI anyway if it exists there
             return;
        }
        if (doc.data().userId !== currentUser.uid) {
            showAuthNotification('You do not have permission to delete this comment.', 'error');
            return;
        }

        // Delete the comment document
        await commentRef.delete();
        console.log(`Comment ${commentId} deleted successfully.`);
        showAuthNotification('Comment deleted.', 'success');
        // The onSnapshot listener should automatically remove the element from the UI.
        // If not using onSnapshot, remove manually: commentElement?.remove();

        // **Important Consideration: Deleting associated data (Likes, Replies)**
        // Deleting a comment should ideally also delete its associated likes and replies.
        // This typically requires either:
        // 1. Cloud Functions: A Firebase Cloud Function triggered on comment deletion
        //    to query and delete related documents in 'likes' and 'replies'. (Recommended for robustness)
        // 2. Client-Side Deletion: Querying and deleting related documents from the client.
        //    This is less reliable (client might close browser) and potentially slower.
        // For simplicity here, we are only deleting the comment document itself.
        // Implement cleanup logic as needed based on your application's requirements.
        // Example client-side cleanup (use with caution):
        // deleteAssociatedData(commentId);

    } catch (error) {
        console.error(`Error deleting comment ${commentId}:`, error);
        showAuthNotification('Error deleting comment. Please try again.', 'error');
    }
}

// --- Helper Functions ---

// Format Firestore Timestamp or Date object into a readable string
function formatDate(date) {
    if (!date || !(date instanceof Date)) {
        // Handle cases where date might be null or undefined after .toDate()
        // Or if it's already a number (e.g., from dataset)
        if (typeof date === 'number') {
            date = new Date(date); // Assume it's a timestamp number
        } else {
            return 'Invalid date';
        }
    }
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30); // Approximate
    const years = Math.floor(days / 365); // Approximate

    if (years > 0) return `${years}y ago`;
    if (months > 0) return `${months}mo ago`;
    if (weeks > 0) return `${weeks}w ago`;
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds < 5) return 'Just now'; // More immediate feedback
    return `${seconds}s ago`;

    // Alternative: Absolute date for older comments
    // if (days < 7) { ... relative time ... }
    // return date.toLocaleDateString(); // e.g., "1/15/2024"
}


// Escape HTML to prevent XSS (Simple version)
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
    // More robust libraries like DOMPurify are recommended for production
}

// Generate a consistent, visually distinct color based on user ID
function getUserColor(userId) {
    if (!userId) return '#888888'; // Default color for missing ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    // Generate a color in HSL space for better visual separation
    const hue = hash % 360;
    const saturation = 70 + (hash % 10); // Keep saturation relatively high
    const lightness = 45 + (hash % 10); // Keep lightness moderate
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}


// --- UI Control Functions ---

// Enable comment form elements when user is logged in
function enableCommentForm() {
    if (window.commentInput) window.commentInput.disabled = false;
    if (window.commentInput) window.commentInput.placeholder = "Write a comment...";
    if (window.postCommentBtn) window.postCommentBtn.disabled = false;
    // Hide any "please log in" messages associated with the form
    const loginPrompt = document.getElementById('comment-login-prompt');
    if (loginPrompt) loginPrompt.style.display = 'none';
}

// Disable comment form elements when user is logged out
function disableCommentForm() {
    if (window.commentInput) window.commentInput.disabled = true;
    if (window.commentInput) window.commentInput.placeholder = "Please log in to comment";
    if (window.postCommentBtn) window.postCommentBtn.disabled = true;
     // Show a "please log in" message if applicable
    const loginPrompt = document.getElementById('comment-login-prompt');
    if (loginPrompt) loginPrompt.style.display = 'block'; // Or inline
}

// Placeholder for showing notifications (likely defined in another file like firebase-auth.js or a utility file)
function showAuthNotification(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    // Actual implementation would interact with a notification element in the DOM
    // Example:
    const notificationElement = document.getElementById('auth-notification');
    if (notificationElement) {
        notificationElement.textContent = message;
        notificationElement.className = `notification ${type}`; // Add type class for styling
        notificationElement.classList.add('active');
        // Hide after a few seconds
        setTimeout(() => {
            notificationElement.classList.remove('active');
        }, 4000);
    } else {
        // Fallback to alert if notification element doesn't exist
        // alert(`${type.toUpperCase()}: ${message}`);
    }
}

// --- Potentially needed functions (Implement if required) ---

// function loadReplies(commentId, containerElement) {
//     // Implementation to fetch and display replies for a comment
//     // Use repliesCollection.where('commentId', '==', commentId).orderBy('createdAt', 'asc').onSnapshot(...)
//     console.log(`Placeholder: Load replies for comment ${commentId}`);
//     containerElement.innerHTML = '<p class="loading-replies">Loading replies...</p>';
// }

// function displayReply(replyId, replyData, commentId) {
//     // Implementation to render a single reply element
//     console.log(`Placeholder: Display reply ${replyId} for comment ${commentId}`);
//     const repliesContainer = document.getElementById(`replies-${commentId}`);
//     if (repliesContainer) {
//         // Create reply element similar to displayComment
//         const replyElement = document.createElement('div');
//         // ... populate replyElement ...
//         repliesContainer.appendChild(replyElement);
//         // Remove loading/no replies message
//     }
// }

// async function deleteAssociatedData(commentId) {
//     // Example: Client-side deletion of likes and replies (Use with caution)
//     console.warn(`Deleting associated data for comment ${commentId} from client...`);
//     const batch = db.batch();

//     // Delete likes
//     const likesQuery = likesCollection.where('itemId', '==', commentId).where('itemType', '==', 'comment');
//     const likesSnapshot = await likesQuery.get();
//     likesSnapshot.forEach(doc => batch.delete(doc.ref));
//     console.log(`Marked ${likesSnapshot.size} likes for deletion.`);

//     // Delete replies
//     const repliesQuery = repliesCollection.where('commentId', '==', commentId);
//     const repliesSnapshot = await repliesQuery.get();
//     repliesSnapshot.forEach(doc => batch.delete(doc.ref));
//     console.log(`Marked ${repliesSnapshot.size} replies for deletion.`);

//     try {
//         await batch.commit();
//         console.log(`Associated data for comment ${commentId} deleted.`);
//     } catch (error) {
//         console.error(`Error deleting associated data for comment ${commentId}:`, error);
//     }
// }

// --- End of comments.js ---