import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function findTrueRootDir(): string {
  const current = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  if (fs.existsSync(path.join(current, 'package.json'))) {
    return current;
  }
  const parent = path.join(current, '..');
  if (fs.existsSync(path.join(parent, 'package.json'))) {
    return parent;
  }
  return current;
}

const isAIStudioEnv = !!process.env.APPLET_ID;
const isCloudRunEnv = !!process.env.K_SERVICE;
const rootDir = (isAIStudioEnv || isCloudRunEnv) ? process.cwd() : findTrueRootDir();


if (!process.env.VERCEL) {
  try {
    dotenv.config({ path: path.join(rootDir, '.env') });
  } catch (e) {}
}


let dbUrl = process.env.DATABASE_URL || '';
function sanitizeDbUrl(url: string): string {
  if (!url) return url;
  const match = url.match(/^([a-zA-Z0-9+-]+:\/\/)(.*)$/);
  if (!match) return url;
  const scheme = match[1];
  const rest = match[2];
  const lastAtIndex = rest.lastIndexOf('@');
  if (lastAtIndex === -1) return url;
  const credentials = rest.substring(0, lastAtIndex);
  const hostAndDb = rest.substring(lastAtIndex + 1);
  const firstColon = credentials.indexOf(':');
  if (firstColon === -1) return url;
  const username = credentials.substring(0, firstColon);
  let password = credentials.substring(firstColon + 1);
  password = password.replace(/@/g, '%40');
  return `${scheme}${username}:${password}@${hostAndDb}`;
}

dbUrl = sanitizeDbUrl(dbUrl);
process.env.DATABASE_URL = dbUrl;

const isProduction =
  process.env.VERCEL === '1' ||
  process.env.VERCEL === 'true' ||
  process.env.NODE_ENV === 'production';

const isVercelEnv = !!process.env.VERCEL;

if (isProduction) {
  if (!dbUrl || dbUrl.trim() === '') {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL in production');
  }
  const isPostgres = (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) && !dbUrl.includes('dummy_db') && !dbUrl.includes('dummy:dummy');
  if (!isPostgres) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL in production');
  }
} else {
  const isRealRemoteDb = dbUrl && (
    dbUrl.startsWith('mysql://') || 
    dbUrl.startsWith('mysqls://') || 
    dbUrl.startsWith('postgresql://') || 
    dbUrl.startsWith('postgres://')
  ) && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('dummy_db');

  if (!isRealRemoteDb || (isAIStudioEnv && !process.env.FORCE_PRODUCTION_DB)) {
    const dbDir = process.env.SQLITE_DIR ? process.env.SQLITE_DIR : path.join(rootDir || process.cwd(), 'prisma');
    if (!fs.existsSync(dbDir)) {
      try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) {}
    }
    const dbPath = path.join(dbDir, 'dev.db');
    dbUrl = `file:///${dbPath.replace(/^\//, '')}`;
    process.env.DATABASE_URL = dbUrl;
  }
}

// Ensure database setup and schema-client alignment synchronously at startup before other modules load
let resolvedProvider = 'sqlite';
const resolvedUrl = process.env.DATABASE_URL || '';
if (resolvedUrl.startsWith('mysql://') || resolvedUrl.startsWith('mysqls://')) {
  resolvedProvider = 'mysql';
} else if (resolvedUrl.startsWith('postgresql://') || resolvedUrl.startsWith('postgres://')) {
  resolvedProvider = 'postgresql';
}

let currentSchemaProvider = '';
try {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const match = content.match(/provider\s*=\s*"([^"]+)"/);
    if (match) {
      currentSchemaProvider = match[1];
    }
  }
} catch (e) {}

const prismaClientDir = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
const clientExists = fs.existsSync(prismaClientDir);

if (!isVercelEnv && (resolvedProvider !== currentSchemaProvider || !clientExists || isProduction)) {
  console.log(`[Env Loader] Database setup needed (resolved="${resolvedProvider}", schema="${currentSchemaProvider}", exists=${clientExists}, prod=${isProduction})`);
  const setupScriptPath = path.join(process.cwd(), 'setup-db.js');
  if (fs.existsSync(setupScriptPath)) {
    try {
      console.log('[Env Loader] Running setup-db.js synchronously...');
      execSync('node setup-db.js', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: resolvedUrl } });
      console.log('[Env Loader] Database setup completed successfully.');
    } catch (err: any) {
      console.error('[Env Loader] Failed to execute setup-db.js synchronously on startup:', err.message);
    }
  } else {
    console.log('[Env Loader] setup-db.js not found, skipping setup script execution.');
  }
} else {
  console.log('[Env Loader] Database setup skipped: Client is up-to-date and provider matches.');
}

