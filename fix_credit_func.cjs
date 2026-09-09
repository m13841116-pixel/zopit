const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  if (!group || group.status !== 'SHIPPED') return;`;
const replacement = `  if (!group || !['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(group.status)) return;`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log('Fixed credit func statuses');
