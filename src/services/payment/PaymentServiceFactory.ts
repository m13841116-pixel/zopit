import { getPrisma } from '../../prisma.js';
const prisma = getPrisma();

import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { ZibalService } from './ZibalService.js';
import { SepService } from './SepService.js';
import { MockZibalService } from './MockZibalService.js';

export class PaymentServiceFactory {
  static async getService(): Promise<PaymentGateway> {
    try {
      // 1. Check individual system config saved from the admin page with a fast 2s timeout
      const dbPromise = Promise.all([
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_TYPE' } }),
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_MERCHANT_CODE' } }),
        prisma.systemConfig.findUnique({ where: { key: 'payment_gateway_settings' } })
      ]);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      
      const res: any = await Promise.race([dbPromise, timeoutPromise]);
      const gatewayTypeSetting = res ? res[0] : null;
      const merchantCodeSetting = res ? res[1] : null;
      const configRecord = res ? res[2] : null;

      let config: any = {};
      if (configRecord && configRecord.value) {
        try {
          config = JSON.parse(configRecord.value);
        } catch (e) {
          console.error('Error parsing payment_gateway_settings JSON', e);
        }
      }
      
      const gatewayType = gatewayTypeSetting?.value || config.gatewayType || process.env.PAYMENT_GATEWAY_TYPE || 'ZIBAL';

      // Determine merchant ID from database or environment
      let merchantId = merchantCodeSetting?.value;
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = config.zibalMerchant;
      }
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = process.env.ZIBAL_MERCHANT || '6a0213e61b27742a09938588';
      }

      if (gatewayType === 'SEP') {
        // Fallback for SEP terminal ID if not configured
        const sepTerminalId = merchantId === '6a0213e61b27742a09938588' ? '15723041' : merchantId;
        console.log('Using SEP (Saman) Payment Gateway with Terminal ID:', sepTerminalId);
        return new SepService(sepTerminalId);
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
