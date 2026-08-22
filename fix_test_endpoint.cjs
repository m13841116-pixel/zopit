const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/payment\/test', async \(req, res\) => \{/g;
const replacement = `app.get('/api/payment/test', async (req, res) => {\n  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Endpoint test در محیط عملیاتی غیرفعال است' });`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
