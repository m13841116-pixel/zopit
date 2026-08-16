const fs = require('fs');
let v = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
v.functions["api/index.js"].includeFiles = "dist/**/* node_modules/.prisma/client/**/* prisma/schema.prisma server_prod.cjs";
fs.writeFileSync('vercel.json', JSON.stringify(v, null, 2));
