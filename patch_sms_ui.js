const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/PaymentSmsSettings.tsx', 'utf8');

// Modernize the headers and buttons inside PaymentSmsSettings
code = code.replace(/bg-card rounded-3xl p-6 border border-subtle/g, 'bg-surface p-6 rounded-3xl border border-subtle shadow-sm hover:shadow-md transition-shadow');
code = code.replace(/text-lg font-black text-primary/g, 'text-xl font-black text-indigo-500');

fs.writeFileSync('src/components/superadmin/PaymentSmsSettings.tsx', code);
