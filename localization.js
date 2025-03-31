// localization.js - Language switching functionality for Vote Not For Sale website

document.addEventListener('DOMContentLoaded', function() {
    // Default language is English
    let currentLanguage = localStorage.getItem('voteNotForSale_language') || 'en';
    
    // Language data
    const translations = {
        'en': {
            'title': 'MY VOTE IS NOT FOR SALE!',
            'subtitle': 'HINDI IPINAGBIBILI ANG AKING BOTO!',
            'description': 'I pledge to uphold the integrity of our democratic process by refusing to sell my vote. I commit to making informed choices based on candidates\'s qualifications, platforms, and track records - not on monetary incentives or material gifts.',
            'tagalog_description': 'Nangangako ako na pananatilihin ang integridad ng ating demokratikong proseso sa pamamagitan ng pagtanggi na ipagbili ang aking boto. Nangangako ako na gagawa ng malinaw na mga pagpipilian batay sa mga kwalipikasyon, plataporma, at track record ng mga kandidato - hindi sa mga insentibong pinansyal o mga materyal na regalo.',
            'counter_label': 'PLEDGES TAKEN',
            'pledge_button': 'Take the Pledge',
            'share_button': 'Share',
            'share_title': 'Share This Pledge',
            'share_description': 'Help spread the word about electoral integrity in the Philippines! Share this pledge with your friends and family.',
            'share_tagalog': 'Tulungan nating ipakalat ang kaalaman tungkol sa integridad ng halalan sa Pilipinas! Ibahagi ang pangakong ito sa iyong mga kaibigan at pamilya.',
            'copy_link': 'Copy Link',
            'copied': 'Copied!',
            'language_switch': 'Filipino'
        },
        'tl': {
            'title': 'HINDI IPINAGBIBILI ANG AKING BOTO!',
            'subtitle': 'MY VOTE IS NOT FOR SALE!',
            'description': 'Nangangako ako na pananatilihin ang integridad ng ating demokratikong proseso sa pamamagitan ng pagtanggi na ipagbili ang aking boto. Nangangako ako na gagawa ng malinaw na mga pagpipilian batay sa mga kwalipikasyon, plataporma, at track record ng mga kandidato - hindi sa mga insentibong pinansyal o mga materyal na regalo.',
            'tagalog_description': 'I pledge to uphold the integrity of our democratic process by refusing to sell my vote. I commit to making informed choices based on candidates\'s qualifications, platforms, and track records - not on monetary incentives or material gifts.',
            'counter_label': 'MGA NANGAKONG BOTANTE',
            'pledge_button': 'Mangako Ngayon',
            'share_button': 'Ibahagi',
            'share_title': 'Ibahagi ang Pangakong Ito',
            'share_description': 'Tulungan nating ipakalat ang kaalaman tungkol sa integridad ng halalan sa Pilipinas! Ibahagi ang pangakong ito sa iyong mga kaibigan at pamilya.',
            'share_tagalog': 'Help spread the word about electoral integrity in the Philippines! Share this pledge with your friends and family.',
            'copy_link': 'Kopyahin ang Link',
            'copied': 'Nakopya!',
            'language_switch': 'English'
        }
    };
    
    // Add language switcher to the page
    function addLanguageSwitcher() {
        const header = document.querySelector('header');
        if (header) {
            const languageSwitcher = document.createElement('button');
            languageSwitcher.classList.add('language-switcher');
            languageSwitcher.textContent = translations[currentLanguage]['language_switch'];
            
            // Add Philippine flag icon
            const flagIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            flagIcon.classList.add('language-flag-icon');
            flagIcon.innerHTML = '<use xlink:href="ph-icons.svg#icon-ph-flag"></use>';
            
            languageSwitcher.prepend(flagIcon);
            header.appendChild(languageSwitcher);
            
            // Add event listener
            languageSwitcher.addEventListener('click', toggleLanguage);
        }
    }
    
    // Toggle between English and Tagalog
    function toggleLanguage() {
        currentLanguage = currentLanguage === 'en' ? 'tl' : 'en';
        localStorage.setItem('voteNotForSale_language', currentLanguage);
        updatePageContent();
    }
    
    // Update page content based on selected language
    function updatePageContent() {
        // Update main title
        const mainTitle = document.querySelector('.hero h1');
        if (mainTitle) {
            mainTitle.textContent = translations[currentLanguage]['title'];
            
            // Update the ::after content (subtitle) using a data attribute
            mainTitle.setAttribute('data-subtitle', translations[currentLanguage]['subtitle']);
        }
        
        // Update description
        const description = document.querySelector('.hero p:not(.tagalog-text)');
        if (description) {
            description.textContent = translations[currentLanguage]['description'];
        }
        
        // Update Tagalog text
        const tagalogText = document.querySelector('.tagalog-text');
        if (tagalogText) {
            tagalogText.textContent = translations[currentLanguage]['tagalog_description'];
        }
        
        // Update counter label
        const counterLabel = document.querySelector('.counter-label');
        if (counterLabel) {
            counterLabel.textContent = translations[currentLanguage]['counter_label'];
        }
        
        // Update pledge button
        const pledgeButton = document.querySelector('.btn:not(.share-btn)');
        if (pledgeButton) {
            pledgeButton.textContent = translations[currentLanguage]['pledge_button'];
        }
        
        // Update share button tooltip
        const shareBtn = document.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.setAttribute('data-tooltip', translations[currentLanguage]['share_button']);
        }
        
        // Update language switcher text
        const languageSwitcher = document.querySelector('.language-switcher');
        if (languageSwitcher) {
            languageSwitcher.textContent = translations[currentLanguage]['language_switch'];
            
            // Re-add the flag icon
            const flagIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            flagIcon.classList.add('language-flag-icon');
            flagIcon.innerHTML = '<use xlink:href="ph-icons.svg#icon-ph-flag"></use>';
            
            languageSwitcher.prepend(flagIcon);
        }
        
        // Update share modal content if it exists
        const shareModalTitle = document.querySelector('.share-modal-title');
        if (shareModalTitle) {
            shareModalTitle.textContent = translations[currentLanguage]['share_title'];
        }
        
        const shareDescription = document.querySelector('.share-description');
        if (shareDescription) {
            shareDescription.textContent = translations[currentLanguage]['share_description'];
        }
        
        const shareTagalog = document.querySelector('.share-tagalog em');
        if (shareTagalog) {
            shareTagalog.textContent = translations[currentLanguage]['share_tagalog'];
        }
        
        // Update copy link text
        const copyLinkLabel = document.querySelector('.share-option.copy .share-option-label');
        if (copyLinkLabel) {
            copyLinkLabel.textContent = translations[currentLanguage]['copy_link'];
        }
    }
    
    // Initialize language switcher and content
    addLanguageSwitcher();
    updatePageContent();
});