const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex1 = /const { firstName, lastName, brandName, shaba, cardNumber, mobile, bankName, accountHolderName, address, province, city, postalCode, telephone, autoApproveOrders, originAddress, website } = req\.body;/g;
const replacement1 = `const { firstName, lastName, brandName, shaba, cardNumber, mobile, bankName, accountHolderName, address, province, city, postalCode, telephone, autoApproveOrders, originAddress, website, activityType } = req.body;`;

const regex2 = /data: \{ firstName, lastName, brandName, shaba, cardNumber, mobile, bankName, accountHolderName, address, province, city, postalCode, telephone, autoApproveOrders, originAddress, website \}/g;
const replacement2 = `data: { firstName, lastName, brandName, shaba, cardNumber, mobile, bankName, accountHolderName, address, province, city, postalCode, telephone, autoApproveOrders, originAddress, website, activityType }`;

code = code.replace(regex1, replacement1);
code = code.replace(regex2, replacement2);

fs.writeFileSync('server.ts', code);
console.log('patched activityType');
