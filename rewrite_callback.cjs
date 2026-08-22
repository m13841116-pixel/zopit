const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ We pass 0 for amount to let verifyPayment just verify the status[\s\S]*?if \(\!orderToUpdate && orderId\) \{/m;

// Let's actually match the whole verify section and rewrite it
// I will just use string replacement on a larger chunk.
