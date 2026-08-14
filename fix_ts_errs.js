const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');
code = code.replace(/onClick=\{\(\) => setActiveTab\(tab\.id\)\}/, 'onClick={() => setActiveTab(tab.id as any)}');
fs.writeFileSync('src/components/superadmin/SystemSettings.tsx', code);

let sms = fs.readFileSync('src/services/sms/SmsService.ts', 'utf8');
sms = sms.replace(/import \{ getPrisma \} from '\.\.\/\.\.\/db\/prisma\.js';/, "import { getPrisma } from '../../prisma.js';");
fs.writeFileSync('src/services/sms/SmsService.ts', sms);
