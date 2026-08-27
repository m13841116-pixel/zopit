const fs = require('fs');
const path = require('path');

const files = [
  'src/components/store-manager/StoreManagerDashboard.tsx',
  'src/components/superadmin/SuperAdminDashboard.tsx',
  'src/components/supplier/SupplierDashboard.tsx',
  'src/components/referrer/ReferrerDashboard.tsx',
  'src/components/CustomerDashboard.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  
  // A simplistic replacement for the specific structure:
  // In each of these files, there is a navigation map like `.map((item) => (`
  // which used to return a button, and now returns a <Link>.
  // We need to replace the `</button>` that is inside the `.map((item) => (` block.
  
  // Let's just find `</button>\n          ))` and replace with `</Link>\n          ))`
  content = content.replace(/<\/button>\s*\)\)/g, '</Link>\n          ))');
  // Also check if there's `</button>\n        ))`
  content = content.replace(/<\/button>\s*\}\)/g, '</Link>\n        })');
  // And `</button>\n        ))}`
  content = content.replace(/<\/button>\s*\)\)}/g, '</Link>\n        ))}');
  
  fs.writeFileSync(file, content);
});
