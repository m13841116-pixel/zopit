import { getPrisma } from '../../prisma.js';
const prisma = getPrisma();
import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { ZibalService } from './ZibalService.js';
import { SepService } from './SepService.js';

export class PaymentServiceFactory {
  static async getService(forcedMerchantId?: string, forcedGatewayType?: string): Promise<PaymentGateway> {
    try {
      if (forcedGatewayType && forcedGatewayType.toUpperCase() === 'SEP') {
        const terminalId = forcedMerchantId || process.env.SEP_TERMINAL_ID || '11111111';
        return new SepService(terminalId);
      }
      if (forcedMerchantId && forcedMerchantId.trim() !== '') {
        return new ZibalService(forcedMerchantId.trim());
      }

      // 1. Check individual system config saved from the admin page with a fast 2s timeout
      const dbPromise = Promise.all([
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_TYPE' } }),
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_MERCHANT_CODE' } }),
        prisma.systemConfig.findUnique({ where: { key: 'payment_gateway_settings' } }),
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_ZIBAL_MERCHANT_CODE' } }),
        prisma.systemConfig.findUnique({ where: { key: 'PAYMENT_GATEWAY_SEP_TERMINAL_ID' } })
      ]);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      
      const res: any = await Promise.race([dbPromise, timeoutPromise]);

      const gatewayTypeSetting = res ? res[0] : null;
      const merchantCodeSetting = res ? res[1] : null;
      const configRecord = res ? res[2] : null;
      const zibalMerchantSetting = res ? res[3] : null;
      const sepTerminalSetting = res ? res[4] : null;

      let config: any = {};
      if (configRecord && configRecord.value) {
        try {
          config = JSON.parse(configRecord.value);
        } catch (e) {
          console.error('Error parsing payment_gateway_settings JSON');
        }
      }
      
      const gatewayType = (gatewayTypeSetting?.value || config.gatewayType || process.env.PAYMENT_GATEWAY_TYPE || 'ZIBAL').toUpperCase();

      if (gatewayType === 'SEP') {
        let terminalId = sepTerminalSetting?.value;
        if (!terminalId || terminalId.trim() === '') {
          terminalId = merchantCodeSetting?.value || config.sepTerminal || process.env.SEP_TERMINAL_ID || '11111111';
        }
        console.log('[PaymentServiceFactory] Using SEP (Saman) Payment Gateway with terminalId:', terminalId);
        return new SepService(terminalId);
      }

      // Determine merchant ID from database or environment
      let merchantId = zibalMerchantSetting?.value;
      if (!merchantId || merchantId.trim() === '') {
        merchantId = merchantCodeSetting?.value;
      }
      
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = config.zibalMerchant;
      }
      if (!merchantId || merchantId === 'zibal_merchant_key') {
        merchantId = process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT;
      }

      if (!merchantId || merchantId.trim() === '') {
        merchantId = 'zibal';
      }

      console.log('[PaymentServiceFactory] Using Real Zibal Payment Gateway with merchantId:', merchantId);
      return new ZibalService(merchantId);

    } catch (err: any) {
      console.error('[PaymentServiceFactory Error]', err.message);
      const fallbackMerchant = forcedMerchantId || process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT || 'zibal';
      return new ZibalService(fallbackMerchant);
    }
  }
}
