const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /cardNumber: true,\s+storeName: true,/m;
const replacement = `cardNumber: true,
        storeName: true,
        originAddress: true,
        postalCode: true,
        telephone: true,
        website: true,
        activityType: true,`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log('patched all-users');
