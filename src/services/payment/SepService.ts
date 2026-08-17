import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';
import { executeProxyRequest } from './proxyClient.js';

export class SepService implements PaymentGateway {
  private terminalId: string;
  private proxyUrl: string;

  constructor(terminalId: string) {
    this.terminalId = terminalId;
    this.proxyUrl = process.env.SEP_PROXY_URL || 'https://bankkalaha.ir/sep-proxy.php';
  }

  async createPayment(amount: number | string, description: string, callbackUrl: string, mobile?: string): Promise<{ payLink: string; authority: string; }> {
    const amountRials = Number(amount);
    
    // Payload required for SEP
    const payload = {
      action: 'token',
      actionStr: 'token',
      terminalId: this.terminalId,
      amount: amountRials,
      callbackUrl,
      cellNumber: mobile || '',
      resNum: Math.floor(Math.random() * 1000000000).toString(),
    };

    try {
      const response = await executeProxyRequest(payload, { proxyUrl: this.proxyUrl });
      
      if (!response.ok || !response.data) {
        throw new Error(response.text || 'خطا در دریافت توکن از درگاه سامان');
      }

      // SEP response usually contains status and token
      if (response.data.status === 1 && response.data.token) {
        return {
          payLink: `https://sep.shaparak.ir/OnlinePG/SendToken?token=${response.data.token}`,
          authority: response.data.token
        };
      } else {
        throw new Error(response.data.errorDesc || 'خطای ناشناخته از درگاه سامان');
      }
    } catch (error: any) {
      console.error('SEP createPayment error:', error);
      throw new Error(`خطا در ارتباط با درگاه سامان: ${error.message}`);
    }
  }

  async verifyPayment(authority: string, amount: number | string): Promise<{ success: boolean; trackId: string; refId: string; }> {
    const payload = {
      action: 'verify',
      actionStr: 'verify',
      terminalId: this.terminalId,
      referenceNum: authority
    };

    try {
      const response = await executeProxyRequest(payload, { proxyUrl: this.proxyUrl });
      
      if (!response.ok || !response.data) {
        throw new Error(response.text || 'خطا در تایید تراکنش سامان');
      }

      // Checking SEP Verify Response
      if (response.data.resultCode === 0 || response.data.success || response.data.ResultCode === 0) {
        return {
          success: true,
          trackId: authority,
          refId: String(response.data.transactionDetail?.RRN || response.data.rrn || authority)
        };
      } else {
        return {
          success: false,
          trackId: authority,
          refId: ''
        };
      }
    } catch (error: any) {
      console.error('SEP verifyPayment error:', error);
      return { success: false, trackId: authority, refId: '' };
    }
  }

  async requestPayout(amount: number | string, shaba: string, description: string): Promise<{ success: boolean; trackId: string; error?: string; }> {
    return { success: false, trackId: '', error: 'تسویه حساب مستقیم برای درگاه سامان پیاده‌سازی نشده است.' };
  }

  async getPayoutStatus(trackId: string): Promise<{ status: string; detail: string }> {
    return { status: 'FAILED', detail: 'وضعیت تسویه برای درگاه سامان در دسترس نیست.' };
  }
}
