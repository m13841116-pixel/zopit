const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(process\.env\.VERCEL && \(\!process\.env\.JWT_SECRET \|\| [^\)]+\)\) \{\n\s*console\.error\('❌ FATAL ERROR: JWT_SECRET[^']+'\);\n\s*process\.exit\(1\);\n\}/g, '');

code = code.replace(/if \(process\.env\.VERCEL && \(\!process\.env\.ENCRYPTION_KEY \|\| [^\)]+\)\) \{\n\s*console\.error\('❌ FATAL ERROR: ENCRYPTION_KEY[^']+'\);\n\s*process\.exit\(1\);\n\}/g, '');

code = code.replace(/if \(process\.env\.VERCEL && \(\!process\.env\.DATABASE_URL \|\| process\.env\.DATABASE_URL\.includes\('dummy_db'\)\)\) \{\n\s*console\.error\('❌ FATAL ERROR: DATABASE_URL[^']+'\);\n\s*process\.exit\(1\);\n\}/g, '');

fs.writeFileSync('server.ts', code);
