const fs = require('fs');
let content = fs.readFileSync('src/components/ZopitLogo.tsx', 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/ZopitLogo.tsx', content, 'utf8');
