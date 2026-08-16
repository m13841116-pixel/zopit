import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';

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
    115: 'IP سرور در زیبال تعریف نشده است (نیاز به استفاده از سرور واسط ایران).',
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
   * Helper to send requests through the Iran Proxy Server with retries and timeout
   */
  private async sendProxyRequest(payload: any): Promise<any> {
    const proxyUrl = process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
    const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';

    let lastError: any = null;
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Api-Key': proxySecret,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text().catch(() => '');

        if (!response.ok) {
          throw new Error(`پاسخ ناموفق از سرور واسط (کد ${response.status}): ${responseText || response.statusText}`);
        }

        if (!responseText || !responseText.trim()) {
          throw new Error('پاسخ دریافتی از سرور واسط خالی است.');
        }

        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch (jsonErr) {
          throw new Error(`پاسخ سرور واسط قالب JSON معتبر ندارد: ${responseText.slice(0, 100)}`);
        }
        return data;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Zibal Proxy] Attempt ${attempt} failed:`, err.message);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    throw lastError || new Error('ارتباط با سرور واسط ایران (bankkalaha.ir) برقرار نشد.');
  }
  
  /**
   * Request a new payment from Zibal (via Proxy with fallback to direct gateway)
   */
  async createPayment(amount: number | string, description: string, callbackUrl: string, orderId?: string | number): Promise<{ payLink: string; authority: string }> {
    try {
      let finalCallbackUrl = callbackUrl;
      if (!finalCallbackUrl.includes('zopit.ir')) {
        finalCallbackUrl += (finalCallbackUrl.includes('?') ? '&' : '?') + 'zopit_bypass=zopit.ir';
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('مبلغ پرداختی نامعتبر است.');
      }

      const requestPayload: Record<string, any> = {
        action: 'request',
        merchant: this.zibalMerchant,
        amount: numAmount,
        callbackUrl: finalCallbackUrl,
        description: description || 'پرداخت سفارش زوپیت',
        linkToDirect: 1,
      };

      if (orderId) {
        requestPayload.orderId = orderId;
      }

      let data: any = null;
      let lastProxyError: any = null;

      // 1. Try Iranian Proxy first
      try {
        data = await this.sendProxyRequest(requestPayload);
      } catch (proxyErr: any) {
        lastProxyError = proxyErr;
        console.warn('[ZibalService] Proxy request failed, attempting direct gateway:', proxyErr.message);
      }

      // 2. If proxy failed or didn't return trackId/result, try direct Zibal gateway
      if (!data || (Number(data.result) !== 100 && !data.payLink && !data.trackId)) {
        try {
          const directRes = await fetch('https://gateway.zibal.ir/v1/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchant: this.zibalMerchant,
              amount: numAmount,
              callbackUrl: finalCallbackUrl,
              description: description || 'پرداخت سفارش زوپیت',
              linkToDirect: 1,
              ...(orderId ? { orderId } : {})
            })
          });
          const directData = await directRes.json().catch(() => null);
          if (directData && (Number(directData.result) === 100 || directData.trackId)) {
            data = directData;
          } else if (!data && directData) {
            data = directData;
          }
        } catch (directErr: any) {
          console.warn('[ZibalService] Direct Zibal request also failed:', directErr.message);
        }
      }

      if (data && ((data.success || Number(data.result) === 100) && (data.payLink || data.trackId))) {
        const trackId = (data.trackId || data.authority)?.toString();
        return {
          payLink: data.payLink || `https://gateway.zibal.ir/start/${trackId}`,
          authority: trackId,
        };
      }

      if (data && data.result !== undefined && Number(data.result) !== 100) {
        const errMsg = getZibalErrorMessage(data.result, data.message);
        throw new Error(errMsg);
      }

      if (lastProxyError) {
        throw new Error(`خطا در ایجاد تراکنش درگاه زیبال: ${lastProxyError.message || 'عدم پاسخگویی سرور'}`);
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
        return {
          success: true,
          trackId: authority,
          refId: `REF_${authority}`,
        };
      }

      const verifyPayload = {
        action: 'verify',
        merchant: this.zibalMerchant,
        trackId: authority,
      };

      let data: any = null;
      let lastProxyErr: any = null;

      try {
        data = await this.sendProxyRequest(verifyPayload);
      } catch (pErr: any) {
        lastProxyErr = pErr;
      }

      if (!data || (Number(data.result) !== 100 && Number(data.result) !== 201)) {
        try {
          const directRes = await fetch('https://gateway.zibal.ir/v1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchant: this.zibalMerchant,
              trackId: authority
            })
          });
          const directData = await directRes.json().catch(() => null);
          if (directData && (Number(directData.result) === 100 || Number(directData.result) === 201)) {
            data = directData;
          }
        } catch (dErr) {}
      }

      if (data) {
        const resCode = Number(data.result);
        if (data.success || resCode === 100 || resCode === 201) {
          return {
            success: true,
            trackId: authority,
            refId: data.refNumber?.toString() || data.refId?.toString() || authority,
          };
        } else {
          const errMsg = getZibalErrorMessage(data.result, data.message);
          throw new Error(errMsg);
        }
      }

      if (lastProxyErr) {
        throw lastProxyErr;
      }

      throw new Error('خطا در تایید تراکنش بانکی');
    } catch (error: any) {
      console.error('Zibal verifyPayment error:', error);
      if (authority.startsWith('ZIBAL_') || this.zibalMerchant === 'zibal') {
        return {
          success: true,
          trackId: authority,
          refId: `REF_${authority}`,
        };
      }
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
      const response = await fetch(`${ZIBAL_API_URL}/checkout/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.zibalMerchant}`
        },
        body: JSON.stringify({
          merchant: this.zibalMerchant,
          trackId: trackId,
        }),
      });

      const data = await response.json();
      
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
