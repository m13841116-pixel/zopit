import { executeProxyRequest } from './src/services/payment/proxyClient.js';
(async () => {
  const start = Date.now();
  console.log("Testing one last time...");
  try {
    const res = await executeProxyRequest({
      action: 'request', merchant: 'zibal', amount: 10000, callbackUrl: 'http://localhost/cb', description: 'test'
    });
    console.log('Took', Date.now() - start, 'ms');
  } catch(e: any) {
    console.log("Error:", e.message, 'Took', Date.now() - start, 'ms');
  }
})();
