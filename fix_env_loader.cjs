const fs = require('fs');
let code = fs.readFileSync('src/env-loader.ts', 'utf8');

const regex = /if \(\!isRealRemoteDb \|\| \(isAIStudioEnv && \!process\.env\.FORCE_PRODUCTION_DB\)\) \{[\s\S]*?process\.env\.DATABASE_URL = dbUrl;\n\}/m;

const replacement = `if (!isRealRemoteDb || (isAIStudioEnv && !process.env.FORCE_PRODUCTION_DB)) {
  if (isVercelEnv && process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    // Keep it as postgres on Vercel
  } else {
    const dbDir = process.env.SQLITE_DIR ? process.env.SQLITE_DIR : (((process.env.NODE_ENV === 'production' && isCloudRunEnv) || isVercelEnv) ? '/tmp/prisma' : path.join(rootDir || process.cwd(), 'prisma'));
    if (!fs.existsSync(dbDir)) {
      try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) {}
    }
    const dbPath = path.join(dbDir, 'dev.db');
    dbUrl = \`file:///\${dbPath.replace(/^\\//, '')}\`;
    process.env.DATABASE_URL = dbUrl;
  }
}`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/env-loader.ts', code);
