const fs = require('fs');

const replaceInFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/Bank Kala/gi, 'Zopit');
  content = content.replace(/BankKala/gi, 'Zopit');
  content = content.replace(/بانک کالا/g, 'زوپیت');
  content = content.replace(/بانک‌کالا/g, 'زوپیت');
  content = content.replace(/<title>.*?<\/title>/, '<title>زوپیت | Zopit</title>');
  fs.writeFileSync(filePath, content, 'utf8');
};

const files = [
  'public/manifest.json',
  'index.html',
  'src/components/BankKalaLogo.tsx',
  'src/components/BankKalaEcosystemBanner.tsx'
];

files.forEach(replaceInFile);
console.log('Done.');
