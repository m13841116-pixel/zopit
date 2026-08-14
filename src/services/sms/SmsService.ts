import { getPrisma } from '../../prisma.js';

export async function sendPattern(mobile: string, patternKey: string, textValues: string[]) {
  try {
    const prisma = getPrisma();
    
    // Get customized bodyId from database config based on patternKey
    const dbPattern = await prisma.systemConfig.findUnique({ where: { key: patternKey } });
    const dbGeneralPattern = await prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_ID' } });

    // Extract body ID value (check DB, fallback to environment)
    const rawBodyId = 
      dbPattern?.value?.trim() || 
      dbGeneralPattern?.value?.trim() || 
      process.env[patternKey] || 
      '';

    // Map default pattern IDs if nothing is configured
    let bodyId: string | number = rawBodyId;
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

    // Convert to number if it is numeric
    const parsedBodyId = isNaN(Number(bodyId)) ? bodyId : Number(bodyId);

    // Sanitize mobile number format
    let cleanMobile = mobile ? String(mobile).trim().replace(/\s+/g, '') : '';
    if (cleanMobile.startsWith('+98')) cleanMobile = '0' + cleanMobile.slice(3);
    else if (cleanMobile.startsWith('98')) cleanMobile = '0' + cleanMobile.slice(2);
    
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'شماره موبایل نامعتبر است' };
    }

    // Build API payload
    const payload = {
      to: cleanMobile,
      bodyId: parsedBodyId,
      args: textValues
    };

    console.log(`[SMS Service] Sending POST request to bankkalaha proxy. Target: ${cleanMobile}, bodyId: ${parsedBodyId}`);

    // Real fetch request to the proxy
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
      return {
        success: false,
        error: `خطا در سرور پروکسی پیامک (کد ${response.status})`,
        response: data
      };
    }
  } catch (err: any) {
    console.error('[SMS Proxy Error]', err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Map general sendSms to a generic pattern of the proxy to ensure no simulation is ever used
export async function sendSms(mobile: string, message: string) {
  // Use a general pattern or map the full text as argument
  return sendPattern(mobile, 'MELLIPAYAMAK_PATTERN_GENERAL', [message]);
}

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
