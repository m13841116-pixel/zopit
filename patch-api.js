const fs = require('fs');
let code = fs.readFileSync('api/index.js', 'utf8');
code = code.replace(/"Critical backend load failure on Vercel"/g, '`Critical backend load failure on Vercel: ${err.message}`');
fs.writeFileSync('api/index.js', code);
