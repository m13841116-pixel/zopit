import { getPrisma } from '../../prisma.js';

/**
 * Standardizes mobile numbers to local Iranian format starting with 09...
 */
function sanitizeMobileNumber(mobile: string): string {
  let cleanMobile = mobile ? String(mobile).trim().replace(/\s+/g, '') : '';
  if (cleanMobile.startsWith('+98')) {
    cleanMobile = '0' + cleanMobile.slice(3);
  } else if (cleanMobile.startsWith('98') && cleanMobile.length === 12) {
    cleanMobile = '0' + cleanMobile.slice(2);
  }
  return cleanMobile;
}

/**
 * Core function to send an SMS pattern/template via the bankkalaha.ir proxy.
 */
export async function sendPattern(mobile: string, patternKey: string, textValues: string[]) {
  try {
    const prisma = getPrisma();
    
    // Read MelliPayamak configuration dynamically from Database
    const [dbUser, dbPass, dbFrom, dbPattern, dbGeneralPattern] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_USERNAME' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PASSWORD' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_FROM_NUMBER' } }),
      prisma.systemConfig.findUnique({ where: { key: patternKey } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_ID' } })
    ]);

    const username = dbUser?.value?.trim() || '';
    const password = dbPass?.value?.trim() || ''; // Token
    const fromNumber = dbFrom?.value?.trim() || '50001'; // Sender line

    if (!username || !password) {
      console.error('[SMS Service] MelliPayamak credentials (username/password/token) are missing from Database.');
      return { 
        success: false, 
        error: 'تنظیمات نام کاربری و کلمه عبور ملی‌پیامک در پایگاه‌داده یافت نشد.' 
      };
    }

    // Extract body ID value
    const rawBodyId = dbPattern?.value?.trim() || dbGeneralPattern?.value?.trim() || '';
    let bodyId: string | number = rawBodyId;

    // Map default pattern IDs if nothing is configured in DB
    if (!bodyId) {
      if (patternKey === 'MELLIPAYAMAK_PATTERN_OTP') {
        bodyId = 223344; // standard fallback OTP pattern
      } else if (patternKey === 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT') {
        bodyId = 112233; // standard fallback supplier notification pattern
      } else if (patternKey === 'MELLIPAYAMAK_PATTERN_LABEL_ISSUED') {
        bodyId = 445566; // standard fallback label issued pattern
      } else {
        bodyId = 100000; // general fallback
      }
    }

    const parsedBodyId = isNaN(Number(bodyId)) ? bodyId : Number(bodyId);
    const cleanMobile = sanitizeMobileNumber(mobile);
    
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'شماره موبایل نامعتبر است' };
    }

    // Ensure args is always an array of strings
    const args = Array.isArray(textValues) ? textValues : [String(textValues)];

    // Build JSON payload with fields: to, bodyId, args, plus token/line config
    const payload = {
      username,
      password,
      from: fromNumber,
      to: cleanMobile,
      bodyId: parsedBodyId,
      args: args,
      text: args.join(';') // text field for older versions of proxy
    };

    console.log(`[SMS Service] Sending POST pattern request to bankkalaha proxy. Recipient: ${cleanMobile}, bodyId: ${parsedBodyId}`);

    const response = await fetch('https://bankkalaha.ir/sms-proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'ZopitSMS2026Key'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    
    if (response.ok) {
      return {
        success: true,
        message: 'پیامک با موفقیت از طریق پروکسی ارسال شد',
        response: data
      };
    } else {
      console.error('[SMS Service Proxy Error Response]', response.status, data);
      return {
        success: false,
        error: `خطا در سرور پروکسی پیامک (کد ${response.status})`,
        response: data
      };
    }
  } catch (err: any) {
    console.error('[SMS Service Proxy Exception]', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Sends a normal plain-text SMS message via the bankkalaha.ir proxy.
 */
export async function sendSms(mobile: string, message: string) {
  try {
    const prisma = getPrisma();
    
    // Read MelliPayamak configuration dynamically from Database
    const [dbUser, dbPass, dbFrom] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_USERNAME' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PASSWORD' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_FROM_NUMBER' } })
    ]);

    const username = dbUser?.value?.trim() || '';
    const password = dbPass?.value?.trim() || '';
    const fromNumber = dbFrom?.value?.trim() || '50001';

    if (!username || !password) {
      console.error('[SMS Service] MelliPayamak credentials (username/password) are missing from Database.');
      return { 
        success: false, 
        error: 'تنظیمات نام کاربری و کلمه عبور ملی‌پیامک در پایگاه‌داده یافت نشد.' 
      };
    }

    const cleanMobile = sanitizeMobileNumber(mobile);
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'شماره موبایل نامعتبر است' };
    }

    // Build standard MelliPayamak JSON payload for normal text message
    const payload = {
      username,
      password,
      to: cleanMobile,
      from: fromNumber,
      text: message
    };

    console.log(`[SMS Service] Sending POST normal message request to bankkalaha proxy. Recipient: ${cleanMobile}`);

    const response = await fetch('https://bankkalaha.ir/sms-proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'ZopitSMS2026Key'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    
    if (response.ok) {
      return {
        success: true,
        message: 'پیامک با موفقیت از طریق پروکسی ارسال شد',
        response: data
      };
    } else {
      console.error('[SMS Service Proxy Normal SMS Error]', response.status, data);
      return {
        success: false,
        error: `خطا در سرور پروکسی پیامک (کد ${response.status})`,
        response: data
      };
    }
  } catch (err: any) {
    console.error('[SMS Service Normal SMS Exception]', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Compatible export aliases
 */
export async function sendSmsViaMelliPayamak(mobile: string, message: string, orderId?: number) {
  return sendSms(mobile, message);
}

export async function sendMelliPayamakPattern(mobile: string, patternKey: string, textValues: string[]) {
  return sendPattern(mobile, patternKey, textValues);
}

export async function sendOtpSms(mobile: string, code: string) {
  return sendPattern(mobile, 'MELLIPAYAMAK_PATTERN_OTP', [code]);
}

export async function notifySupplierNewOrder(supplierMobile: string, orderId: number, supplierName?: string) {
  return sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]);
}

export async function notifySupplierCommitment(orderId: number, storeMobile?: string, supplierMobile?: string) {
  if (storeMobile) {
    sendPattern(storeMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]).catch(() => {});
  }
  if (supplierMobile) {
    sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]).catch(() => {});
  }
  return { success: true };
}

export async function notifyPostalLabelPrinted(orderId: number, recipientMobile?: string, trackingCode?: string) {
  if (!recipientMobile) return { success: false };
  return sendPattern(recipientMobile, 'MELLIPAYAMAK_PATTERN_LABEL_ISSUED', [String(orderId)]);
}
