// Entry point for cPanel Passenger Node.js selector.
// This file delegates execution to the compiled production server.
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const prodServerPath = path.join(rootDir, 'dist', 'server.cjs');
const fallbackServerPath = path.join(rootDir, 'prod_output', 'server.cjs');

if (fs.existsSync(prodServerPath)) {
  console.log('[Passenger] Launching compiled server from dist/server.cjs...');
  require(prodServerPath);
} else if (fs.existsSync(fallbackServerPath)) {
  console.log('[Passenger] Launching compiled server from prod_output/server.cjs...');
  require(fallbackServerPath);
} else {
  console.error('[Passenger ERROR] Compiled backend bundle not found! Please run "npm run build" first.');
  process.exit(1);
}
