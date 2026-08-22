const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex3 = /if \(orderToUpdate\.status === 'PAID' \|\| orderToUpdate\.status === 'SUCCESS' \|\| orderToUpdate\.status === 'COMPLETED' \|\| orderToUpdate\.status === 'WAITING_SUPPLIER_CONFIRMATION'\) \{/g;
const replacement3 = `if (verifyData.amount) {
           const expectedAmount = Math.round(orderToUpdate.totalAmount * 10);
           if (Number(verifyData.amount) !== expectedAmount) {
              console.error(\`Amount mismatch: Expected \${expectedAmount}, got \${verifyData.amount}\`);
              return res.redirect(\`\${redirectBase}/checkout/failed?trackId=\${trackId}&orderId=\${orderToUpdate.id}&reason=amount_mismatch\`);
           }
        }
        if (orderToUpdate.status === 'PAID' || orderToUpdate.status === 'SUCCESS' || orderToUpdate.status === 'COMPLETED') {`;

code = code.replace(regex3, replacement3);

fs.writeFileSync('server.ts', code);
