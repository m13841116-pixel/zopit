const fs = require('fs');
let code = fs.readFileSync('api/index.js', 'utf8');
code = code.replace(/appModule = require\('\.\.\/dist\/server\.cjs'\);/g, "appModule = require('../server_prod.cjs');");
code = code.replace(/appModule = require\('\.\.\/server_prod\.cjs'\);/g, "appModule = require('../dist/server.cjs');");
fs.writeFileSync('api/index.js', code);
