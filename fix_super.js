const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', 'utf8');

code = code.replace(/const \[promoCode, setPromoCode\] = useState\("ZOPIT-PRO-198"\);\n\s*const \[promoCode, setPromoCode\] = useState\("ZOPIT-PRO-198"\);/, 
  'const [promoCode, setPromoCode] = useState("ZOPIT-PRO-198");');
  
fs.writeFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', code);
