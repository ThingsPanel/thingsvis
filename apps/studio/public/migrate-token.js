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
  console.log('Found old token, migrating...');
  
  // Move to new key
  localStorage.setItem(newTokenKey, oldToken);
  
  // Remove old key
  localStorage.removeItem(oldTokenKey);
  
  console.log('✓ Token migrated successfully');
  console.log('Please refresh the page');
} else {
  console.log('No old token found, nothing to migrate');
}

// Also check what's currently in storage
console.log('Current tokens in localStorage:');
console.log('- thingsvis_token:', localStorage.getItem('thingsvis_token') ? 'exists' : 'not found');
console.log('- auth:token:', localStorage.getItem('auth:token') ? 'exists' : 'not found');
