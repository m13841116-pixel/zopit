import { getPrisma } from '../prisma.js';

/**
 * Supported SMS Providers
 */
export enum SmsProviderType {
  MELLIPAYAMAK = 'MELIPAYAMAK',
  KAVENEGAR = 'KAVENEGAR',
  // Add other providers here if needed
}

export interface SmsProviderConfig {
  provider: SmsProviderType;
  username?: string;
  password?: string;
  apiKey?: string;
  fromNumber?: string;
}

export interface SendSmsOptions {
  mobile: string;
  message?: string;
  templateId?: string;
  templateArgs?: string[];
}

export interface SmsResult {
  success: boolean;
  message?: string;
  rawResponse?: any;
}

/**
 * Standardizes mobile numbers to local Iranian format starting with 09...
 */
function sanitizeMobileNumber(mobile: string): string {
  let cleanMobile = mobile ? mobile.trim().replace(/\s+/g, '') : '';
  if (cleanMobile.startsWith('+98')) {
    cleanMobile = '0' + cleanMobile.slice(3);
  } else if (cleanMobile.startsWith('98') && cleanMobile.length === 12) {
    cleanMobile = '0' + cleanMobile.slice(2);
  }
  return cleanMobile;
}

/**
 * Fetches SMS configuration from the database (SystemConfig table)
 */
export async function getSmsProviderConfig(): Promise<SmsProviderConfig> {
  const prisma = getPrisma();
  
  const [providerConfig, dbUser, dbPass, dbApiKey, dbFrom] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'SMS_PANEL_PROVIDER' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_USERNAME' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PASSWORD' } }),
    prisma.systemConfig.findUnique({ where: { key: 'SMS_PANEL_API_KEY' } }),
    prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_FROM_NUMBER' } }),
  ]);

  const provider = (providerConfig?.value as SmsProviderType) || SmsProviderType.MELLIPAYAMAK;
  
  return {
    provider,
    username: dbUser?.value || process.env.MELLIPAYAMAK_USERNAME || process.env.SMS_PANEL_USERNAME,
    password: dbPass?.value || process.env.MELLIPAYAMAK_PASSWORD || process.env.SMS_PANEL_PASSWORD,
    apiKey: dbApiKey?.value || process.env.SMS_PANEL_API_KEY,
    fromNumber: dbFrom?.value || process.env.MELLIPAYAMAK_FROM_NUMBER || "50001",
  };
}

/**
 * Sends an SMS using the configured provider
 */
export async function sendSms(options: SendSmsOptions): Promise<SmsResult> {
  const cleanMobile = sanitizeMobileNumber(options.mobile);

  if (!cleanMobile || cleanMobile.length < 10) {
    console.warn('[SMS Provider] Invalid mobile number:', options.mobile);
    return { success: false, message: 'شماره موبایل گیرنده نامعتبر است.' };
  }

  try {
    const config = await getSmsProviderConfig();

    if (config.provider === SmsProviderType.MELLIPAYAMAK) {
      return await sendViaMelliPayamak(config, cleanMobile, options);
    } 
    // Add other providers (like Kavenegar) logic here
    
    console.warn(`[SMS Provider] Provider ${config.provider} is not implemented.`);
    return { success: false, message: 'درگاه پیامک پیکربندی نشده است.' };
    
  } catch (err: any) {
    console.error('[SMS Provider] Core Error:', err?.message || err);
    return { success: false, message: err?.message || 'خطای شبکه در ارسال پیامک' };
  }
}

/**
 * Specific implementation for MelliPayamak
 */
async function sendViaMelliPayamak(config: SmsProviderConfig, mobile: string, options: SendSmsOptions): Promise<SmsResult> {
  const { username, password, fromNumber } = config;

  if (!username || !password) {
    console.warn('[SMS Provider] MelliPayamak credentials missing.');
    console.log(`[SMS SIMULATION to ${mobile}]:`, options);
    return { success: true, message: 'پیامک در حالت شبیه‌سازی ثبت شد (اطلاعات درگاه تنظیم نشده است).' };
  }

  // 1. Send via Service Pattern (Fast OTP / Notifications)
  if (options.templateId && options.templateArgs && options.templateArgs.length > 0) {
    const endpoint = 'https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber';
    const body = {
      username,
      password,
      to: mobile,
      bodyId: parseInt(options.templateId, 10),
      text: options.templateArgs // MelliPayamak expects an array of strings for pattern variables
    };

    console.log(`[SMS Provider] Sending OTP/Pattern SMS via MelliPayamak to ${mobile}...`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data: any = await response.json().catch(() => ({}));
    if (response.ok && (data.Value || data.RetStatus === 1 || data.RetStatus === 0)) {
      return { success: true, rawResponse: data };
    }
    console.error('[SMS Provider] Failed to send pattern SMS:', data);
    return { success: false, message: data.StrRetStatus || 'خطا در ارسال پیامک پترن', rawResponse: data };
  }

  // 2. Send Normal Text Message
  if (options.message) {
    const endpoint = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';
    const body = {
      username,
      password,
      to: mobile,
      from: fromNumber,
      text: options.message
    };

    console.log(`[SMS Provider] Sending Normal SMS via MelliPayamak to ${mobile}...`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data: any = await response.json().catch(() => ({}));
    if (response.ok && (data.Value || data.RetStatus === 1 || data.RetStatus === 0 || typeof data === 'string')) {
      return { success: true, rawResponse: data };
    }
    console.error('[SMS Provider] Failed to send normal SMS:', data);
    return { success: false, message: data.StrRetStatus || 'خطا در ارسال پیامک متنی', rawResponse: data };
  }

  return { success: false, message: 'هیچ متن یا پترنی برای ارسال مشخص نشده است.' };
}

/**
 * Utility functions ready to be used in auth routes
 */
export async function sendOtpSms(mobile: string, otpCode: string): Promise<SmsResult> {
  const prisma = getPrisma();
  // Attempt to get a predefined template ID for OTP from DB
  const otpTemplate = await prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_OTP_PATTERN_ID' } });
  
  if (otpTemplate?.value) {
    return await sendSms({
      mobile,
      templateId: otpTemplate.value,
      templateArgs: [otpCode] // Assumes the pattern has one variable {0} for the code
    });
  } else {
    // Fallback to normal text if no pattern is defined
    return await sendSms({
      mobile,
      message: `کد تایید شما: ${otpCode}`
    });
  }
}

export async function sendPasswordRecoverySms(mobile: string, linkOrCode: string): Promise<SmsResult> {
  const prisma = getPrisma();
  // Attempt to get a predefined template ID for Recovery from DB
  const recoveryTemplate = await prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_RECOVERY_PATTERN_ID' } });

  if (recoveryTemplate?.value) {
    return await sendSms({
      mobile,
      templateId: recoveryTemplate.value,
      templateArgs: [linkOrCode]
    });
  } else {
    return await sendSms({
      mobile,
      message: `بازیابی رمز عبور. کد/لینک شما: ${linkOrCode}`
    });
  }
}
