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
 * Fetches MelliPayamak configuration directly from systemConfig in Prisma DB
 */
async function getMelliPayamakConfig() {
  const prisma = getPrisma();
  
  const [dbUser, dbPass, dbFrom, dbPatternGeneral, dbPatternOtp, dbPatternSupplier, dbPatternLabel, dbPatternAnnouncement] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_USERNAME' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PASSWORD' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_FROM_NUMBER' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_ID' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_OTP' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_LABEL_ISSUED' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_ANNOUNCEMENT' } }),
  ]);

  const username = dbUser?.value?.trim() || process.env.MELLIPAYAMAK_USERNAME?.trim() || '';
  const password = dbPass?.value?.trim() || process.env.MELLIPAYAMAK_PASSWORD?.trim() || '';
  const fromNumber = dbFrom?.value?.trim() || process.env.MELLIPAYAMAK_FROM_NUMBER?.trim() || '50001';

  return {
    username,
    password,
    fromNumber,
    patterns: {
      MELLIPAYAMAK_PATTERN_ID: dbPatternGeneral?.value?.trim() || '',
      MELLIPAYAMAK_PATTERN_OTP: dbPatternOtp?.value?.trim() || '',
      MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT: dbPatternSupplier?.value?.trim() || '',
      MELLIPAYAMAK_PATTERN_LABEL_ISSUED: dbPatternLabel?.value?.trim() || '',
      MELLIPAYAMAK_PATTERN_ANNOUNCEMENT: dbPatternAnnouncement?.value?.trim() || '',
    }
  };
}

/**
 * Core function to send an SMS pattern/template via MelliPayamak REST API
 * with automatic fallback to the Iranian proxy (https://bankkalaha.ir/sms-proxy.php)
 * to guarantee delivery from both Iranian and foreign (Vercel/Cloud) environments.
 */
