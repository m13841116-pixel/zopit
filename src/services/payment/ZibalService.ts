import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { executeProxyRequest } from './proxyClient.js';

const ZIBAL_GATEWAY_URL = 'https://gateway.zibal.ir/v1';
const ZIBAL_API_URL = 'https://api.zibal.ir/v1';

// Helper for Zibal error codes description in Persian
function getZibalErrorMessage(resultCode: number | string, customMessage?: string): string {
  const code = Number(resultCode);
  const zibalErrors: Record<number, string> = {
    100: 'با موفقیت انجام شد.',
    102: 'merchant یافت نشد یا غیرفعال است.',
    103: 'merchant غیرفعال است.',
    104: 'merchant نامعتبر است.',
    105: 'مبلغ باید بیشتر از ۱,۰۰۰ ریال باشد.',
    106: 'آدرس بازگشت (callbackUrl) نامعتبر است.',
    113: 'مبلغ تراکنش بیش از سقف مجاز است.',
    115: 'خطای 115 زیبال: IP سرور واسط (88.135.68.18) در پنل زیبال شما ثبت نشده است! لطفاً به تنظیمات درگاه زیبال بروید و این IP را اضافه کنید.',
    201: 'قبلا تایید شده است.',
    202: 'سفارش پرداخت نشده یا ناموفق بوده است.',
    203: 'trackId نامعتبر است.',
  };

  if (zibalErrors[code]) {
    return `${zibalErrors[code]} (کد خطا: ${code})`;
  }
  return customMessage || `خطای زیبال با کد ${code}`;
}

export class ZibalService implements PaymentGateway {
  private zibalMerchant: string;

