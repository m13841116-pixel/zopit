import { PaymentServiceFactory } from './src/services/payment/PaymentServiceFactory.js';
(async () => {
  const paymentGateway = await PaymentServiceFactory.getService();
  const start = Date.now();
  console.log("Starting real payload...");
  try {
    const zibalResult = await paymentGateway.createPayment(
      1980000,
      `تمدید هاست ۱ ماهه اکانت پرو زوپیت کاربر #1`,
      'http://localhost/cb'
    );
    console.log('Took', Date.now() - start, 'ms', zibalResult);
  } catch(e: any) {
    console.log("Error:", e.message, 'Took', Date.now() - start, 'ms');
  }
})();
