const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /sku: v\.sku \|\| sku\n\s*\}\)\)/g,
  "sku: v.sku || sku,\n            imageUrl: v.imageUrl || null\n          }))"
);
code = code.replace(
  /sku: sku \|\| ''\n\s*\}\]/g,
  "sku: sku || '',\n            imageUrl: null\n          }]"
);
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts for variant imageUrl");
