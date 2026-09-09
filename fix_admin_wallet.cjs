const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace admin dashboard wallet summary
code = code.replace(/await prisma\.supplierWallet\.aggregate\(\{ _sum: \{ balance: true, pending: true \} \}\);/g, "await prisma.wallet.aggregate({ _sum: { balance: true } });");
code = code.replace(/supplierWalletBalance: supplierWalletTotal._sum.balance \|\| 0,/g, "supplierWalletBalance: supplierWalletTotal._sum.balance || 0,");
code = code.replace(/supplierWalletPending: supplierWalletTotal._sum.pending \|\| 0/g, "supplierWalletPending: 0");

fs.writeFileSync('server.ts', code);
console.log('Fixed admin wallet sum');
