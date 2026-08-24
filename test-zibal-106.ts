import { ZibalService } from './src/services/payment/ZibalService.js';
async function test() {
  const service = new ZibalService('6a0213e61b27742a09938588');
  try {
    const res = await service.createPayment(1250000, 'تسویه فاکتور فروشگاه #1', 'https://ais-dev-u5ezjyr5kvwyijv3p67xov-266247537592.us-east1.run.app/api/public/store-invoice/callback?invoiceId=1');
    console.log("Success:", res);
  } catch (e) {
    console.error("Error creating payment:", e);
  }
}
test();
