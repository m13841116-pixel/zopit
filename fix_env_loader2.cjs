const fs = require('fs');
let code = fs.readFileSync('src/env-loader.ts', 'utf8');

code = code.replace(
  /if \(resolvedProvider !== currentSchemaProvider \|\| !clientExists \|\| isProduction\) \{/,
  "if (!isVercelEnv && (resolvedProvider !== currentSchemaProvider || !clientExists || isProduction)) {"
);

fs.writeFileSync('src/env-loader.ts', code);
