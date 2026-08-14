const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');
code = code.replace(
  '  sku               String?',
  '  sku               String?\n  imageUrl          String?'
);
fs.writeFileSync('prisma/schema.prisma', code);
console.log("Patched");
