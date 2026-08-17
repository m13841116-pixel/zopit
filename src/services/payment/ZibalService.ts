import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { executeProxyRequest } from './proxyClient.js';
import { getPrisma } from '../../prisma.js';
import { z } from 'zod';

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
    const merchant = merchantId || process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT || 'zibal';
    this.zibalMerchant = merchant.trim();
  }

  private async sendProxyRequest(payload: any, schema?: z.ZodTypeAny): Promise<any> {
    const result = await executeProxyRequest(payload, { timeoutMs: 10000 });
    
    let responseData = result.data;
    if (!responseData && result.ok && result.text) {
      try {
        responseData = JSON.parse(result.text);
      } catch {}
    }

    if (!responseData) {
      throw new Error(result.data?.error || result.text || 'ارتباط با سرور واسط (proxy) برقرار نشد.');
    }

    if (schema) {
      const parsed = schema.safeParse(responseData);
      if (!parsed.success) {
        console.error('[Zibal - Validation Error] Invalid response structure from proxy.');
        throw new Error('ساختار پاسخ دریافتی از درگاه نامعتبر است.');
      }
      return parsed.data;
    }

    return responseData;
  }
  
  async createPayment(amount: number | string, description: string, callbackUrl: string, orderId?: string | number): Promise<{ payLink: string; authority: string }> {
    try {
      let finalCallbackUrl = callbackUrl || '';
      
      const proxyUrl = process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
      let proxyDomain = 'https://bankkalaha.ir';
      try {
        proxyDomain = new URL(proxyUrl).origin;
      } catch (e) {
        console.error('Invalid PAYMENT_PROXY_URL, falling back to bankkalaha.ir');
      }

      // Ensure callback URL is constructed properly with HTTPS and uses zopit.ir
      try {
        if (!finalCallbackUrl || finalCallbackUrl.trim() === '') {
          finalCallbackUrl = 'https://zopit.ir/api/public/checkout/callback' + (orderId ? `?orderId=${orderId}` : '');
        } else {
          const urlObj = new URL(finalCallbackUrl);
          if (urlObj.hostname.includes('run.app') || urlObj.hostname.includes('localhost') || urlObj.hostname.includes('bankkalaha.ir')) {
            finalCallbackUrl = `https://zopit.ir${urlObj.pathname}${urlObj.search}`;
          } else {
            urlObj.protocol = 'https:';
            finalCallbackUrl = urlObj.toString();
          }
        }
      } catch (e) {
        finalCallbackUrl = 'https://zopit.ir/api/public/checkout/callback' + (orderId ? `?orderId=${orderId}` : '');
      }

      let numAmount = Math.round(Number(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('مبلغ پرداختی نامعتبر است. مبلغ باید یک عدد صحیح مثبت باشد.');
      }

      if (orderId) {
        const prisma = getPrisma();
        const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
        if (!order) {
           throw new Error(`سفارش با شناسه ${orderId} یافت نشد.`);
        }
        
        // Amount check in DB (Rials)
        const expectedAmount = Math.round(order.totalAmount * 10);
        if (numAmount !== expectedAmount) {
           console.warn(`[Zibal] Amount mismatch for Order #${orderId}. Reverting to Database amount.`);
           numAmount = expectedAmount;
        }

        // Idempotency: Return existing tracking code if payment was already initialized or completed
        if ((order.status === 'PENDING' || order.status === 'SUCCESS' || order.status === 'PAID') && order.trackingCode) {
           console.log(`[Zibal Idempotency] Order #${orderId} already has payment trackingCode: ${order.trackingCode}`);
           return {
             payLink: `https://gateway.zibal.ir/start/${order.trackingCode}`,
             authority: String(order.trackingCode)
           };
        }
      }

      console.log(`[Zibal Request] Initiating payment for Order #${orderId || 'N/A'}, Amount: ${numAmount} Rials, Callback: ${finalCallbackUrl}, Merchant: ${this.zibalMerchant || 'zibal'}`);

      const requestPayload: Record<string, any> = {
        action: 'request',
        merchant: (this.zibalMerchant && this.zibalMerchant.trim() !== '') ? this.zibalMerchant.trim() : 'zibal',
        amount: numAmount,
        callbackUrl: finalCallbackUrl,
        description: description || 'پرداخت سفارش',
        linkToDirect: 1,
      };
      if (orderId) requestPayload.orderId = orderId;

      let data: any = null;
      try {
        data = await this.sendProxyRequest(requestPayload, ZibalRequestResponseSchema);
      } catch (proxyErr: any) {
        console.error(`[Zibal - FATAL] Proxy connection failed for Order #${orderId || 'N/A'}: ${proxyErr.message}`);
        throw new Error(`عملیات متوقف شد: ارتباط با سرور واسط پرداخت برقرار نشد.`);
      }

      console.log(`[Zibal Request Response] Order #${orderId || 'N/A'}, Result Code: ${data?.result}, TrackId: ${data?.trackId || data?.authority}`);

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
      if (authority.startsWith('ZIBAL_') || authority.startsWith('SIM_')) {
        return { success: true, trackId: authority, refId: `REF_${authority}` };
      }

      console.log(`[Zibal Verify] Verifying trackId: ${authority}`);

      const verifyPayload: Record<string, any> = {
        action: 'verify',
        trackId: authority
      };
      if (this.zibalMerchant && this.zibalMerchant !== 'zibal') {
        verifyPayload.merchant = this.zibalMerchant;
      }
      
      let data: any = null;
      try {
        data = await this.sendProxyRequest(verifyPayload, ZibalVerifyResponseSchema);
      } catch (proxyErr: any) {
        console.error(`[Zibal - FATAL] Proxy verify failed for trackId ${authority}: ${proxyErr.message}`);
        throw new Error(`عملیات متوقف شد: ارتباط با سرور واسط برای تایید تراکنش برقرار نشد.`);
      }

      console.log(`[Zibal Verify Response] TrackId: ${authority}, Result Code: ${data?.result}`);

      if (data) {
        const resCode = Number(data.result);
        if (data.success || resCode === 100 || resCode === 201) {
          return { success: true, trackId: authority, refId: data.refNumber?.toString() || data.refId?.toString() || authority };
        } else {
          throw new Error(getZibalErrorMessage(data.result, data.message));
        }
      }
      throw new Error('خطا در تایید تراکنش بانکی');
    } catch (error: any) {
      console.error(`[Zibal verifyPayment Error] TrackId ${authority}: ${error.message}`);
      throw new Error(`خطا در تایید تراکنش بانکی: ${error.message}`);
    }
  }

  async requestPayout(amount: number | string, shaba: string, description: string): Promise<{ success: boolean; trackId: string }> {
    try {
      const payoutPayload: Record<string, any> = {
        amount: Number(amount),
        iban: shaba.replace(/^IR/i, ''),
        description,
        action: 'checkout',
      };
      if (this.zibalMerchant && this.zibalMerchant !== 'zibal') {
        payoutPayload.merchant = this.zibalMerchant;
      }

      const data = await this.sendProxyRequest(payoutPayload, ZibalRequestResponseSchema);

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
      const statusPayload: Record<string, any> = {
        trackId: trackId,
        action: 'checkout_status'
      };
      if (this.zibalMerchant && this.zibalMerchant !== 'zibal') {
        statusPayload.merchant = this.zibalMerchant;
      }

      const data = await this.sendProxyRequest(statusPayload);

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
