const fs = require('fs');
let code = fs.readFileSync('src/services/payment/ZibalService.ts', 'utf8');

const regex = /if \(authority\.startsWith\('ZIBAL_'\) \|\| authority\.startsWith\('SIM_'\)\) \{[\s\S]*?return \{ success: true, trackId: authority, refId: \`REF_\$\{authority\}\` \};[\s\S]*?\}/;
code = code.replace(regex, `if (authority.startsWith('ZIBAL_') || authority.startsWith('SIM_')) {
        if (process.env.NODE_ENV === 'production') throw new Error('Simulation payments are disabled in production');
        return { success: true, trackId: authority, refId: \`REF_\$\{authority\}\` };
      }`);

fs.writeFileSync('src/services/payment/ZibalService.ts', code);
