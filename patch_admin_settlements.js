const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
        supplierId: supplier?.id || 0,
        supplierName: supplier ? \`\${supplier.firstName || ''} \${supplier.lastName || ''} (\${supplier.brandName || 'برند ثبت نشده'})\` : 'تامین‌کننده ناشناس',
`;

const replacement = `
        supplierId: supplier?.id || 0,
        supplierName: supplier ? \`\${supplier.firstName || ''} \${supplier.lastName || ''} (\${supplier.brandName || (supplier.role === 'STORE_MANAGER' ? 'فروشگاه' : 'برند ثبت نشده')})\` : 'کاربر ناشناس',
        role: supplier?.role || 'UNKNOWN',
`;

code = code.replace(target.trim(), replacement.trim());
fs.writeFileSync('server.ts', code);
console.log('Patched settlements response');
