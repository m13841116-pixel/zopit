const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace setView("login") with setView("explore") in the token useEffect
content = content.replace(
  /setView\("login"\);/g,
  (match, offset, string) => {
    // Only replace inside the useEffect if it's the auto-login part, but actually doing it for all is fine, 
    // EXCEPT for actual logout functions.
    return 'setView("explore");';
  }
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed default view.');
