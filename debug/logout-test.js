/**
 * Logout Test Debug Script
 * 
 * This script can be run in the browser console to test the logout functionality.
 * Copy and paste this into your browser's developer console while the app is running.
 */

// Test function to check current authentication state
function checkAuthState() {
  console.log('=== Current Auth State ===');
  
  // Check localStorage/sessionStorage for tokens
  const keys = ['jwt_token', 'refresh_token', 'otp_verified', 'user_data', 'onboarding_completed'];
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
  });
  
  // Check if there's any memory storage
  if (window.__expo_storage) {
    console.log('Memory storage:', window.__expo_storage);
  }
  
  console.log('========================');
}

// Test function to manually clear all auth data
function manualClearAuth() {
  console.log('=== Manually Clearing Auth Data ===');
  
  // Clear localStorage
  const keys = ['jwt_token', 'refresh_token', 'otp_verified', 'user_data', 'onboarding_completed'];
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed ${key} from localStorage`);
  });
  
  // Clear memory storage
  if (window.__expo_storage) {
    keys.forEach(key => {
      delete window.__expo_storage[key];
    });
    console.log('Cleared memory storage');
  }
  
  console.log('Auth data manually cleared');
  console.log('You may need to refresh the page to see changes');
  console.log('===================================');
}

// Instructions
console.log(`
🔧 LOGOUT DEBUG TOOLS LOADED
==============================

Available commands:
1. checkAuthState() - Check current authentication data
2. manualClearAuth() - Manually clear all auth data

Usage:
1. Run checkAuthState() to see current state
2. Try the logout button in the app
3. Run checkAuthState() again to see if data was cleared
4. If data wasn't cleared, run manualClearAuth() to force clear

Tips:
- Open Network tab to see logout API calls
- Check Console for logout process logs
- Look for navigation changes after logout
`);

// Export functions to global scope
window.checkAuthState = checkAuthState;
window.manualClearAuth = manualClearAuth;
