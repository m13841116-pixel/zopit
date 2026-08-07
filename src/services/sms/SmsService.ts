import fetch from 'node-fetch';

export interface SmsOptions {
  to: string;
  text: string;
  orderId?: number;
}

export async function sendSmsViaMelliPayamak(
  mobile: string,
  message: string,
  orderId?: number
): Promise<{ success: boolean; message?: string; rawResponse?: any }> {
  try {
    const username = process.env.MELLIPAYAMAK_USERNAME || process.env.SMS_PANEL_USERNAME;
    const password = process.env.MELLIPAYAMAK_PASSWORD || process.env.SMS_PANEL_PASSWORD || process.env.SMS_PANEL_API_KEY;
    const fromNumber = process.env.MELLIPAYAMAK_FROM_NUMBER || "50001";
    const patternId = process.env.MELLIPAYAMAK_PATTERN_ID;

    // Sanitize mobile
    let cleanMobile = mobile ? mobile.trim().replace(/\s+/g, '') : '';
    if (cleanMobile.startsWith('+98')) {
      cleanMobile = '0' + cleanMobile.slice(3);
    } else if (cleanMobile.startsWith('98')) {
      cleanMobile = '0' + cleanMobile.slice(2);
    }

    if (!cleanMobile || cleanMobile.length < 10) {
      console.warn('[SMS Service] Invalid mobile number:', mobile);
      return { success: false, message: 'شماره موبایل گیرنده نامعتبر است.' };
    }

    if (!username || !password) {
      console.warn('[SMS Service] MelliPayamak credentials missing. Set MELLIPAYAMAK_USERNAME & MELLIPAYAMAK_PASSWORD in .env or settings.');
      // Print simulation log
      console.log(`[SMS SIMULATION to ${cleanMobile}]: ${message}`);
      return { success: true, message: 'پیامک در حالت شبیه‌سازی ثبت شد (اطلاعات ملی پیامک تنظیم نشده است).' };
    }

    console.log(`[SMS Service] Sending MelliPayamak SMS to ${cleanMobile} for Order #${orderId || ''}...`);

    let endpoint = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';
    let body: any = {
      username,
      password,
      to: cleanMobile,
      from: fromNumber,
      text: message
    };

    // If pattern/bodyId is specified and orderId exists, use BaseServiceNumber
    if (patternId && orderId) {
      endpoint = 'https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber';
      body = {
        username,
        password,
        text: [String(orderId)],
        to: cleanMobile,
        bodyId: parseInt(patternId, 10)
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data: any = await response.json().catch(() => ({}));
    console.log('[SMS Service] MelliPayamak Response:', data);

    if (response.ok && (data.Value || data.RetStatus === 0 || typeof data.Value === 'number' || typeof data === 'string')) {
      return { success: true, rawResponse: data };
    } else {
      console.error('[SMS Service] Failed to send SMS via MelliPayamak:', data);
      return { success: false, message: data.StrRetStatus || data.StrStatus || 'خطا در ارسال پیامک از طریق ملی پیامک', rawResponse: data };
    }
  } catch (err: any) {
    console.error('[SMS Service] Error invoking MelliPayamak API:', err?.message || err);
    return { success: false, message: err?.message || 'خطای شبکه در ارسال پیامک' };
  }
}

export async function notifySupplierNewOrder(supplierMobile: string, orderId: number, supplierName?: string) {
  const text = `تامین‌کننده محترم زوپیت، سفارش جدید شماره #${orderId} ثبت گردیده و نیازمند بررسی و تایید شما در پنل است. لطفاً جهت جلوگیری از معطلی فروشگاه، اقدام فرمایید. zopit.ir`;
  return await sendSmsViaMelliPayamak(supplierMobile, text, orderId);
}
