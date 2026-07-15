const fs = require('fs');
const path = require('path');

const dbPath = 'C:\\Users\\POLARINDO\\AppData\\Roaming\\pgAdmin\\pgadmin4.db';

if (!fs.existsSync(dbPath)) {
  console.log('pgAdmin database not found at:', dbPath);
  process.exit(1);
}

const data = fs.readFileSync(dbPath);

// Extract readable strings of length >= 4
let currentString = '';
const strings = [];
for (let i = 0; i < data.length; i++) {
  const char = data[i];
  if (char >= 32 && char <= 126) {
    currentString += String.fromCharCode(char);
  } else {
    if (currentString.length >= 4) {
      strings.push(currentString);
    }
    currentString = '';
  }
}
if (currentString.length >= 4) {
  strings.push(currentString);
}

console.log('--- Total extracted strings:', strings.length);

// Look for connection keywords
const keywords = ['localhost', 'postgres', '5432', '5433', '127.0.0.1'];
const matches = strings.filter(str => {
  return keywords.some(keyword => str.toLowerCase().includes(keyword));
});

console.log('--- Matching connection strings / details found in database:');
const uniqueMatches = Array.from(new Set(matches));
console.log(uniqueMatches.slice(0, 100));