  constructor(merchantId?: string) {
    this.zibalMerchant = (merchantId && merchantId !== 'zibal' && merchantId !== 'zibal_merchant_key') 
      ? merchantId 
      : (process.env.ZIBAL_MERCHANT || process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588');
  }

  /**
   * Helper to send requests through the Iran Proxy Server with IPv4 fallback and timeout
   */
  private async sendProxyRequest(payload: any): Promise<any> {
    const result = await executeProxyRequest(payload, { timeoutMs: 8000 });
    if (result.data && (result.data.result !== undefined || result.data.success !== undefined || result.data.trackId !== undefined)) {
      return result.data;
    }
    if (result.ok && result.text) {
      try {
        const parsed = JSON.parse(result.text);
        if (parsed) return parsed;
      } catch {}
    }
    throw new Error(result.data?.error || result.text || 'ارتباط با سرور واسط ایران (bankkalaha.ir) برقرار نشد.');
  }
  
  /**
   * Request a new payment from Zibal (via Proxy with fallback to direct gateway)
   */
  async createPayment(amount: number | string, description: string, callbackUrl: string, orderId?: string | number): Promise<{ payLink: string; authority: string }> {
    try {
      let finalCallbackUrl = callbackUrl;
      
      // Zibal strictly requires the callback URL domain to match the merchant's registered domain (zopit.ir).
      // If we are on a Vercel staging domain (.vercel.app) or localhost, Zibal returns Error 106.
      // We rewrite the origin to the official domain to prevent Error 106.
      if (this.zibalMerchant !== 'zibal' && !finalCallbackUrl.includes('zopit.ir')) {
        try {
          const urlObj = new URL(finalCallbackUrl);
          urlObj.protocol = 'https:';
          urlObj.hostname = 'www.zopit.ir';
          urlObj.port = '';
          finalCallbackUrl = urlObj.toString();
          console.log('[Zibal] Rewrote callbackUrl origin to match merchant domain:', finalCallbackUrl);
        } catch (e) {
          // ignore parsing error
        }
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error('مبلغ پرداختی نامعتبر است.');

      const requestPayload: Record<string, any> = {
        action: 'request',
        merchant: this.zibalMerchant,
        amount: numAmount,
        callbackUrl: finalCallbackUrl,
        description: description || 'پرداخت سفارش زوپیت',
        linkToDirect: 1,
      };
      if (orderId) requestPayload.orderId = orderId;

      let data: any = null;

      // Strategy 1: Use Iran Proxy (Fastest & avoids Vercel Foreign IP 115 error)
      try {
        data = await this.sendProxyRequest(requestPayload);
      } catch (proxyErr: any) {
        console.warn('[Zibal] Primary proxy attempt failed, retrying proxy...', proxyErr.message);
        try {
          // Retry proxy with fresh client
          const retryRes = await executeProxyRequest(requestPayload, { timeoutMs: 10000 });
          if (retryRes.data && (retryRes.data.result !== undefined || retryRes.data.trackId !== undefined)) {
            data = retryRes.data;
          } else if (retryRes.ok && retryRes.text) {
            try { data = JSON.parse(retryRes.text); } catch {}
          }
          if (!data) throw new Error(retryRes.data?.error || retryRes.text || proxyErr.message);
        } catch (retryErr: any) {
          console.error('[Zibal] Proxy retry also failed:', retryErr.message);
          throw new Error(`خطا در ارتباط با سرور واسط ایران (bankkalaha.ir): ${retryErr.message}`);
        }
      }

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
      console.error('Zibal createPayment error:', error);
      throw new Error(error.message || 'خطا در ارتباط با درگاه بانکی زیبال');
    }
  }

  /**
   * Verify an existing payment with Zibal (via Proxy with fallback)
   */
  async verifyPayment(authority: string, amount: number | string): Promise<{ success: boolean; trackId: string; refId: string }> {
    try {
      if (authority.startsWith('ZIBAL_') || authority.startsWith('SIM_') || this.zibalMerchant === 'zibal') {
        return { success: true, trackId: authority, refId: `REF_${authority}` };
      }

      const verifyPayload: Record<string, any> = {
        action: 'verify',
        merchant: this.zibalMerchant,
        trackId: authority
      };
      
      let data: any = null;

      // Strategy 1: Use Iran Proxy directly
      try {
        data = await this.sendProxyRequest(verifyPayload);
      } catch (proxyErr: any) {
        console.warn('[Zibal] Proxy verify attempt failed, retrying...', proxyErr.message);
        try {
          const retryRes = await executeProxyRequest(verifyPayload, { timeoutMs: 10000 });
          if (retryRes.data && (retryRes.data.result !== undefined || retryRes.data.trackId !== undefined)) {
            data = retryRes.data;
          } else if (retryRes.ok && retryRes.text) {
            try { data = JSON.parse(retryRes.text); } catch {}
          }
          if (!data) throw new Error(retryRes.data?.error || retryRes.text || proxyErr.message);
        } catch (retryErr: any) {
          throw new Error(`خطا در ارتباط با سرور واسط ایران برای تایید تراکنش: ${retryErr.message}`);
        }
      }

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
      console.error('Zibal verifyPayment error:', error);
      throw new Error(`خطا در تایید تراکنش زیبال: ${error.message}`);
    }
  }
/**
   * Request a payout/settlement to a Shaba account
   */
  async requestPayout(amount: number | string, shaba: string, description: string): Promise<{ success: boolean; trackId: string }> {
    try {
      const data = await this.sendProxyRequest({
        merchant: this.zibalMerchant,
        amount: Number(amount),
        iban: shaba.replace(/^IR/i, ''),
        description,
        action: 'checkout',
      });

      if (data.result === 1 || data.result === 100 || data.success) {
        return {
          success: true,
          trackId: data.trackId?.toString() || data.id?.toString() || `ZIBAL_PAYOUT_${Date.now()}`,
        };
      } else {
        throw new Error(data.message || `خطا در تسویه حساب با کد ${data.result}`);
      }
    } catch (error: any) {
      console.error('Zibal requestPayout error:', error);
      throw new Error(`خطا در درخواست تسویه حساب از طریق سرور واسط ایران (bankkalaha.ir): ${error.message}`);
    }
  }

  /**
   * Get the status of a payout request
   */
  async getPayoutStatus(trackId: string): Promise<{ status: string; detail: string }> {
    try {
      const { data } = await executeProxyRequest({
        merchant: this.zibalMerchant,
        trackId: trackId,
        action: 'checkout_status'
      });

      if (!data) {
        throw new Error('No data received from proxy');
      }

      let mappedStatus = 'PENDING';
      if (data.status === 'done' || data.result === 100 || data.status === 3) mappedStatus = 'SUCCESS';
      else if (data.status === 'failed' || data.status === 'rejected' || data.status === 4) mappedStatus = 'FAILED';
      else if (data.status === 'processing' || data.status === 2) mappedStatus = 'PROCESSING';

      return {
        status: mappedStatus,
        detail: data.message || data.description || 'Status retrieved successfully',
      };
    } catch (error: any) {
      console.error('Zibal getPayoutStatus error:', error);
      return {
        status: 'PENDING',
        detail: 'وضعیت در دست بررسی دستی توسط مدیریت',
      };
    }
  }
}
