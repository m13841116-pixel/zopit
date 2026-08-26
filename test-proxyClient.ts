import { executeProxyRequest } from './src/services/payment/proxyClient.ts';
async function run() {
  const res = await executeProxyRequest({
    merchant: '6a0213e61b27742a09938588',
    amount: 125000,
    callbackUrl: 'http://test.com/callback',
    description: 'test'
  });
  console.log('Final Result:', res);
}
run();
