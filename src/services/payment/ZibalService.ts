import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { executeProxyRequest } from './proxyClient.js';
import { getPrisma } from '../../prisma.js';
import { z } from 'zod';
import { PaymentLogger } from './PaymentLogger.js';
import { getCanonicalAppUrl } from '../../utils/canonicalUrl.js';

function getZibalErrorMessage(code: number | string, customMessage?: string): string {
  const zibalErrors: Record<number | string, string> = {
    100: 'با موفقیت تایید شد.',
    102: 'مرچنت یافت نشد (کد مرچنت زیبال نامعتبر است).',
    103: 'مرچنت غیرفعال است.',
    104: 'مرچنت نامعتبر است.',
    113: 'مبلغ تراکنش نامعتبر است (باید بیشتر از 1000 ریال باشد).',
    201: 'قبلاً تایید شده است.',
    105: 'مبلغ باید صحیح باشد.',
    106: 'آدرس بازگشت (Callback URL) با دامنه ثبت شده در زیبال تطابق ندارد.',
    114: 'مبلغ پرداختی با مبلغ فاکتور تطابق ندارد.',
    202: 'سفارش پرداخت نشده یا ناموفق بوده است.',
    203: 'trackId نامعتبر است.',
  };
  if (zibalErrors[code]) {
    return `${zibalErrors[code]} (کد خطا: ${code})`;
  }
  return customMessage || `خطای زیبال با کد ${code}`;
}

const ZibalRequestResponseSchema = z.object({
  result: z.union([z.number(), z.string()]).optional(),
  success: z.boolean().optional(),
  message: z.string().optional(),
  trackId: z.union([z.number(), z.string()]).optional(),
  authority: z.union([z.number(), z.string()]).optional(),
  payLink: z.string().optional(),
  id: z.union([z.number(), z.string()]).optional(),
}).passthrough();

