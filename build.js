const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('[Build] Starting clean production build process for Vercel...');
try {
  // 1. Build Vite frontend to dist/
  console.log('[Build] Building Vite frontend application to dist/...');
  const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
  const hasViteBin = fs.existsSync(viteBin);
  const viteCmd = hasViteBin ? `node "${viteBin}"` : 'npx vite';
  execSync(`${viteCmd} build`, { stdio: 'inherit' });

  // 2. Compile backend using esbuild
  console.log('[Build] Compiling Express backend server using esbuild...');
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  esbuild.buildSync({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    sourcemap: true,
    outfile: 'dist/server.cjs',
    packages: 'external',
  });

  esbuild.buildSync({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    sourcemap: true,
    outfile: 'server_prod.cjs',
    packages: 'external',
  });

  console.log('[Build] esbuild compilation finished successfully.');

  // 3. Copy .htaccess into dist if it exists
  const htaccessSrc = path.join(__dirname, 'public', '.htaccess');
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(distDir, '.htaccess'));
    console.log('[Build] Copied .htaccess to dist/ folder.');
  }

  console.log('[Build] Build process completed successfully!');
} catch (err) {
  console.error('[Build] Build process failed:', err.message);
  process.exit(1);
}
