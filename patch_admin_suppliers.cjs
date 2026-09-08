const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /select: \{ id: true, firstName: true, lastName: true, brandName: true, status: true, mobile: true, \}/;
const replacement = `select: { id: true, firstName: true, lastName: true, brandName: true, status: true, mobile: true, activityType: true, originAddress: true, province: true, city: true, shaba: true }`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log('patched admin suppliers');
