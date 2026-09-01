const fs = require('fs');
let code = fs.readFileSync('src/components/super-admin/SuperAdminProductsList.tsx', 'utf8');
code = code.replace(/value={editingProduct\?\.supplierBasePrice \|\| ""}/g, 'value={editingProduct?.supplierBasePrice ?? ""}');
fs.writeFileSync('src/components/super-admin/SuperAdminProductsList.tsx', code);
