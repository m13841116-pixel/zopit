const https = require('https');
const options = {
  hostname: 'bankkalaha.ir',
  port: 443,
  path: '/zibal-proxy.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': 'ZopitPay2026Key',
    'User-Agent': 'Zopit-Vercel-Client/3.0'
  },
  rejectUnauthorized: false
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Proxy Response (Vercel UA):', res.statusCode, data));
});
req.write(JSON.stringify({ action: 'request', merchant: 'zibal', amount: 1000, callbackUrl: 'https://test.com/cb' }));
req.end();
