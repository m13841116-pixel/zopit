import { getPrisma } from '../../prisma.js';
const prisma = getPrisma();
import { PaymentGateway } from '../../interfaces/payment-gateway.interface';
import { ZibalService } from './ZibalService';
import { MockZibalService } from './MockZibalService';

export class PaymentServiceFactory {
  static async getService(): Promise<PaymentGateway> {
    try {
      const configRecord = await prisma.systemConfig.findUnique({ where: { key: 'payment_gateway_settings' } });
      let config: any = {};
      if (configRecord && configRecord.value) {
        config = JSON.parse(configRecord.value);
      }
      
      const useSandbox = config.zibalSandbox !== undefined ? config.zibalSandbox : (process.env.USE_MOCK_GATEWAY === 'true');
      const merchantId = (config.zibalMerchant && config.zibalMerchant !== 'zibal_merchant_key')
        ? config.zibalMerchant 
        : (process.env.ZIBAL_MERCHANT || '6a0213e61b27742a09938588');
      
      if (useSandbox) {
        console.log('Using Mock Payment Gateway (Sandbox Mode)');
        return new MockZibalService();
      }
      
      console.log('Using Real Zibal Payment Gateway', merchantId);
      return new ZibalService(merchantId);
    } catch (err) {
      console.error('Error fetching gateway config', err);
      // Fallback
      if (process.env.USE_MOCK_GATEWAY === 'true') {
        return new MockZibalService();
      }
      return new ZibalService(process.env.ZIBAL_MERCHANT || 'zibal');
    }
  }
}
