const fs = require('fs');
let code = fs.readFileSync('src/services/payment/clientPaymentBridge.ts', 'utf8');

code = code.replace(/import \{ UniversalPaymentRequestOptions, UniversalPaymentResult \} from '\.\.\/\.\.\/types';/g, `import { toast } from "../../components/GlobalToast";`);

fs.writeFileSync('src/services/payment/clientPaymentBridge.ts', code);
