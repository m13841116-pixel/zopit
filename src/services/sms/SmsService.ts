import { getPrisma } from '../../prisma.js';

// Human-readable translations for MelliPayamak status/error codes
const MELLIPAYAMAK_ERROR_CODES: Record<string, string> = {
  '0': 'ارسال موفق',
  '1': 'ارسال موفق به مخابرات',
  '2': 'اعتبار پنل پیامک شما برای ارسال این پیام کافی نیست',
  '6': 'سامانه پیامک در حال بروزرسانی موقت است',
  '7': 'متن پیامک حاوی کلمات فیلتر شده است',
  '10': 'کاربر پنل غیرفعال یا معلق شده است',
  '11': 'شماره موبایل مقصد نامعتبر است',
  '12': 'خط ارسالی تعریف نشده یا فاقد دسترسی است',
  '14': 'شماره موبایل گیرنده در بلک‌لیست مخابرات است (پیامک تبلیغاتی بسته)',
  '22': 'کد پترن (BodyId) در پنل پیامک تعریف نشده یا هنوز تایید نشده است',
  '35': 'نام کاربری یا رمز عبور پنل پیامک (ملی‌پیامک) اشتباه است',
  '36': 'آی‌پی سرور در پنل پیامک مجاز شناخته نشد',
};

export async function sendPattern(mobile: string, patternKey: string, textValues: string[]) {
  try {
    const prisma = getPrisma();
    const [
      dbProvider,
      dbUser,
      dbPass,
      dbFrom,
      dbPattern,
      dbGeneralPattern,
      dbApiKey,
    ] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'SMS_PANEL_PROVIDER' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_USERNAME' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PASSWORD' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_FROM_NUMBER' } }),
      prisma.systemConfig.findUnique({ where: { key: patternKey } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_ID' } }),
      prisma.systemConfig.findUnique({ where: { key: 'SMS_PANEL_API_KEY' } }),
    ]);

    const provider = (dbProvider?.value || 'MELIPAYAMAK').toUpperCase();
    const username = dbUser?.value || process.env.MELLIPAYAMAK_USERNAME || '';
    const password = dbPass?.value || dbApiKey?.value || process.env.MELLIPAYAMAK_PASSWORD || '';
    const fromNumber = dbFrom?.value || process.env.MELLIPAYAMAK_FROM_NUMBER || '50004';
    
    // Pattern ID priority: specific pattern -> general pattern -> env var
    const bodyId =
      dbPattern?.value?.trim() ||
      dbGeneralPattern?.value?.trim() ||
      process.env[patternKey] ||
      process.env.MELLIPAYAMAK_PATTERN_ID ||
      '';

    let cleanMobile = mobile ? String(mobile).trim().replace(/\s+/g, '') : '';
    if (cleanMobile.startsWith('+98')) cleanMobile = '0' + cleanMobile.slice(3);
    else if (cleanMobile.startsWith('98')) cleanMobile = '0' + cleanMobile.slice(2);
    
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'شماره موبایل نامعتبر است' };
    }

    // If credentials or pattern is not set, simulate safely so system operations never crash
    if (!username && !password && !dbApiKey?.value) {
      console.log(`[SMS Simulation - No Credentials] To: ${cleanMobile}, Pattern: ${patternKey}, Values: ${textValues.join(', ')}`);
      return {
        success: true,
        simulated: true,
        message: 'شبیه‌سازی پیامک (اطلاعات پنل پیامک هنوز در تنظیمات وارد نشده است)',
      };
    }

    if (!bodyId) {
      console.log(`[SMS Simulation - No Pattern ID] To: ${cleanMobile}, Pattern: ${patternKey}, Values: ${textValues.join(', ')}`);
      return {
        success: true,
        simulated: true,
        message: `شبیه‌سازی پیامک (کد پترن برای ${patternKey} تنظیم نشده است)`,
      };
    }

    if (provider === 'KAVENEGAR') {
      const apiKey = dbApiKey?.value || password;
      if (!apiKey) return { success: true, simulated: true, message: 'کلید API کاوه‌نگار یافت نشد' };
      const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json?receptor=${cleanMobile}&token=${encodeURIComponent(textValues[0] || '')}&token2=${encodeURIComponent(textValues[1] || '')}&token3=${encodeURIComponent(textValues[2] || '')}&template=${bodyId}`;
      const response = await fetch(url);
      const data: any = await response.json().catch(() => ({}));
      return { success: response.ok, response: data };
    } else if (provider === 'FARAZSMS') {
      const response = await fetch('https://ippanel.com/api/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'pattern',
          user: username,
          pass: password,
          fromNum: fromNumber,
          toNum: cleanMobile,
          patternCode: bodyId,
          inputData: textValues.map((v, i) => ({ [`var${i + 1}`]: v })),
        }),
      });
      const data: any = await response.json().catch(() => ({}));
      return { success: response.ok, response: data };
    } else {
      // MelliPayamak REST BaseServiceNumber API
      const textStr = textValues.join(';');
      const numericBodyId = parseInt(bodyId, 10);
      const finalBodyId = isNaN(numericBodyId) ? bodyId : numericBodyId;

      const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          text: textStr,
          to: cleanMobile,
          bodyId: finalBodyId,
        }),
      });

      const data: any = await response.json().catch(() => ({}));
      
      // Parse MelliPayamak Response
      const valueStr = String(data.Value || '');
      const retStatus = data.RetStatus;

      // Positive long number string or RetStatus === 1 means success
      if (
        (valueStr.length > 5 && !isNaN(Number(valueStr))) ||
        retStatus === 1 ||
        retStatus === 0 ||
        data.StrRetStatus === 'Ok'
      ) {
        return {
          success: true,
          trackingCode: valueStr,
          message: 'پیامک پترن با موفقیت ارسال شد',
          rawResponse: data,
        };
      } else {
        const errorDesc =
          MELLIPAYAMAK_ERROR_CODES[valueStr] ||
          MELLIPAYAMAK_ERROR_CODES[String(retStatus)] ||
          data.StrRetStatus ||
          `خطای پنل ملی‌پیامک (کد ${valueStr || retStatus})`;
        return {
          success: false,
          error: errorDesc,
          rawResponse: data,
        };
      }
    }
  } catch (err: any) {
    console.error('[SMS Pattern API Error]', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function sendSms(mobile: string, message: string) {
  try {
    const prisma = getPrisma();
    const [dbProvider, dbUser, dbPass, dbFrom, dbApiKey] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'SMS_PANEL_PROVIDER' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_USERNAME' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PASSWORD' } }),
      prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_FROM_NUMBER' } }),
      prisma.systemConfig.findUnique({ where: { key: 'SMS_PANEL_API_KEY' } }),
    ]);

    const provider = (dbProvider?.value || 'MELIPAYAMAK').toUpperCase();
    const username = dbUser?.value || process.env.MELLIPAYAMAK_USERNAME || '';
    const password = dbPass?.value || dbApiKey?.value || process.env.MELLIPAYAMAK_PASSWORD || '';
    const fromNumber = dbFrom?.value || process.env.MELLIPAYAMAK_FROM_NUMBER || '50004';
    const apiKey = dbApiKey?.value || password;

    let cleanMobile = mobile ? String(mobile).trim().replace(/\s+/g, '') : '';
    if (cleanMobile.startsWith('+98')) cleanMobile = '0' + cleanMobile.slice(3);
    else if (cleanMobile.startsWith('98')) cleanMobile = '0' + cleanMobile.slice(2);
    
    if (!cleanMobile || cleanMobile.length < 10) {
      return { success: false, error: 'شماره موبایل نامعتبر است' };
    }

    if (!username && !password && !apiKey) {
      console.log(`[SMS Simulation] To: ${cleanMobile}, Message: ${message}`);
      return { success: true, simulated: true, message: 'شبیه‌سازی پیامک (بدون تنظیمات پنل)' };
    }

    if (provider === 'KAVENEGAR') {
      if (!apiKey) return { success: true, simulated: true };
      const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json?receptor=${cleanMobile}&message=${encodeURIComponent(message)}`;
      const response = await fetch(url);
      const data: any = await response.json().catch(() => ({}));
      return { success: response.ok, rawResponse: data };
    } else if (provider === 'FARAZSMS') {
      const url = `https://ippanel.com/services.jspd?op=send&uname=${username}&pass=${password}&message=${encodeURIComponent(message)}&to=${cleanMobile}&from=${fromNumber}`;
      const response = await fetch(url);
      const data: any = await response.json().catch(() => ({}));
      return { success: response.ok, rawResponse: data };
    } else {
      const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          to: cleanMobile,
          from: fromNumber,
          text: message,
        }),
      });
      const data: any = await response.json().catch(() => ({}));
      const valueStr = String(data.Value || '');
      const retStatus = data.RetStatus;

      if (
        (valueStr.length > 5 && !isNaN(Number(valueStr))) ||
        retStatus === 0 ||
        retStatus === 1 ||
        data.StrRetStatus === 'Ok'
      ) {
        return { success: true, rawResponse: data };
      } else {
        const errorDesc =
          MELLIPAYAMAK_ERROR_CODES[valueStr] ||
          MELLIPAYAMAK_ERROR_CODES[String(retStatus)] ||
          data.StrRetStatus ||
          'خطا در ارسال پیامک';
        return { success: false, error: errorDesc, rawResponse: data };
      }
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطای شبکه در ارسال پیامک' };
  }
}

