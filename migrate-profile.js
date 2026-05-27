/**
 * One-time migration script to move old profile data to new encrypted database
 * Run this AFTER creating a new account in the app
 */

const fs = require('fs');
const path = require('path');

// Read your old profile data
const oldProfilePath = path.join(__dirname, 'src', 'data', 'user-data', '2e802c35-1812-41be-953d-5aed182214f6', 'profile.json');
const profileData = JSON.parse(fs.readFileSync(oldProfilePath, 'utf-8'));

console.log('Profile data loaded successfully!');
console.log('\nTo migrate your profile:');
console.log('1. Go to http://localhost:3000/signup');
console.log('2. Create a new account with casonlamothe@gmail.com (or any email)');
console.log('3. Login to your new account');
console.log('4. Go to http://localhost:3000/profile');
console.log('5. Copy the JSON below and paste it into the browser console:');
console.log('\n--- COPY THIS ---\n');
console.log(`
// Paste this in browser console on /profile page
const profileData = ${JSON.stringify(profileData, null, 2)};

fetch('/api/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profileData)
}).then(res => res.json()).then(data => {
  console.log('Migration result:', data);
  alert('Profile migrated successfully! Refresh the page.');
}).catch(err => {
  console.error('Migration failed:', err);
  alert('Migration failed. Check console for details.');
});
`);
console.log('\n--- END ---\n');
