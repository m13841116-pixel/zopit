const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'store-manager');
const appFile = path.join(__dirname, 'src', 'App.tsx');

let hasErrors = false;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for <a href="...">
  const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/g;
  let match;
  while ((match = aTagRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('/') || href.startsWith('#')) {
      console.error(`\x1b[31m[ERROR]\x1b[0m In ${path.basename(filePath)}: Found local link <a href="${href}">. In SPAs, this can cause a full page reload and redirect to the default route (Explore). Use onClick={...} with state instead.`);
      hasErrors = true;
    }
  }

  // Check for window.location.href or window.location.replace
  if (content.includes('window.location.href =') || content.includes('window.location.replace')) {
     console.warn(`\x1b[33m[WARN]\x1b[0m In ${path.basename(filePath)}: Found direct window.location modification. Ensure this doesn't break SPA routing.`);
  }
}

function walkDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const filePath = path.join(currentDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      checkFile(filePath);
    }
  }
}

console.log("Checking store-manager components for bad links...");
if (fs.existsSync(dir)) {
  walkDir(dir);
} else {
  console.error("Directory not found:", dir);
}

console.log("\nChecking App.tsx routing...");
if (fs.existsSync(appFile)) {
  const appContent = fs.readFileSync(appFile, 'utf-8');
  if (appContent.includes('window.location.pathname === \'/\' && view !== \'explore\'')) {
      console.warn(`\x1b[33m[WARN]\x1b[0m App.tsx contains fallback logic that might redirect internal link clicks to 'explore'.`);
  }
}

if (!hasErrors) {
  console.log("\n\x1b[32m[SUCCESS]\x1b[0m No broken SPA links found in store-manager.");
} else {
  console.log("\n\x1b[31m[FAILURE]\x1b[0m Found potentially broken links. Please replace <a href=\"...\"> with buttons/state navigation.");
}
