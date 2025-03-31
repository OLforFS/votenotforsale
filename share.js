// Share.js - Enhanced social sharing functionality with Filipino context

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const shareBtn = document.querySelector('.share-btn');
    const shareModalOverlay = document.querySelector('.share-modal-overlay');
    const closeShareModalBtn = document.querySelector('.close-share-modal');
    const copyLinkBtn = document.querySelector('.share-option.copy');
    
    // Get current language from localStorage
    const currentLanguage = localStorage.getItem('voteNotForSale_language') || 'en';
    
    // Enhanced share message content with Filipino context - localized and platform-specific
    const shareMessages = {
        'en': {
            title: "Vote Not For Sale - Electoral Integrity Pledge Philippines",
            description: "I've taken the pledge to protect the integrity of our elections. Join me in keeping our democracy strong! #HindiIpinagbibiliAngAkingBoto #VoteNotForSale",
            copied: "Copied!",
            facebook: "I've pledged that my vote is NOT for sale! Join me in protecting our democracy. #HindiIpinagbibiliAngAkingBoto",
            twitter: "I've taken the #VoteNotForSale pledge! Our democracy depends on electoral integrity. Join me and make your pledge today! #HindiIpinagbibiliAngAkingBoto",
            whatsapp: "I've pledged to protect our elections from vote-buying. Join me in this important cause! #VoteNotForSale",
            telegram: "I've joined the movement to protect electoral integrity in the Philippines. Make your pledge too! #VoteNotForSale",
            messenger: "Hey! I just took the Vote Not For Sale pledge. Our votes matter for our future. Take the pledge too!",
            email: "I've taken a stand for electoral integrity in the Philippines. I hope you'll join me in this important cause."
        },
        'tl': {
            title: "Hindi Ipinagbibili Ang Aking Boto - Pangako sa Integridad ng Halalan sa Pilipinas",
            description: "Nangako ako na poprotektahan ang integridad ng ating halalan. Samahan mo ako sa pagpapalakas ng ating demokrasya! #HindiIpinagbibiliAngAkingBoto #VoteNotForSale",
            copied: "Nakopya!",
            facebook: "Nangako ako na HINDI ko ipagbibili ang aking boto! Samahan mo ako sa pagprotekta sa ating demokrasya. #HindiIpinagbibiliAngAkingBoto",
            twitter: "Nangako ako sa #HindiIpinagbibiliAngAkingBoto! Ang ating demokrasya ay nakasalalay sa integridad ng halalan. Sumali ka rin! #VoteNotForSale",
            whatsapp: "Nangako ako na poprotektahan ang ating halalan mula sa vote-buying. Sumali ka sa mahalagang adhikaing ito! #HindiIpinagbibiliAngAkingBoto",
            telegram: "Sumali ako sa kilusan para sa integridad ng halalan sa Pilipinas. Mangako ka rin! #HindiIpinagbibiliAngAkingBoto",
            messenger: "Hoy! Nangako ako sa Hindi Ipinagbibili Ang Aking Boto. Mahalaga ang ating boto para sa kinabukasan. Mangako ka rin!",
            email: "Nanindigan ako para sa integridad ng halalan sa Pilipinas. Sana sumali ka rin sa mahalagang adhikaing ito."
        }
    };
    
    const shareTitle = shareMessages[currentLanguage].title;
    const shareDescription = shareMessages[currentLanguage].description;
    const shareUrl = window.location.href;
    
    // Open share modal
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            shareModalOverlay.classList.add('active');
        });
    }
    
    // Close share modal
    if (closeShareModalBtn) {
        closeShareModalBtn.addEventListener('click', function() {
            shareModalOverlay.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    shareModalOverlay.addEventListener('click', function(e) {
        if (e.target === shareModalOverlay) {
            shareModalOverlay.classList.remove('active');
        }
    });
    
    // Copy link functionality
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(shareUrl).then(function() {
                // Show success message
                const originalText = copyLinkBtn.querySelector('.share-option-label').textContent;
                copyLinkBtn.querySelector('.share-option-label').textContent = shareMessages[currentLanguage].copied;
                
                setTimeout(function() {
                    copyLinkBtn.querySelector('.share-option-label').textContent = originalText;
                }, 2000);
            });
        });
    }
    
    // Setup social share links with Filipino context
    setupShareLinks();
    
    function setupShareLinks() {
        // Facebook
        const facebookBtn = document.querySelector('.share-option.facebook');
        if (facebookBtn) {
            const facebookMessage = shareMessages[currentLanguage].facebook || shareDescription;
            facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(facebookMessage)}`;
            facebookBtn.target = '_blank';
            facebookBtn.rel = 'noopener noreferrer';
            facebookBtn.setAttribute('data-message', facebookMessage);
        }
        
        // Twitter/X
        const twitterBtn = document.querySelector('.share-option.twitter');
        if (twitterBtn) {
            const twitterMessage = shareMessages[currentLanguage].twitter || shareDescription;
            twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterMessage)}&url=${encodeURIComponent(shareUrl)}`;
            twitterBtn.target = '_blank';
            twitterBtn.rel = 'noopener noreferrer';
            twitterBtn.setAttribute('data-message', twitterMessage);
        }
        
        // WhatsApp
        const whatsappBtn = document.querySelector('.share-option.whatsapp');
        if (whatsappBtn) {
            const whatsappMessage = shareMessages[currentLanguage].whatsapp || shareDescription;
            whatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage + ' ' + shareUrl)}`;
            whatsappBtn.target = '_blank';
            whatsappBtn.rel = 'noopener noreferrer';
            whatsappBtn.setAttribute('data-message', whatsappMessage);
        }
        
        // Telegram
        const telegramBtn = document.querySelector('.share-option.telegram');
        if (telegramBtn) {
            const telegramMessage = shareMessages[currentLanguage].telegram || shareDescription;
            telegramBtn.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramMessage)}`;
            telegramBtn.target = '_blank';
            telegramBtn.rel = 'noopener noreferrer';
            telegramBtn.setAttribute('data-message', telegramMessage);
        }
        
        // Messenger
        const messengerBtn = document.querySelector('.share-option.messenger');
        if (messengerBtn) {
            const messengerMessage = shareMessages[currentLanguage].messenger || shareDescription;
            messengerBtn.href = `https://www.facebook.com/dialog/send?app_id=936487573041926&link=${encodeURIComponent(shareUrl)}&redirect_uri=${encodeURIComponent(shareUrl)}`;
            messengerBtn.target = '_blank';
            messengerBtn.rel = 'noopener noreferrer';
            messengerBtn.setAttribute('data-message', messengerMessage);
        }
        
        // Email
        const emailBtn = document.querySelector('.share-option.email');
        if (emailBtn) {
            const emailMessage = shareMessages[currentLanguage].email || shareDescription;
            emailBtn.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(emailMessage + '\n\n' + shareUrl)}`;
            emailBtn.setAttribute('data-message', emailMessage);
        }
        
        // Copy link
        const copyBtn = document.querySelector('.share-option.copy');
        if (copyBtn) {
            copyBtn.setAttribute('data-message', shareDescription);
        }
    }
    
    // Update share content when language changes
    document.addEventListener('languageChanged', function() {
        const updatedLanguage = localStorage.getItem('voteNotForSale_language') || 'en';
        
        // Update share modal content
        const shareModalTitle = document.querySelector('.share-modal-title');
        if (shareModalTitle) {
            shareModalTitle.textContent = translations[updatedLanguage]['share_title'];
        }
        
        const shareDescription = document.querySelector('.share-description');
        if (shareDescription) {
            shareDescription.textContent = translations[updatedLanguage]['share_description'];
        }
        
        const shareTagalog = document.querySelector('.share-tagalog em');
        if (shareTagalog) {
            shareTagalog.textContent = translations[updatedLanguage]['share_tagalog'];
        }
        
        // Update copy link text
        const copyLinkLabel = document.querySelector('.share-option.copy .share-option-label');
        if (copyLinkLabel) {
            copyLinkLabel.textContent = translations[updatedLanguage]['copy_link'];
        }
        
        // Update share links with new language
        setupShareLinks();
    });
});