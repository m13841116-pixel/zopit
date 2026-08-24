import { ZibalService } from './src/services/payment/ZibalService.js';
async function test() {
  const service = new ZibalService('6a0213e61b27742a09938588');
  try {
    const res = await service.createPayment(10000, 'تسویه فاکتور فروشگاه #123', 'https://zopit.ir');
    console.log("Success:", res);
  } catch (e) {
    console.error("Error creating payment:", e);
  }
}
test();