const ZibalVerifyResponseSchema = z.object({
  result: z.union([z.number(), z.string()]).optional(),
  success: z.boolean().optional(),
  message: z.string().optional(),
  refNumber: z.union([z.number(), z.string()]).optional(),
  refId: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export class ZibalService implements PaymentGateway {
  private zibalMerchant: string;

  constructor(merchantId?: string) {
    const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
    const merchant = merchantId || process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588';
    this.zibalMerchant = merchant.trim();
    if (!this.zibalMerchant) {
      this.zibalMerchant = '6a0213e61b27742a09938588';
    }
  }

  private async sendZibalRequest(action: string, payload: any, schema?: z.ZodTypeAny, orderId?: string, userId?: number): Promise<any> {
    let responseData: any = null;
    const reqId = PaymentLogger.generateRequestId();

    let actionName = 'CREATE_PAYMENT';
    if (action === 'verify') {
      actionName = 'VERIFY_PAYMENT';
    } else if (action === 'checkout') {
      actionName = 'PAYOUT';
    } else if (action === 'checkout_status') {
      actionName = 'PAYOUT_STATUS';
    }

    try {
      const result = await executeProxyRequest(
        { ...payload, action }, 
        { 
          timeoutMs: parseInt(process.env.PAYMENT_PROXY_TIMEOUT_MS || '5000', 10), 
          requestId: reqId,
          gateway: 'ZIBAL',
          action: actionName,
          orderId,
          userId
        }
      );
      if (result.ok && result.data) {
        responseData = result.data;
      } else if (result.text) {
        try { responseData = JSON.parse(result.text); } catch {}
      }
    } catch (err: any) {
      throw err;
    }

    if (!responseData) {
      throw new Error('عدم دریافت پاسخ معتبر از درگاه پرداخت زیبال.');
    }

    if (schema) {
      const parsed = schema.safeParse(responseData);
      if (!parsed.success) {
        console.error('[Zibal - Validation Error] Invalid response structure from gateway');
        
        await PaymentLogger.logPaymentEvent({
          requestId: reqId,
          gateway: 'ZIBAL',
          action: actionName,
          status: 'VALIDATION_ERROR',
          errorMessage: 'Invalid schema response from gateway',
          responseBody: JSON.stringify(responseData),
          orderId,
          userId
        });

        throw new Error('ساختار پاسخ دریافتی از درگاه نامعتبر است.');
      }
      return parsed.data;
    }

    return responseData;
  }
  
  async createPayment(amount: number | string, description: string, callbackUrl: string, orderId?: string | number): Promise<{ payLink: string; authority: string }> {
    try {
      let finalCallbackUrl = callbackUrl || '';

      // Ensure callback URL is constructed properly with canonical base URL and HTTPS
      const canonicalBase = getCanonicalAppUrl();
      try {
        if (!finalCallbackUrl || finalCallbackUrl.trim() === '') {
          finalCallbackUrl = `${canonicalBase}/api/payment/callback${orderId ? `?orderId=${orderId}` : ''}`;
        } else if (finalCallbackUrl.startsWith('/')) {
          finalCallbackUrl = `${canonicalBase}${finalCallbackUrl}`;
        } else {
          const urlObj = new URL(finalCallbackUrl);
          if (process.env.NODE_ENV === 'production' || process.env.APP_BASE_URL) {
            finalCallbackUrl = `${canonicalBase}${urlObj.pathname}${urlObj.search}`;
          }
        }
      } catch (e) {
        finalCallbackUrl = `${canonicalBase}/api/payment/callback${orderId ? `?orderId=${orderId}` : ''}`;
      }

      let numAmount = Math.round(Number(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('مبلغ پرداختی نامعتبر است. مبلغ باید یک عدد صحیح مثبت باشد.');
      }

      const strOrderId = orderId ? String(orderId) : undefined;
      let userId: number | undefined = undefined;

      if (orderId && !isNaN(Number(orderId))) {
        try {
          const prisma = getPrisma();
          const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
          if (order) {
            userId = order.customerId;
            
            // Amount check in DB (Rials)
            const expectedAmount = Math.round(order.totalAmount * 10);
            if (numAmount === expectedAmount && (order.status === 'PENDING' || order.status === 'SUCCESS' || order.status === 'PAID') && order.trackingCode) {
              const maskedTrackId = PaymentLogger.maskSensitiveData(order.trackingCode);
              console.log(`[Zibal Idempotency] Order #${orderId} already has payment trackingCode: ${maskedTrackId}`);
              return {
                payLink: `https://gateway.zibal.ir/start/${order.trackingCode}`,
                authority: String(order.trackingCode)
              };
            }
          }
        } catch (dbErr) {
          // Non-blocking
        }
      }

      const resolvedMerchant = this.zibalMerchant || process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588';
      const requestPayload: Record<string, any> = {
        merchant: resolvedMerchant,
        amount: numAmount,
        callbackUrl: finalCallbackUrl,
        description: description || 'پرداخت سفارش',
        linkToDirect: 0,
      };
      if (orderId) requestPayload.orderId = orderId;

      const data = await this.sendZibalRequest('request', requestPayload, ZibalRequestResponseSchema, strOrderId, userId);

      if (data && ((data.success || Number(data.result) === 100) && (data.payLink || data.trackId || data.authority))) {
        const trackId = (data.trackId || data.authority)?.toString();
        return {
          payLink: data.payLink || `https://gateway.zibal.ir/start/${trackId}`,
          authority: trackId,
        };
      }

      if (data && data.result !== undefined && Number(data.result) !== 100) {
        throw new Error(getZibalErrorMessage(data.result, data.message));
      }

      throw new Error('عدم دریافت پاسخ معتبر از درگاه پرداخت.');
    } catch (error: any) {
      console.error(`[Zibal createPayment Error] Order #${orderId || 'N/A'}: ${error.message}`);
      throw new Error(error.message || 'خطا در ارتباط با درگاه بانکی');
    }
  }

  async verifyPayment(authority: string, amount: number | string): Promise<{ success: boolean; trackId: string; refId: string }> {
    try {
      const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
      if (authority.startsWith('ZIBAL_') || authority.startsWith('SIM_')) {
        if (isProduction) throw new Error('Simulation payments are disabled in production');
        return { success: true, trackId: authority, refId: `REF_${authority}` };
      }

      const resolvedMerchant = this.zibalMerchant || process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588';
      const verifyPayload: Record<string, any> = {
        trackId: authority,
        merchant: resolvedMerchant
      };
      
      const data = await this.sendZibalRequest('verify', verifyPayload, ZibalVerifyResponseSchema);

      if (data) {
        const resCode = Number(data.result);
        if (data.success || resCode === 100 || resCode === 201) {
          if (amount && data.amount && Number(data.amount) !== Number(amount)) {
             throw new Error('مبلغ پرداختی با مبلغ فاکتور تطابق ندارد.');
          }
          return { success: true, trackId: authority, refId: data.refNumber?.toString() || data.refId?.toString() || authority };
        } else {
          throw new Error(getZibalErrorMessage(data.result, data.message));
        }
      }
      throw new Error('خطا در تایید تراکنش بانکی');
    } catch (error: any) {
      console.error(`[Zibal verifyPayment Error]: ${error.message}`);
      throw new Error(`خطا در تایید تراکنش بانکی: ${error.message}`);
    }
  }

  async requestPayout(amount: number | string, shaba: string, description: string): Promise<{ success: boolean; trackId: string }> {
    try {
      const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
      const payoutPayload: Record<string, any> = {
        amount: Number(amount),
        iban: shaba.replace(/^IR/i, ''),
        description,
        merchant: this.zibalMerchant || (isProduction ? null : 'zibal')
      };

      const data = await this.sendZibalRequest('checkout', payoutPayload, ZibalRequestResponseSchema);

      if (data.result === 1 || data.result === 100 || data.success) {
        return {
          success: true,
          trackId: data.trackId?.toString() || data.id?.toString() || `ZIBAL_PAYOUT_${Date.now()}`,
        };
      } else {
        throw new Error(data.message || `خطا در تسویه حساب با کد ${data.result}`);
      }
    } catch (error: any) {
      console.error('[Zibal requestPayout Error]', error.message);
      throw new Error(`خطا در درخواست تسویه حساب: ${error.message}`);
    }
  }

  async getPayoutStatus(trackId: string): Promise<{ status: string; detail: string }> {
    try {
      const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
      const statusPayload: Record<string, any> = {
        trackId: trackId,
        merchant: this.zibalMerchant || (isProduction ? null : 'zibal')
      };

      const data = await this.sendZibalRequest('checkout_status', statusPayload);

      let mappedStatus = 'PENDING';
      if (data.status === 'done' || data.result === 100 || data.status === 3) mappedStatus = 'SUCCESS';
      else if (data.status === 'failed' || data.status === 'rejected' || data.status === 4) mappedStatus = 'FAILED';
      else if (data.status === 'processing' || data.status === 2) mappedStatus = 'PROCESSING';

      return {
        status: mappedStatus,
        detail: data.message || data.description || 'Status retrieved successfully',
      };
    } catch (error: any) {
      console.error('[Zibal getPayoutStatus Error]', error.message);
      return {
        status: 'PENDING',
        detail: 'وضعیت در دست بررسی دستی توسط مدیریت',
      };
    }
  }
}

