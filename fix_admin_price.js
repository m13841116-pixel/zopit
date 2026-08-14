const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/proAccountPrice: map\['pro_account_price'\] \|\| '0',/g, "proAccountPrice: map['pro_account_price'] || '239500',");
code = code.replace(/\{ key: 'pro_account_price', value: String\(proAccountPrice \?\? '0'\) \},/g, "{ key: 'pro_account_price', value: String(proAccountPrice ?? '239500') },");

fs.writeFileSync('server.ts', code);