export async function sendPattern(mobile: string, patternKey: string, textValues: string[]) {
  try {
    const config = await getMelliPayamakConfig();

    if (!config.username || !config.password) {
      console.error('[SMS Service] MelliPayamak credentials (username/password) are missing from Database/SystemConfig.');
      return { 
        success: false, 
        error: 'تنظیمات نام کاربری و کلمه عبور ملی‌پیامک در پنل سوپرادمین پیکربندی نشده است.' 
      };
    }

    const cleanMobile = sanitizeMobileNumber(mobile);
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'شماره موبایل گیرنده نامعتبر است.' };
    }

    // Determine bodyId for the pattern
    let rawBodyId = config.patterns[patternKey as keyof typeof config.patterns] || '';
    
    // If not found by exact key, try looking up patternKey in Prisma if it's a dynamic key
    if (!rawBodyId) {
      const prisma = getPrisma();
      const customKeyConfig = await prisma.systemConfig.findUnique({ where: { key: patternKey } }).catch(() => null);
      rawBodyId = customKeyConfig?.value?.trim() || config.patterns.MELLIPAYAMAK_PATTERN_ID || '';
    }

    // If patternKey is itself a numeric bodyId string (e.g., "223344"), use it
    if (!rawBodyId && !isNaN(Number(patternKey)) && Number(patternKey) > 0) {
      rawBodyId = patternKey;
    }

    const bodyIdNumber = parseInt(rawBodyId, 10);
    if (!bodyIdNumber || isNaN(bodyIdNumber)) {
      console.error(`[SMS Service] Pattern ID for key "${patternKey}" is not defined or invalid.`);
      return {
        success: false,
        error: `شناسه پترن (Body ID) برای رویداد ${patternKey} در تنظیمات سیستم یافت نشد.`
      };
    }

    // Format text values array into semicolon-separated string format for MelliPayamak
    const argsArray = Array.isArray(textValues) ? textValues : [String(textValues)];
    const textFormatted = argsArray.join(';');

    const payload = {
      username: config.username,
      password: config.password,
      to: cleanMobile,
      bodyId: bodyIdNumber,
      text: textFormatted,
      args: argsArray,
      from: config.fromNumber
    };

    console.log(`[SMS Service] Sending pattern SMS to ${cleanMobile} (bodyId: ${bodyIdNumber}, text: "${textFormatted}")...`);

    // 1. Attempt Direct MelliPayamak REST API Call
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const endpoint = 'https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: config.username,
          password: config.password,
          to: cleanMobile,
          bodyId: bodyIdNumber,
          text: textFormatted
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data: any = await response.json().catch(() => ({}));

      const isSuccess = response.ok && (
        data.RetStatus === 1 || 
        data.RetStatus === 0 || 
        (data.Value && String(data.Value).length > 3 && Number(data.Value) > 0)
      );

      if (isSuccess) {
        console.log(`[SMS Service] Direct pattern SMS sent successfully to ${cleanMobile}. Ref ID:`, data.Value || data.StrRetStatus);
        return {
          success: true,
          message: 'پیامک با موفقیت از طریق سامانه ملی‌پیامک ارسال شد.',
          trackingCode: String(data.Value || ''),
          response: data
        };
      }
      console.warn('[SMS Service] Direct REST call response was not successful, trying proxy fallback:', data);
    } catch (directErr: any) {
      console.warn('[SMS Service] Direct MelliPayamak connection failed (likely GeoIP/firewall block), trying proxy fallback:', directErr?.message || directErr);
    }

    // 2. Fallback: Send via Iranian WordPress proxy (bankkalaha.ir)
    try {
      console.log(`[SMS Service] Routing pattern SMS through Iranian proxy for ${cleanMobile}...`);
      const finalSmsProxyUrl = 'https://bankkalaha.ir/sms-proxy.php';

      const proxyResponse = await fetch(finalSmsProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'ZopitSMS2026Key'
        },
        body: JSON.stringify(payload)
      });
      const proxyData: any = await proxyResponse.json().catch(() => ({}));
      const isProxySuccess = proxyResponse.ok && (
        proxyData.success === true ||
        proxyData.status === true ||
        proxyData.RetStatus === 1 ||
        proxyData.RetStatus === 0 ||
        (proxyData.Value && Number(proxyData.Value) > 0)
      );

      if (isProxySuccess) {
        console.log(`[SMS Service] Proxy pattern SMS sent successfully to ${cleanMobile}.`, proxyData);
        return {
          success: true,
          message: 'پیامک با موفقیت از طریق سامانه ملی‌پیامک (پروکسی ایران) ارسال شد.',
          trackingCode: String(proxyData.Value || proxyData.trackingCode || ''),
          response: proxyData
        };
      } else {
        const errMsg = proxyData.message || proxyData.status || proxyData.error || `خطای پروکسی پیامک (کد ${proxyResponse.status})`;
        console.error('[SMS Service Proxy Error]', errMsg, proxyData);
        return {
          success: false,
          error: `خطا در ارسال پیامک: ${errMsg}`,
          response: proxyData
        };
      }
    } catch (proxyErr: any) {
      console.error('[SMS Service Proxy Exception]', proxyErr);
      return {
        success: false,
        error: `خطا در برقراری ارتباط با وب‌سرویس پیامک: ${proxyErr?.message || 'عدم دسترسی به سرور پیامک'}`
      };
    }
  } catch (err: any) {
    console.error('[SMS Service Exception]', err);
    return { 
      success: false, 
      error: err?.message || 'خطای شبکه یا سرور در برقراری ارتباط با وب‌سرویس ملی‌پیامک' 
    };
  }
}

/**
 * Core function to send a standard plain-text SMS via MelliPayamak REST API
 * with proxy fallback
 */
