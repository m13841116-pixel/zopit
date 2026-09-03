import { PaymentServiceFactory } from './src/services/payment/PaymentServiceFactory.js';
(async () => {
  const paymentGateway = await PaymentServiceFactory.getService();
  const start = Date.now();
  console.log("Starting real callback payload...");
  try {
    const zibalResult = await paymentGateway.createPayment(
      1980000,
      `تمدید هاست ۱ ماهه اکانت پرو زوپیت کاربر #1`,
      'https://ais-dev-msu6dcyrsuhca36acjdqnl-546733762013.us-east1.run.app/api/public/pro/callback?userId=1&type=HOST_RENEWAL&amount=198000'
    );
    console.log('Took', Date.now() - start, 'ms', zibalResult);
  } catch(e: any) {
    console.log("Error:", e.message, 'Took', Date.now() - start, 'ms');
  }
})();
