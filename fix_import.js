const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

code = code.replace(/\} , Volume2 \} from "lucide-react";/g, ', Volume2 } from "lucide-react";');

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
