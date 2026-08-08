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

dotenv.config({ path: path.join(rootDir, '.env') });

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

const isRealRemoteDb = dbUrl && (
  dbUrl.startsWith('mysql://') || 
  dbUrl.startsWith('mysqls://') || 
  dbUrl.startsWith('postgresql://') || 
  dbUrl.startsWith('postgres://')
) && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('dummy_db');

const isVercelEnv = !!process.env.VERCEL;

if (!isRealRemoteDb || (isAIStudioEnv && !process.env.FORCE_PRODUCTION_DB)) {
  const dbDir = process.env.SQLITE_DIR ? process.env.SQLITE_DIR : (((process.env.NODE_ENV === 'production' && isCloudRunEnv) || isVercelEnv) ? '/tmp/prisma' : path.join(rootDir || process.cwd(), 'prisma'));
  if (!fs.existsSync(dbDir)) {
    try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) {}
  }
  const dbPath = path.join(dbDir, 'dev.db');
  
  if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
    // Try copying from pre-built locations to ensure tables exist
    const possibleSources = [
      path.join(process.cwd(), 'dist', 'dev.db'),
      path.join(process.cwd(), 'prisma', 'dev.db'),
      path.join(rootDir || process.cwd(), 'dist', 'dev.db'),
      path.join(rootDir || process.cwd(), 'prisma', 'dev.db'),
    ];
    for (const src of possibleSources) {
      if (fs.existsSync(src) && fs.statSync(src).size > 0) {
        try {
          fs.copyFileSync(src, dbPath);
          console.log(`[Env Loader] Copied pre-built database from ${src} to ${dbPath}`);
          break;
        } catch (copyErr: any) {
          console.warn(`[Env Loader] Failed to copy database from ${src}:`, copyErr.message);
        }
      }
    }
  }

  dbUrl = `file:///${dbPath.replace(/^\//, '')}`;
  process.env.DATABASE_URL = dbUrl;
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
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;

if (resolvedProvider !== currentSchemaProvider || !clientExists || isProduction) {
  console.log(`[Env Loader] Database setup needed (resolved="${resolvedProvider}", schema="${currentSchemaProvider}", exists=${clientExists}, prod=${isProduction})`);
  try {
    console.log('[Env Loader] Running setup-db.js synchronously...');
    execSync('node setup-db.js', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: resolvedUrl } });
    console.log('[Env Loader] Database setup completed successfully.');
  } catch (err: any) {
    console.error('[Env Loader] Failed to execute setup-db.js synchronously on startup:', err.message);
  }
} else {
  console.log('[Env Loader] Database setup skipped: Client is up-to-date and provider matches.');
}

