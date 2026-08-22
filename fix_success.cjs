const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/let payLink = `\/api\/public\/checkout\/callback\?orderId=\$\{singleOrder\.id\}&success=true`;/g, `let payLink = '';`);
code = code.replace(/let payLink = `\/api\/public\/checkout\/callback\?orderId=\$\{order\.id\}&success=true`;/g, `let payLink = '';`);
code = code.replace(/payLink = `\/api\/public\/checkout\/callback\?orderId=\$\{order\.id\}&success=true`;/g, `payLink = '';`);

fs.writeFileSync('server.ts', code);
