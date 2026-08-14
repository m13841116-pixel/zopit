const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');

const divOpen = (code.match(/<div/g) || []).length;
const divClose = (code.match(/<\/div>/g) || []).length;

console.log(`div tags: open=${divOpen} close=${divClose}`);
