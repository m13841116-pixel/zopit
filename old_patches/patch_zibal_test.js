const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const match = code.substring(9450, 9600);
console.log(match);
