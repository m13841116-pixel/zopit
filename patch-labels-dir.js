const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const labelsUploadDir = path\.join\(process\.cwd\(\), 'uploads', 'labels'\);/g, 
  "const labelsUploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads', 'labels') : path.join(process.cwd(), 'uploads', 'labels');");

fs.writeFileSync('server.ts', code);
