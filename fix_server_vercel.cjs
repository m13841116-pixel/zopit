const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(process\.env\.VERCEL\) \{[\s\S]*?console\.log\("Running on Vercel, skipping app\.listen\(\)"\);[\s\S]*?setImmediate.*?\{[\s\S]*?\} catch .*?\{[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?\} else \{/m;
code = code.replace(regex, `if (process.env.VERCEL) {\n    console.log("Running on Vercel, skipping app.listen() and heavy startup tasks");\n  } else {`);

fs.writeFileSync('server.ts', code);
