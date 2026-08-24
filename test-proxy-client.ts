import { executeProxyRequest } from './src/services/payment/proxyClient.js';

async function test() {
  console.log("Testing executeProxyRequest...");
  const res = await executeProxyRequest({
    action: 'request',
    merchant: '6a0213e61b27742a09938588',
    amount: 50000,
    callbackUrl: 'https://zopit.ir/callback-test',
    description: 'test'
  });
  console.log("Result:");
  console.log(res);
}

test().catch(console.error);
