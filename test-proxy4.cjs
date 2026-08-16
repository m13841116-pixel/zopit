const https = require('https');
const options = {
  hostname: 'bankkalaha.ir',
  port: 443,
  path: '/zibal-proxy.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': 'ZopitPay2026Key',
    'User-Agent': 'Mozilla/5.0',
    'X-Forwarded-For': '76.76.21.21' // Vercel IP
  },
  rejectUnauthorized: false
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Proxy Response (with X-Forwarded-For):', data));
});
req.write(JSON.stringify({ action: 'request', merchant: 'zibal', amount: 1000, callbackUrl: 'https://test.com/cb' }));
req.end();
