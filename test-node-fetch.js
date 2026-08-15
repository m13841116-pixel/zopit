const fetch = require('node-fetch'); // or native fetch if node 18+

async function run() {
  try {
    const res = await fetch('https://bankkalaha.ir/zibal-proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'ZopitPay2026Key'
      },
      body: JSON.stringify({ action: 'request' })
    });
    console.log('Native Fetch Status:', res.status);
    const text = await res.text();
    console.log('Native Fetch Text:', text);
  } catch (err) {
    console.error('Native Fetch Error:', err);
  }
}

run();
