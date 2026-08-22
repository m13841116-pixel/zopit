import { getPrisma } from '../../prisma.js';
const prisma = getPrisma();
import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { ZibalService } from './ZibalService.js';
import { PaymentLogger } from './PaymentLogger.js';

export class PaymentServiceFactory {
  static async getService(forcedMerchantId?: string, forcedGatewayType?: string): Promise<PaymentGateway> {
    try {
      // NOTE: SEP has been completely disabled. We exclusively use Zibal across the system.
      if (forcedMerchantId && forcedMerchantId.trim() !== '') {
        const selectedMerchant = forcedMerchantId.trim();
        await PaymentLogger.logPaymentEvent({
          requestId: PaymentLogger.generateRequestId(),
          gateway: 'ZIBAL',
          action: 'GATEWAY_SELECTION',
          status: 'SUCCESS',
          requestBody: JSON.stringify({ type: 'forced_merchant', merchantId: selectedMerchant }),
        });
        return new ZibalService(selectedMerchant);
      }

      // 1. Fetch system config from database with a 5s timeout
      const dbPromise = Promise.all([
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_MERCHANT_CODE' } }),
        prisma.systemConfig.findUnique({ where: { key: 'payment_gateway_settings' } }),
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_ZIBAL_MERCHANT_CODE' } })
      ]);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
      
      const res: any = await Promise.race([dbPromise, timeoutPromise]);

      if (!res) {
        console.warn('[PaymentServiceFactory Warning] Database config query timed out (>5s). Falling back to environment variables.');
      }

      const merchantCodeSetting = res ? res[0] : null;
      const configRecord = res ? res[1] : null;
      const zibalMerchantSetting = res ? res[2] : null;

      let config: any = {};
      if (configRecord && configRecord.value) {
        try {
          config = JSON.parse(configRecord.value);
        } catch (e) {
          console.error('Error parsing payment_gateway_settings JSON');
        }
      }

      // Determine Zibal merchant ID
      let merchantId = zibalMerchantSetting?.value;
      if (!merchantId || merchantId.trim() === '') {
        merchantId = merchantCodeSetting?.value;
      }
      
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = config.zibalMerchant;
      }
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = process.env.ZIBAL_MERCHANT_ID;
      }

      if (process.env.NODE_ENV === 'production') {
        if (!merchantId || merchantId.trim() === '' || merchantId === 'zibal' || merchantId === 'zibal_merchant_key') {
          throw new Error('ZIBAL_MERCHANT_ID is not configured');
        }
      } else {
        if (!merchantId || merchantId.trim() === '') {
          merchantId = 'zibal';
        }
      }

      await PaymentLogger.logPaymentEvent({
        requestId: PaymentLogger.generateRequestId(),
        gateway: 'ZIBAL',
        action: 'GATEWAY_SELECTION',
        status: 'SUCCESS',
        requestBody: JSON.stringify({ type: 'dynamic', merchantId }),
      });

      console.log('[PaymentServiceFactory] Enforcing Zibal Payment Gateway');
      return new ZibalService(merchantId);

    } catch (err: any) {
      console.error('[PaymentServiceFactory Error]', err.message);
      
      let fallbackMerchant = forcedMerchantId || process.env.ZIBAL_MERCHANT_ID;
      if (process.env.NODE_ENV === 'production') {
        if (!fallbackMerchant || fallbackMerchant.trim() === '' || fallbackMerchant === 'zibal' || fallbackMerchant === 'zibal_merchant_key') {
          throw new Error('ZIBAL_MERCHANT_ID is not configured');
        }
      } else {
        if (!fallbackMerchant || fallbackMerchant.trim() === '') {
          fallbackMerchant = 'zibal';
        }
      }
      
      await PaymentLogger.logPaymentEvent({
        requestId: PaymentLogger.generateRequestId(),
        gateway: 'ZIBAL',
        action: 'GATEWAY_SELECTION',
        status: 'FAILED',
        errorMessage: err.message,
        requestBody: JSON.stringify({ type: 'fallback', merchantId: fallbackMerchant }),
      });

      return new ZibalService(fallbackMerchant);
    }
  }
}