export async function sendSms(mobile: string, message: string) {
  try {
    const config = await getMelliPayamakConfig();

    if (!config.username || !config.password) {
      console.error('[SMS Service] MelliPayamak credentials (username/password) missing from Database/SystemConfig.');
      return { 
        success: false, 
        error: 'تنظیمات نام کاربری و کلمه عبور ملی‌پیامک در پنل سوپرادمین پیکربندی نشده است.' 
      };
    }

    const cleanMobile = sanitizeMobileNumber(mobile);
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'شماره موبایل گیرنده نامعتبر است.' };
    }

    if (!message || !message.trim()) {
      return { success: false, error: 'متن پیامک خالی است.' };
    }

    const payload = {
      username: config.username,
      password: config.password,
      to: cleanMobile,
      from: config.fromNumber,
      text: message.trim()
    };

    console.log(`[SMS Service] Sending normal SMS to ${cleanMobile}...`);

    // 1. Direct REST call
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const endpoint = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data: any = await response.json().catch(() => ({}));

      const isSuccess = response.ok && (
        data.RetStatus === 1 || 
        data.RetStatus === 0 || 
        (data.Value && String(data.Value).length > 3 && Number(data.Value) > 0)
      );

      if (isSuccess) {
        console.log(`[SMS Service] Normal SMS sent successfully to ${cleanMobile}. Ref ID:`, data.Value || data.StrRetStatus);
        return {
          success: true,
          message: 'پیامک با موفقیت از طریق سامانه ملی‌پیامک ارسال شد.',
          trackingCode: String(data.Value || ''),
          response: data
        };
      }
    } catch (directErr: any) {
      console.warn('[SMS Service] Direct SendSMS failed, trying proxy fallback:', directErr?.message || directErr);
    }

    // 2. Proxy fallback
    try {
      const finalSmsProxyUrl = 'https://bankkalaha.ir/sms-proxy.php';

      const proxyResponse = await fetch(finalSmsProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'ZopitSMS2026Key'
        },
        body: JSON.stringify(payload)
      });
      const proxyData: any = await proxyResponse.json().catch(() => ({}));
      if (proxyResponse.ok && (proxyData.success || proxyData.status === true || proxyData.Value)) {
        return {
          success: true,
          message: 'پیامک با موفقیت ارسال شد.',
          response: proxyData
        };
      } else {
        return {
          success: false,
          error: proxyData.message || proxyData.error || `خطا در ارسال پیامک (کد ${proxyResponse.status})`,
          response: proxyData
        };
      }
    } catch (proxyErr: any) {
      return { success: false, error: 'خطا در برقراری ارتباط با وب‌سرویس پیامک' };
    }
  } catch (err: any) {
    console.error('[SMS Service Exception]', err);
    return { 
      success: false, 
      error: err?.message || 'خطای شبکه در برقراری ارتباط با وب‌سرویس ملی‌پیامک' 
    };
  }
}

/**
 * Exported alias functions preserving identical signatures across the project
 */
export async function sendSmsViaMelliPayamak(mobile: string, message: string, _orderId?: number) {
  return sendSms(mobile, message);
}

export async function sendMelliPayamakPattern(mobile: string, patternKey: string, textValues: string[]) {
  return sendPattern(mobile, patternKey, textValues);
}

export async function sendOtpSms(mobile: string, code: string) {
  return sendPattern(mobile, 'MELLIPAYAMAK_PATTERN_OTP', [code]);
}

export async function notifySupplierNewOrder(supplierMobile: string, orderId: number, _supplierName?: string) {
  return sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]);
}

export async function notifySupplierCommitment(orderId: number, storeMobile?: string, supplierMobile?: string) {
  const promises: Promise<any>[] = [];
  if (storeMobile) {
    promises.push(sendPattern(storeMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]).catch(() => {}));
  }
  if (supplierMobile && supplierMobile !== storeMobile) {
    promises.push(sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]).catch(() => {}));
  }
  await Promise.allSettled(promises);
  return { success: true };
}

export async function notifyPostalLabelPrinted(orderIdOrMobile: any, recipientMobileOrOrderId?: any, trackingCode?: string) {
  let targetMobile = '';
  let orderIdVal = '';
  let trackVal = trackingCode || '';

  if (typeof orderIdOrMobile === 'string' && (orderIdOrMobile.startsWith('09') || orderIdOrMobile.startsWith('98') || orderIdOrMobile.startsWith('+98'))) {
    targetMobile = orderIdOrMobile;
    orderIdVal = String(recipientMobileOrOrderId || '');
  } else {
    orderIdVal = String(orderIdOrMobile || '');
    targetMobile = String(recipientMobileOrOrderId || '');
  }

  if (!targetMobile) return { success: false, error: 'شماره موبایل گیرنده موجود نیست.' };
  
  const args = trackVal ? [orderIdVal, trackVal] : [orderIdVal];
  return sendPattern(targetMobile, 'MELLIPAYAMAK_PATTERN_LABEL_ISSUED', args);
}
