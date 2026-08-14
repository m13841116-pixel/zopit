const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', 'utf8');

code = code.replace(/const \[proAccountPrice, setProAccountPrice\] = useState\("0"\);/g, 'const [proAccountPrice, setProAccountPrice] = useState("239500");');
code = code.replace(/setProAccountPrice\(data\.proAccountPrice \|\| "0"\);/g, 'setProAccountPrice(data.proAccountPrice || "239500");');

fs.writeFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', code);
