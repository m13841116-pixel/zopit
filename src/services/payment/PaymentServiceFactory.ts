import { getPrisma } from '../../prisma.js';
const prisma = getPrisma();
import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { ZibalService } from './ZibalService.js';
import { SepService } from './SepService.js';

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
          console.error('Error parsing payment_gateway_settings JSON');
        }
      }
      
      const gatewayType = (gatewayTypeSetting?.value || config.gatewayType || process.env.PAYMENT_GATEWAY_TYPE || 'ZIBAL').toUpperCase();

      // Determine merchant ID from database or environment
      let merchantId = merchantCodeSetting?.value;
      
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = config.zibalMerchant;
      }
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT;
      }

      if (!merchantId || merchantId.trim() === '' || merchantId === 'zibal') {
        throw new Error('Fatal: Gateway merchant code is not configured. Please set ZIBAL_MERCHANT_ID in environment variables.');
      }

      if (gatewayType === 'SEP') {
        console.log('[PaymentServiceFactory] Using SEP (Saman) Payment Gateway');
        return new SepService(merchantId);
      }

      console.log('[PaymentServiceFactory] Using Real Zibal Payment Gateway');
      return new ZibalService(merchantId);

    } catch (err: any) {
      console.error('[PaymentServiceFactory Error]', err.message);
      const fallbackMerchant = process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT;
      if (!fallbackMerchant || fallbackMerchant.trim() === '' || fallbackMerchant === 'zibal') {
          throw new Error('Fatal: Gateway config missing and no valid ZIBAL_MERCHANT_ID found in environment variables.');
      }
      return new ZibalService(fallbackMerchant);
    }
  }
}
