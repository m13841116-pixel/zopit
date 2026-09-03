global.window = { location: { origin: 'http://localhost' } } as any;
import { requestClientSideZibalPayment } from './src/services/payment/clientPaymentBridge.js';
(async () => {
  const start = Date.now();
  console.log("Starting client bridge...");
  const res = await requestClientSideZibalPayment({
    amountInRials: 10000,
    callbackUrl: "https://ais-dev-msu6dcyrsuhca36acjdqnl-546733762013.us-east1.run.app/cb",
    description: "test"
  });
  console.log('Took', Date.now() - start, 'ms', res);
})();
