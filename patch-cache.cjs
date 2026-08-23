const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const middleware = `// Add Cache-Control no-store for all API routes to prevent stale data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Import existing middlewares`;

if (!content.includes('Cache-Control')) {
    content = content.replace('app.use(express.json());', 'app.use(express.json());\n' + middleware);
    fs.writeFileSync('server.ts', content);
    console.log('Patched server.ts with Cache-Control');
}
