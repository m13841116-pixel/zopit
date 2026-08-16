const https = require('https');
const options = {
  hostname: 'bankkalaha.ir',
  port: 443,
  path: '/zibal-proxy.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': 'ZopitPay2026Key',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  },
  rejectUnauthorized: false
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Proxy Response:', data));
});
req.write(JSON.stringify({
  action: 'request',
  merchant: '6a0213e61b27742a09938588',
  amount: 50000,
  callbackUrl: 'https://zopit.ir/callback-test',
  description: 'test'
}));
req.end();
