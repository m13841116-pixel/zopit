import { getPrisma } from '../../prisma.js';
const prisma = getPrisma();
import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { ZibalService } from './ZibalService.js';
import { PaymentLogger } from './PaymentLogger.js';

let cachedMerchantId: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 60s cache to avoid DB roundtrips on every payment click

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

      // Fast-path: Check memory cache first
      const now = Date.now();
      if (cachedMerchantId && now - cacheTimestamp < CACHE_TTL_MS) {
        return new ZibalService(cachedMerchantId);
      }

      // 1. Fetch system config from database with a 1s timeout
      const dbPromise = Promise.all([
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_MERCHANT_CODE' } }),
        prisma.systemConfig.findUnique({ where: { key: 'payment_gateway_settings' } }),
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_ZIBAL_MERCHANT_CODE' } })
      ]);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
      
      const res: any = await Promise.race([dbPromise, timeoutPromise]);

      if (!res) {
        console.warn('[PaymentServiceFactory Warning] Database config query timed out (>1s). Falling back to environment variables.');
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
      if (!merchantId || merchantId.trim() === '' || merchantId === 'zibal_merchant_key') {
        merchantId = '6a0213e61b27742a09938588';
      }

      cachedMerchantId = merchantId;
      cacheTimestamp = now;

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
      
      const fallbackMerchant = forcedMerchantId || process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588';
      
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
