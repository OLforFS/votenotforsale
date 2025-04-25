/**
 * webview.js - Optimizations for webview environments
 * 
 * This script detects if the site is running in a webview and applies
 * appropriate optimizations for better mobile experience.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Detect if running in a webview
    const isWebView = detectWebView();
    
    if (isWebView) {
        console.log('Running in WebView - applying optimizations');
        applyWebViewOptimizations();
    } else {
        console.log('Running in regular browser');
    }
    
    // Add event listeners optimized for touch interfaces
    setupTouchFriendlyEvents();
});

/**
 * Detects if the current environment is a WebView
 * @returns {boolean} True if running in a WebView
 */
function detectWebView() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Common WebView identifiers
    const webViewIdentifiers = [
        'wv', // Android WebView
        'fb_iab', // Facebook in-app browser
        'fban', // Facebook app
        'fbav', // Facebook app
        'instagram', // Instagram browser
        'line', // Line app browser
        'miuibrowser', // MIUI browser
        'ucbrowser', // UC Browser
        'chrome/.* Mobile', // Chrome Mobile
        'crios', // Chrome iOS
        'twitter', // Twitter app
        'whatsapp', // WhatsApp browser
        'tiktok', // TikTok browser
        'linkedin', // LinkedIn browser
        'snapchat', // Snapchat browser
        'kakaotalk', // KakaoTalk browser
        'viber' // Viber browser
    ];
    
    // Check for WebView identifiers in user agent
    const isWebView = webViewIdentifiers.some(identifier => 
        userAgent.includes(identifier));
        
    // Additional checks for iOS WebView
    const isIOSWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(userAgent);
    
    // Check for Android WebView
    const isAndroidWebView = /Android.*Version\/[0-9\.]+\sChrome\/[0-9\.]+\sSafari\/[0-9\.]+/i.test(userAgent) && !userAgent.includes('chrome');
    
    // Check for embedded browser parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbedded = urlParams.get('embedded') === 'true' || urlParams.get('webview') === 'true';
    
    return isWebView || isIOSWebView || isAndroidWebView || isEmbedded;
}

/**
 * Apply optimizations specific to WebView environments
 */
function applyWebViewOptimizations() {
    // Add WebView specific class to body for CSS targeting
    document.body.classList.add('webview-mode');
    
    // Adjust viewport for better WebView display
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    
    // Optimize form inputs for WebView
    optimizeFormInputs();
    
    // Add WebView specific styles
    addWebViewStyles();
    
    // Handle back button for WebView navigation
    setupWebViewNavigation();
}

/**
 * Optimize form inputs for better WebView experience
 */
function optimizeFormInputs() {
    // Get all form inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Add appropriate input types for mobile keyboards
        if (input.type === 'text' && input.id === 'email') {
            input.type = 'email';
        }
        
        // Add autocomplete attributes
        if (input.id === 'name') {
            input.setAttribute('autocomplete', 'name');
        } else if (input.id === 'email') {
            input.setAttribute('autocomplete', 'email');
        }
        
        // Increase touch target size
        input.style.minHeight = '44px';
        
        // Add focus/blur handlers to improve scrolling behavior
        input.addEventListener('focus', function() {
            // Small delay to allow keyboard to appear before scrolling
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
}

/**
 * Add WebView specific styles
 */
function addWebViewStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* WebView specific styles */
        .webview-mode {
            /* Prevent overscroll effects */
            overscroll-behavior: none;
        }
        
        .webview-mode .modal-content {
            /* Adjust modal for better mobile viewing */
            width: 95%;
            margin: 10% auto;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .webview-mode .btn,
        .webview-mode button {
            /* Increase touch targets */
            min-height: 44px;
            min-width: 44px;
        }
        
        /* Auth modal optimizations for webview */
        .webview-mode .auth-modal-overlay {
            background-color: rgba(0,0,0,0.8);
        }
        
        .webview-mode .auth-modal {
            width: 95%;
            max-width: 350px;
            padding: 1.5rem;
            border-radius: 12px;
        }
        
        .webview-mode .auth-form input {
            font-size: 16px; /* Prevents iOS zoom on input focus */
            padding: 12px;
            margin-bottom: 8px;
        }
        
        .webview-mode .auth-submit-btn {
            min-height: 44px;
            margin-top: 12px;
        }
        
        /* Fix for iOS WebView issues */
        @supports (-webkit-touch-callout: none) {
            .webview-mode {
                /* Prevent 300ms tap delay */
                touch-action: manipulation;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

/**
 * Setup touch-friendly event listeners
 */
function setupTouchFriendlyEvents() {
    // Replace hover events with touch events where needed
    const hoverElements = document.querySelectorAll('.counter-container');
    
    hoverElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        
        element.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
    });
    
    // Improve modal interactions for touch
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        // Prevent background scrolling when modal is open
        modal.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: false });
    });
}

/**
 * Setup WebView specific navigation handling
 */
function setupWebViewNavigation() {
    // Handle back button for Android WebView
    window.addEventListener('popstate', function(e) {
        // Check if any modals are open (including auth modals)
        const openModals = document.querySelectorAll('.modal[style*="display: block"], .auth-modal-overlay.active');
        
        if (openModals.length > 0) {
            // Close the modal instead of navigating back
            e.preventDefault();
            openModals.forEach(modal => {
                if (modal.classList.contains('auth-modal-overlay')) {
                    modal.classList.remove('active');
                } else {
                    modal.style.display = 'none';
                }
            });
            
            // Push a new state to replace the one we just popped
            history.pushState(null, document.title, window.location.href);
            return;
        }
    });
    
    // Add history entry when opening modals
    const modalTriggers = document.querySelectorAll('[data-modal], #login-btn, #signup-btn');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            history.pushState(null, document.title, window.location.href);
        });
    });
    
    // Optimize auth modals for webview
    optimizeAuthModals();
}

/**
 * Optimize authentication modals for WebView
 */
function optimizeAuthModals() {
    // Wait for auth modals to be created
    const checkForAuthModals = setInterval(() => {
        const loginModal = document.getElementById('login-modal');
        const signupModal = document.getElementById('signup-modal');
        
        if (loginModal && signupModal) {
            clearInterval(checkForAuthModals);
            
            // Prevent keyboard from pushing content up on iOS
            const authInputs = document.querySelectorAll('.auth-form input');
            authInputs.forEach(input => {
                input.addEventListener('focus', function() {
                    // Scroll to input with delay to account for keyboard appearance
                    setTimeout(() => {
                        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
            });
            
            // Improve modal closing behavior
            document.querySelectorAll('.auth-modal-overlay').forEach(modal => {
                // Prevent scrolling of background content when modal is open
                modal.addEventListener('touchmove', function(e) {
                    if (e.target === this) {
                        e.preventDefault();
                    }
                }, { passive: false });
            });
        }
    }, 500);
    
    // Stop checking after 10 seconds to prevent infinite loop
    setTimeout(() => clearInterval(checkForAuthModals), 10000);
}