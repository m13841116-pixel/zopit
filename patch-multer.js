const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const rootUploadsDir = path\.join\(process\.cwd\(\), 'uploads'\);/g, 
  "const rootUploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');");

code = code.replace(/const devUploadDir = path\.join\(process\.cwd\(\), 'uploads'\);/g, 
  "const devUploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');");

fs.writeFileSync('server.ts', code);
