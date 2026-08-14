const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

code = code.replace(/proAccountPrice: 0,/g, "proAccountPrice: 239500,");

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
