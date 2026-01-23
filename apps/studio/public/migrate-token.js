/**
 * Token Migration Script
 * 
 * Run this in browser console to migrate from old token key to new one
 */

// Old key that might be in localStorage
const oldTokenKey = 'auth:token';
const newTokenKey = 'thingsvis_token';

// Check if old token exists
const oldToken = localStorage.getItem(oldTokenKey);

if (oldToken) {
  
  
  // Move to new key
  localStorage.setItem(newTokenKey, oldToken);
  
  // Remove old key
  localStorage.removeItem(oldTokenKey);
  
  
  
} else {
  
}

// Also check what's currently in storage



