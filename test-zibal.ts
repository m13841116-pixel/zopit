import { PaymentServiceFactory } from './src/services/payment/PaymentServiceFactory.js';
(async () => {
  const paymentGateway = await PaymentServiceFactory.getService();
  const zibalResult = await paymentGateway.createPayment(
    10000,
    `Test`,
    'http://localhost/cb'
  );
  console.log(zibalResult);
})();
