const fs = require('fs');

const files = [
  'src/components/superadmin/AdminAnnouncements.tsx',
  'src/components/superadmin/AdminBanners.tsx',
  'src/components/store-manager/StoreManagerDashboard.tsx',
  'src/components/superadmin/SystemSettings.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/5 \* 1024 \* 1024/g, '20 * 1024 * 1024'); // 20MB
    content = content.replace(/5MB/g, '20MB');
    fs.writeFileSync(f, content, 'utf8');
  }
});
console.log('Video size changed to 20MB');
