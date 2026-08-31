const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('prisma db push')) {
  const syncCode = `
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

async function syncDb() {
  try {
    console.log('[Startup] Pushing schema to database...');
    await execPromise('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres" }
    });
    console.log('[Startup] Database schema synchronized.');
  } catch (err) {
    console.error('[Startup] Failed to sync database schema:', err);
  }
}
`;
  
  content = content.replace('import express from "express";', syncCode + '\nimport express from "express";');
  
  // Find where startServer is called and call syncDb inside it
  content = content.replace(
    'async function startServer() {',
    'async function startServer() {\n  await syncDb();'
  );
}

fs.writeFileSync('server.ts', content);
