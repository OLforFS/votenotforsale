// Firebase Pledge System Implementation

// Import Firebase utilities from firebase-config.js
import { db, saveToFirestore, getCollectionCount, setupCollectionListener } from './firebase-config.js';

// Collection name for pledges
const PLEDGES_COLLECTION = 'pledges';

// Initialize the pledge system
export function initPledgeSystem() {
  console.log('Pledge system initializing...');
  
  // Update the pledge counter with data from Firebase
  updatePledgeCounterFromFirebase();
  
  // Set up real-time listener for pledge count updates
  setupPledgeCountListener();
  
  // Set up form submission handler
  setupPledgeFormHandler();
  
  console.log('Pledge system initialized successfully');
}

// Update the pledge counter with the latest count from Firebase
async function updatePledgeCounterFromFirebase() {
  try {
    const count = await getCollectionCount(PLEDGES_COLLECTION);
    updatePledgeCounterUI(count);
    console.log(`Pledge count updated from Firebase: ${count}`);
  } catch (error) {
    console.error('Error updating pledge counter from Firebase:', error);
    // Fallback to local storage count if Firebase fails
    const localPledges = JSON.parse(localStorage.getItem('pledges')) || [];
    updatePledgeCounterUI(localPledges.length);
  }
}

// Set up a real-time listener for pledge count updates
function setupPledgeCountListener() {
  setupCollectionListener(PLEDGES_COLLECTION, (snapshot) => {
    const count = snapshot.size;
    updatePledgeCounterUI(count);
    console.log(`Pledge count updated in real-time: ${count}`);
  });
}

// Update the pledge counter UI with animation
function updatePledgeCounterUI(count) {
  const pledgeCountElement = document.getElementById('pledge-count');
  if (!pledgeCountElement) return;
  
  // Animate counter
  const duration = 1000; // 1 second animation
  const startValue = parseInt(pledgeCountElement.textContent) || 0;
  const endValue = count;
  const startTime = performance.now();
  
  // Only animate if there's a difference
  if (startValue !== endValue) {
    function animateCounter(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
      
      pledgeCountElement.textContent = currentValue;
      
      if (progress < 1) {
        requestAnimationFrame(animateCounter);
      } else {
        pledgeCountElement.textContent = endValue;
      }
    }
    
    requestAnimationFrame(animateCounter);
  } else {
    pledgeCountElement.textContent = count;
  }
}

// Set up the pledge form submission handler
function setupPledgeFormHandler() {
  const pledgeForm = document.getElementById('pledge-form');
  if (!pledgeForm) return;
  
  // Override the existing submit event listener
  pledgeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    // Use the search input value instead of the dropdown value
    const citySearch = document.getElementById('city-search');
    const city = citySearch.value.trim();
    const email = document.getElementById('email').value;
    
    // Validate city input
    if (!city) {
      alert('Please enter a city or municipality');
      return;
    }
    
    // Create pledge object
    const pledge = {
      name,
      city,
      email,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage as backup
    savePledgeToLocalStorage(pledge);
    
    // Save to Firebase
    try {
      await saveToFirestore(PLEDGES_COLLECTION, pledge);
      console.log('Pledge saved to Firebase successfully');
    } catch (error) {
      console.error('Error saving pledge to Firebase:', error);
      // Already saved to localStorage as backup, so no additional action needed
    }
    
    // Show success message
    showSuccessMessage();
    
    // Reset form
    pledgeForm.reset();
  });
}

// Save pledge to localStorage as backup
function savePledgeToLocalStorage(pledge) {
  // Get existing pledges or initialize empty array
  let pledges = JSON.parse(localStorage.getItem('pledges')) || [];
  
  // Add new pledge
  pledges.push(pledge);
  
  // Save back to localStorage
  localStorage.setItem('pledges', JSON.stringify(pledges));
  
  console.log('Pledge saved to localStorage as backup');
}

// Show success message with countdown
function showSuccessMessage() {
  const successMessage = document.getElementById('success-message');
  if (!successMessage) return;
  
  // Show success message popup with smooth transition
  successMessage.style.display = 'block';
  
  // Create countdown elements if they don't exist
  if (!successMessage.querySelector('.countdown-timer')) {
    const countdownTimer = document.createElement('div');
    countdownTimer.className = 'countdown-timer';
    countdownTimer.innerHTML = 'Redirecting in <span id="countdown-seconds">3</span> seconds...';
    
    const countdownBar = document.createElement('div');
    countdownBar.className = 'countdown-bar';
    
    const countdownProgress = document.createElement('div');
    countdownProgress.className = 'countdown-progress';
    countdownBar.appendChild(countdownProgress);
    
    successMessage.appendChild(countdownTimer);
    successMessage.appendChild(countdownBar);
  }
  
  // Add close button to success message if not already added
  if (!successMessage.querySelector('.close-success')) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-success';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = function() {
      // Fade out and redirect
      successMessage.classList.remove('active');
      setTimeout(() => {
        successMessage.style.display = 'none';
        window.location.href = '/';
      }, 300);
    };
    successMessage.appendChild(closeBtn);
  }
  
  // Start countdown animation
  const countdownProgress = successMessage.querySelector('.countdown-progress');
  const countdownSeconds = successMessage.querySelector('#countdown-seconds');
  
  // Trigger fade in
  setTimeout(() => {
    successMessage.classList.add('active');
  }, 10);
  
  // Start progress bar animation
  setTimeout(() => {
    countdownProgress.style.transform = 'scaleX(0)';
  }, 50);
  
  // Update countdown seconds
  let secondsLeft = 3;
  const countdownInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft >= 0) {
      countdownSeconds.textContent = secondsLeft;
    }
  }, 1000);
  
  // Auto redirect after 3 seconds with smooth transition
  setTimeout(() => {
    clearInterval(countdownInterval);
    successMessage.classList.remove('active');
    setTimeout(() => {
      successMessage.style.display = 'none';
      window.location.href = '/';
    }, 300);
  }, 3000);
}