const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

code = code.replace(/text-rose-500 line-through decoration-rose-500/g, 'text-primary');
code = code.replace(/<span className="text-\[11px\] text-muted">ارزش واقعى:<\/span>/g, '<span className="text-[11px] text-muted">ارزش خدمت:</span>');

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
