const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(orderToUpdate\.status === 'PAID' \|\| orderToUpdate\.status === 'SUCCESS' \|\| orderToUpdate\.status === 'COMPLETED' \|\| orderToUpdate\.status === 'WAITING_SUPPLIER_CONFIRMATION'\) \{/g;
const replacement = `if (orderToUpdate.status === 'PAID' || orderToUpdate.status === 'SUCCESS' || orderToUpdate.status === 'COMPLETED') {`;
code = code.replace(regex, replacement);

fs.writeFileSync('server.ts', code);