export async function sendSmsViaMelliPayamak(mobile: string, message: string, orderId?: number) {
  return sendSms(mobile, message);
}

export async function sendMelliPayamakPattern(mobile: string, patternKey: string, textValues: string[]) {
  return sendPattern(mobile, patternKey, textValues);
}

export async function sendOtpSms(mobile: string, code: string) {
  const patternRes = await sendPattern(mobile, 'MELLIPAYAMAK_PATTERN_OTP', [code]);
  if (patternRes.success && !patternRes.simulated) return patternRes;
  return await sendSms(mobile, `کد تایید ورود زوپیت: ${code}\nzopit.ir`);
}

export async function notifySupplierNewOrder(supplierMobile: string, orderId: number, supplierName?: string) {
  const patternRes = await sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]);
  if (patternRes.success && !patternRes.simulated) return patternRes;
  return await sendSms(supplierMobile, `زوپیت: سفارش جدید #${orderId} ثبت گردید. لطفا جهت تعهد تامین بررسی فرمایید.`);
}

export async function notifySupplierCommitment(orderId: number, storeMobile?: string, supplierMobile?: string) {
  if (storeMobile) {
    sendPattern(storeMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [String(orderId)]).catch(() => {});
  }
  if (supplierMobile) {
    sendSms(supplierMobile, `زوپیت: تاییدیه تعهد برای سفارش #${orderId} با موفقیت ثبت گردید.`).catch(() => {});
  }
  return { success: true };
}

export async function notifyPostalLabelPrinted(orderId: number, recipientMobile?: string, trackingCode?: string) {
  if (!recipientMobile) return { success: false };
  const patternRes = await sendPattern(recipientMobile, 'MELLIPAYAMAK_PATTERN_LABEL_ISSUED', [String(orderId)]);
  if (patternRes.success && !patternRes.simulated) return patternRes;
  return await sendSms(recipientMobile, `زوپیت: مرسوله سفارش #${orderId} بسته‌بندی و لیبل پستی صادر شد.`);
}
