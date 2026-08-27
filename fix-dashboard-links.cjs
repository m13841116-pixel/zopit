const fs = require('fs');
const path = require('path');

const dashboards = [
  { file: 'src/components/store-manager/StoreManagerDashboard.tsx', prefix: '/store' },
  { file: 'src/components/superadmin/SuperAdminDashboard.tsx', prefix: '/admin' },
  { file: 'src/components/supplier/SupplierDashboard.tsx', prefix: '/supplier' },
  { file: 'src/components/referrer/ReferrerDashboard.tsx', prefix: '/referrer' },
  { file: 'src/components/CustomerDashboard.tsx', prefix: '/customer' }
];

dashboards.forEach(d => {
  if (!fs.existsSync(d.file)) return;
  let content = fs.readFileSync(d.file, 'utf-8');
  
  // Add import if not exists
  if (!content.includes('import { Link }')) {
    content = content.replace('import React', 'import { Link } from "../Link";\nimport React');
  }

  // Find the sidebar mapping
  // Usually looks like: getDynamicNavItems().map((item) => ( <button ... > ... </button>
  // or navItems.map(...)
  
  // Replace <button key={item.id} with <Link href={`${d.prefix}/${item.id}`} key={item.id}
  content = content.replace(/<button\s+key=\{item\.id\}/g, `<Link href={\`${d.prefix}/\${item.id}\`} key={item.id}`);
  
  // Also we need to replace the closing </button> for that specific block. This is tricky with regex.
  // We can just rely on the fact that if we changed the opening tag, we should change the closing tag if it's the one in the map.
  // Actually, a simpler regex for the specific sidebar buttons:
  
  fs.writeFileSync(d.file, content);
});

