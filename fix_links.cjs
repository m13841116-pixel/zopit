const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
let errorFixes = code.replace(/<a([^>]*?)href="([^"]+)"([^>]*?)>([\s\S]*?)<\/button>/gi, '<a$1href="$2"$3>$4</a>');
fs.writeFileSync('src/App.tsx', errorFixes, 'utf8');
