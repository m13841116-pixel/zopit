const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/return res\.status\(500\)\.json\(\{ error: 'خطایی در ورود رخ داد\. لطفاً مجدداً تلاش کنید\.' \}\);/g,
  "return res.status(500).json({ error: 'خطایی در ورود رخ داد. لطفاً مجدداً تلاش کنید.', details: error?.message || String(error) });");

code = code.replace(/res\.json\(\{\}\);\n\s*\}\n\s*\}\);/g,
  "res.status(500).json({ error: 'Failed to fetch config', details: err?.message || String(err) });\n    }\n  });");

fs.writeFileSync('server.ts', code);
