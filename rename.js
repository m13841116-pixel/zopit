const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/BankKala/gi, 'Zopit');
  content = content.replace(/بانک کالا/g, 'زوپیت');
  content = content.replace(/بانک‌کالا/g, 'زوپیت');
  fs.writeFileSync(filePath, content, 'utf8');
};

const files = [
  'src/components/Navbar.tsx',
  'src/components/BankKalaLogo.tsx',
  'src/components/BankKalaEcosystemBanner.tsx',
  'src/components/CustomCodeInjector.tsx',
  'src/components/superadmin/SuperAdminDashboard.tsx',
  'src/components/superadmin/SystemSettings.tsx',
  'src/App.tsx',
  'src/components/store-manager/MyCatalog.tsx',
  'src/components/store-manager/StoreManagerDashboard.tsx',
  'src/components/store-manager/StoreOrders.tsx',
  'src/components/store-manager/StoreMarketplace.tsx',
  'src/components/superadmin/AdminBanners.tsx',
  'src/components/superadmin/Tickets.tsx',
  'src/components/CartContext.tsx',
  'src/components/Explore.tsx',
  'src/components/supplier/SupplierDashboard.tsx',
  'public/sw.js',
  'public/manifest.json',
  'index.html',
  'server.ts'
];

files.forEach(replaceInFile);
console.log('Done replacing names.');
