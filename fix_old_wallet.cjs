const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove buggy wallet logic from ship-batch
const batchRegex = /\/\/ Credit supplier wallets immediately![\s\S]*?(?=\/\/ Sync parent order statuses)/;
code = code.replace(batchRegex, '');

// 2. Remove buggy wallet logic from order PATCH
const patchRegex = /if \(isStage5 && !wasStage5\) \{[\s\S]*?\}\n\n    \/\/ Sync parent order status and tracking code/;
code = code.replace(patchRegex, '// Sync parent order status and tracking code');

fs.writeFileSync('server.ts', code);
console.log('Cleaned up old buggy wallet logic');
