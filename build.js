const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('[Build] Starting the production build process...');
try {
  // 1. Run database setup & client generation
  console.log('[Build] Running database setup (setup-db.js)...');
  execSync('node setup-db.js', { stdio: 'inherit' });

  // 2. Build Vite frontend to dist/
  console.log('[Build] Building Vite frontend application to dist/...');
  const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
  const hasViteBin = fs.existsSync(viteBin);
  const viteCmd = hasViteBin ? `node "${viteBin}"` : 'npx vite';
  execSync(`${viteCmd} build`, { stdio: 'inherit' });

  // 3. Compile backend using esbuild
  console.log('[Build] Compiling Express backend server using esbuild...');
  const distDir = path.join(__dirname, 'dist');
  const prodOutputDir = path.join(__dirname, 'prod_output');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  if (!fs.existsSync(prodOutputDir)) fs.mkdirSync(prodOutputDir, { recursive: true });

  esbuild.buildSync({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    sourcemap: true,
    outfile: 'dist/server.cjs',
    packages: 'external',
  });

  esbuild.buildSync({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    sourcemap: true,
    outfile: 'server_prod.cjs',
    packages: 'external',
  });

  console.log('[Build] esbuild compilation finished successfully.');

  // 4. Copy Prisma query engine binaries to both dist/ and prod_output/
  const prismaClientDir = path.join(__dirname, 'node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientDir)) {
    console.log('[Build] Copying query engine binaries and schema...');
    const files = fs.readdirSync(prismaClientDir);
    let copiedCount = 0;
    files.forEach(file => {
      if (file.includes('query_engine') || file.includes('query-engine') || file === 'schema.prisma') {
        fs.copyFileSync(path.join(prismaClientDir, file), path.join(distDir, file));
        fs.copyFileSync(path.join(prismaClientDir, file), path.join(prodOutputDir, file));
        copiedCount++;
      }
    });
    console.log(`[Build] Successfully copied ${copiedCount} Prisma files.`);
  }

  // 5. Copy frontend assets to prod_output as well
  function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyDirSync(distDir, prodOutputDir);

  // Copy .htaccess into dist and prod_output if it exists
  const htaccessSrc = path.join(__dirname, 'public', '.htaccess');
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(distDir, '.htaccess'));
    fs.copyFileSync(htaccessSrc, path.join(prodOutputDir, '.htaccess'));
    console.log('[Build] Copied .htaccess to dist/ and prod_output/ folders.');
  }

  // Copy pre-built dev.db if it exists
  const devDbSrc = path.join(__dirname, 'prisma', 'dev.db');
  if (fs.existsSync(devDbSrc) && fs.statSync(devDbSrc).size > 0) {
    fs.copyFileSync(devDbSrc, path.join(distDir, 'dev.db'));
    fs.copyFileSync(devDbSrc, path.join(prodOutputDir, 'dev.db'));
    console.log('[Build] Copied pre-built dev.db to dist/ and prod_output/ folders.');
  }

  console.log('[Build] Build process completed successfully!');
} catch (err) {
  console.error('[Build] Build process failed:', err.message);
  process.exit(1);
}
