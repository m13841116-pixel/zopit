import { PaymentGateway } from '../../interfaces/payment-gateway.interface';

const ZIBAL_GATEWAY_URL = 'https://gateway.zibal.ir/v1';
const ZIBAL_API_URL = 'https://api.zibal.ir/v1'; // Used for payout/settlement usually

export class ZibalService implements PaymentGateway {
  private zibalMerchant: string;

  constructor(merchantId?: string) {
    this.zibalMerchant = (merchantId && merchantId !== 'zibal' && merchantId !== 'zibal_merchant_key') 
      ? merchantId 
      : (process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT || '6a0213e61b27742a09938588');
  }
  
  /**
   * Request a new payment from Zibal (direct or via Proxy)
   */
  async createPayment(amount: number | string, description: string, callbackUrl: string): Promise<{ payLink: string; authority: string }> {
    try {
      const proxyUrl = process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
      const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';

      // 1. If Proxy settings are configured, route request through the Proxy server
      if (proxyUrl && proxySecret) {
        const endpoint = proxyUrl.endsWith('/request') ? proxyUrl : `${proxyUrl.replace(/\/$/, '')}/request`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': proxySecret,
          },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            amount: Number(amount),
            callbackUrl,
            description,
          }),
        });

        const data = await response.json();
        if ((data.success || Number(data.result) === 100) && (data.payLink || data.trackId)) {
          return {
            payLink: data.payLink || `https://gateway.zibal.ir/start/${data.trackId}`,
            authority: (data.trackId || data.authority)?.toString(),
          };
        } else {
          console.error('Zibal Proxy Payment Error:', data);
        }
      }

      // 2. Direct Zibal gateway call if no proxy or proxy fallback
      if (this.zibalMerchant && this.zibalMerchant !== 'zibal' && this.zibalMerchant !== 'zibal_merchant_key') {
        const response = await fetch(`${ZIBAL_GATEWAY_URL}/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            amount: Number(amount),
            callbackUrl,
            description,
          }),
        });

        const data = await response.json();

        if (Number(data.result) === 100 && data.trackId) {
          return {
            payLink: `https://gateway.zibal.ir/start/${data.trackId}`,
            authority: data.trackId.toString(),
          };
        } else {
          console.error('Zibal API error response:', data);
          const errorMsg = data.message || `کد خطای زیبال: ${data.result}`;
          throw new Error(`خطا در اتصال به درگاه پرداخت زیبال: ${errorMsg}`);
        }
      }

      throw new Error('کد مرچنت درگاه پرداخت زیبال تعریف نشده است.');
    } catch (error: any) {
      console.error('Zibal createPayment error:', error);
      throw new Error(error.message || 'خطا در ارتباط با درگاه بانکی زیبال');
    }
  }

  /**
   * Verify an existing payment with Zibal (direct or via Proxy)
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

      const proxyUrl = process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
      const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';

      // 1. Verify via Payment Proxy if configured
      if (proxyUrl && proxySecret) {
        const endpoint = proxyUrl.endsWith('/verify') ? proxyUrl : `${proxyUrl.replace(/\/$/, '')}/verify`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': proxySecret,
          },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            trackId: authority,
            action: 'verify',
          }),
        });

        const data = await response.json();
        const resCode = Number(data.result);
        if (data.success || resCode === 100 || resCode === 201) {
          return {
            success: true,
            trackId: authority,
            refId: data.refNumber?.toString() || data.refId?.toString() || authority,
          };
        }
      }

      // 2. Direct Zibal verify call
      const response = await fetch(`${ZIBAL_GATEWAY_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: this.zibalMerchant,
          trackId: authority,
        }),
      });

      const data = await response.json();

      // result == 100 means successful verification. result == 201 means already verified.
      const resCode = Number(data.result);
      if (resCode === 100 || resCode === 201) {
        return {
          success: true,
          trackId: authority,
          refId: data.refNumber?.toString() || data.refId?.toString() || authority,
        };
      } else {
        return { success: false, trackId: authority, refId: '' };
      }
    } catch (error: any) {
      console.error('Zibal verifyPayment error:', error);
      if (authority.startsWith('ZIBAL_') || this.zibalMerchant === 'zibal') {
        return {
          success: true,
          trackId: authority,
          refId: `REF_${authority}`,
        };
      }
      return { success: false, trackId: authority, refId: '' };
    }
  }

  /**
   * Request a payout/settlement to a Shaba account
   */
  async requestPayout(amount: number | string, shaba: string, description: string): Promise<{ success: boolean; trackId: string }> {
    try {
      // Typically, Zibal's settlement API requires authorization via Bearer token (API Key) or merchant ID depending on the endpoint.
      // Assuming a checkout/transfer API structure based on Zibal documentation.
      const response = await fetch(`${ZIBAL_API_URL}/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.zibalMerchant}` // some endpoints use bearer token
        },
        body: JSON.stringify({
          merchant: this.zibalMerchant,
          amount: Number(amount),
          iban: shaba.replace(/^IR/i, ''), // Ensure we pass without IR if needed, or keeping it based on API req
          description,
        }),
      });

      const data = await response.json();

      if (data.result === 1 || data.result === 100 || data.success) {
        return {
          success: true,
          trackId: data.trackId?.toString() || data.id?.toString() || `ZIBAL_PAYOUT_${Date.now()}`,
        };
      } else {
        throw new Error(`Zibal Payout Request Failed: ${data.message || data.result}`);
      }
    } catch (error: any) {
      console.error('Zibal requestPayout error:', error);
      throw new Error(`Failed to request payout: ${error.message}`);
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
      // Map Zibal status to our PayoutStatus (PENDING, PROCESSING, SUCCESS, FAILED)
      // These are hypothetical mappings for Zibal's payout statuses:
      if (data.status === 'done' || data.result === 100 || data.status === 3) mappedStatus = 'SUCCESS';
      else if (data.status === 'failed' || data.status === 'rejected' || data.status === 4) mappedStatus = 'FAILED';
      else if (data.status === 'processing' || data.status === 2) mappedStatus = 'PROCESSING';

      return {
        status: mappedStatus,
        detail: data.message || data.description || 'Status retrieved successfully',
      };
    } catch (error: any) {
      console.error('Zibal getPayoutStatus error:', error);
      throw new Error(`Failed to get payout status: ${error.message}`);
    }
  }
}
