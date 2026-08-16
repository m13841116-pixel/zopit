import { getPrisma } from '../../prisma.js';
const prisma = getPrisma();
import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { ZibalService } from './ZibalService.js';
import { MockZibalService } from './MockZibalService.js';

export class PaymentServiceFactory {
  static async getService(): Promise<PaymentGateway> {
    try {
      // 1. Check individual system config saved from the admin page
      const merchantCodeSetting = await prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_MERCHANT_CODE' } });
      
      // 2. Also check the legacy/JSON settings key for fallback
      const configRecord = await prisma.systemConfig.findUnique({ where: { key: 'payment_gateway_settings' } });
      let config: any = {};
      if (configRecord && configRecord.value) {
        try {
          config = JSON.parse(configRecord.value);
        } catch (e) {
          console.error('Error parsing payment_gateway_settings JSON', e);
        }
      }
      
      // Determine merchant ID from database or environment
      let merchantId = merchantCodeSetting?.value;
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = config.zibalMerchant;
      }
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = process.env.ZIBAL_MERCHANT || '6a0213e61b27742a09938588';
      }

      // Determine sandbox/mock mode status
      let useSandbox = false;
      if (config.zibalSandbox !== undefined) {
        useSandbox = config.zibalSandbox;
      } else {
        useSandbox = (process.env.USE_MOCK_GATEWAY === 'true' || merchantId === 'zibal' || merchantId === 'sandbox');
      }

      console.log('Using Real Zibal Payment Gateway with merchant:', merchantId);
      return new ZibalService(merchantId);
    } catch (err) {
      console.error('Error fetching gateway config', err);
      return new ZibalService(process.env.ZIBAL_MERCHANT || '6a0213e61b27742a09938588');
    }
  }
}
