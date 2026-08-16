const https = require('https');
const options = {
  hostname: 'bankkalaha.ir',
  port: 443,
  path: '/zibal-proxy.php',
  method: 'GET',
  family: 4
};
const start = Date.now();
const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode, 'Time:', Date.now() - start, 'ms');
});
req.on('error', console.error);
req.end();
