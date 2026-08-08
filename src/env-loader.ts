import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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
);

if (!isRealRemoteDb || ((isAIStudioEnv || isCloudRunEnv) && !process.env.FORCE_PRODUCTION_DB)) {
  const dbDir = process.env.SQLITE_DIR ? process.env.SQLITE_DIR : ((process.env.NODE_ENV === 'production' && isCloudRunEnv) ? '/tmp/prisma' : path.join(rootDir || process.cwd(), 'prisma'));
  if (!fs.existsSync(dbDir)) {
    try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) {}
  }
  const dbPath = path.join(dbDir, 'dev.db');
  dbUrl = `file:///${dbPath.replace(/^\//, '')}`;
  process.env.DATABASE_URL = dbUrl;
}
