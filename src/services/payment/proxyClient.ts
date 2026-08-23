import https from 'https';
import http from 'http';
import { URL } from 'url';
import { PaymentLogger } from './PaymentLogger.js';

export interface ProxyResponse {
  ok: boolean;
  status: number;
  text: string;
  data?: any;
  durationMs?: number;
  dnsMs?: number;
  connectMs?: number;
  tlsMs?: number;
  ttfbMs?: number;
}

function makeNodeRequest(urlStr: string, payloadString: string, secretKey: string | null, timeoutMs: number): Promise<ProxyResponse> {
  const startTime = Date.now();
  let dnsTime: number | null = null;
  let connectTime: number | null = null;
  let tlsTime: number | null = null;
  let ttfbTime: number | null = null;

  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZopitPaymentProxy/1.0',
        'Content-Length': String(Buffer.byteLength(payloadString)),
      };

      if (secretKey) {
        headers['X-Proxy-Secret'] = secretKey;
        headers['X-Proxy-Secret-Key'] = secretKey;
        headers['X-Api-Key'] = secretKey;
        headers['Authorization'] = `Bearer ${secretKey}`;
      }

      const isDev = process.env.NODE_ENV !== 'production';
      const req = client.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers,
        timeout: timeoutMs,
        rejectUnauthorized: false,
      }, (res) => {
        let body = '';
        res.once('data', () => {
          if (ttfbTime === null) ttfbTime = Date.now();
        });
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const elapsed = Date.now() - startTime;
          const dnsMs = dnsTime ? dnsTime - startTime : undefined;
          const connectMs = connectTime ? connectTime - (dnsTime || startTime) : undefined;
          const tlsMs = tlsTime ? tlsTime - (connectTime || startTime) : undefined;
          const ttfbMs = ttfbTime ? ttfbTime - startTime : elapsed;
          
          let data: any;
          try {
            if (body) data = JSON.parse(body);
          } catch (e) {}
          
          resolve({
            ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
            status: res.statusCode || 500,
            text: body,
            data,
            durationMs: elapsed,
            dnsMs,
            connectMs,
            tlsMs,
            ttfbMs,
          });
        });
      });

      req.on('socket', (socket) => {
        socket.on('lookup', () => { dnsTime = Date.now(); });
        socket.on('connect', () => { connectTime = Date.now(); });
        socket.on('secureConnect', () => { tlsTime = Date.now(); });
      });

      req.on('error', (err: any) => {
        const elapsed = Date.now() - startTime;
        const error = new Error(`ارتباط با سرور برقرار نشد (${err.code || err.message})`) as any;
        error.code = err.code;
        error.durationMs = elapsed;
        error.dnsMs = dnsTime ? dnsTime - startTime : undefined;
        error.connectMs = connectTime ? connectTime - (dnsTime || startTime) : undefined;
        error.tlsMs = tlsTime ? tlsTime - (connectTime || startTime) : undefined;
        reject(error);
      });

      req.on('timeout', () => {
        const elapsed = Date.now() - startTime;
        req.destroy();
        const error = new Error(`زمان پاسخگویی پایان یافت (${elapsed}ms Timeout)`) as any;
        error.code = 'ETIMEDOUT';
        error.durationMs = elapsed;
        error.dnsMs = dnsTime ? dnsTime - startTime : undefined;
        error.connectMs = connectTime ? connectTime - (dnsTime || startTime) : undefined;
        error.tlsMs = tlsTime ? tlsTime - (connectTime || startTime) : undefined;
        reject(error);
      });

      req.write(payloadString);
      req.end();
    } catch (err: any) {
      reject(err);
    }
  });
}

export async function executeProxyRequest(
  payload: any,
  options: {
    proxyUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
    requestId?: string;
    gateway?: string;
    action?: string;
    orderId?: string;
    userId?: number;
  } = {}
): Promise<ProxyResponse> {
  const defaultProxyUrl = 'https://bankkalaha.ir/zibal-proxy.php';
  const defaultSecretKey = 'ZopitSec_9f84b13a7c6e25d0e81f72ac39014b';

  let baseProxyUrl = (options.proxyUrl || process.env.PAYMENT_PROXY_URL || defaultProxyUrl).trim();
  let secretKey = (options.apiKey || process.env.PAYMENT_PROXY_SECRET_KEY || defaultSecretKey).trim();

  // Fast timeout for serverless environments (e.g. 7000ms max)
  const timeoutMs = options.timeoutMs || parseInt(process.env.PAYMENT_PROXY_TIMEOUT_MS || '12000', 10);
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const reqId = options.requestId || PaymentLogger.generateRequestId();

  let logRequestBody = payloadString;
  try {
    if (typeof payload === 'object' && payload.iban) {
      const maskedPayload = { ...payload };
      maskedPayload.iban = PaymentLogger.maskSensitiveData(maskedPayload.iban);
      logRequestBody = JSON.stringify(maskedPayload);
    }
  } catch(e) {}

  let proxyUrlToLog = baseProxyUrl;
  try {
    const pUrl = new URL(baseProxyUrl);
    proxyUrlToLog = pUrl.origin + pUrl.pathname;
  } catch(e) {}

  // Determine Zibal direct endpoint based on action
  const parsedPayloadObj = typeof payload === 'object' ? payload : {};
  const requestedAction = parsedPayloadObj.action || (options.action === 'VERIFY_PAYMENT' ? 'verify' : 'request');
  let directZibalUrl = 'https://gateway.zibal.ir/v1/request';
  if (requestedAction === 'verify' || options.action === 'VERIFY_PAYMENT') {
    directZibalUrl = 'https://gateway.zibal.ir/v1/verify';
  } else if (requestedAction === 'checkout' || options.action === 'PAYOUT') {
    directZibalUrl = 'https://gateway.zibal.ir/v1/checkout';
  } else if (requestedAction === 'checkout_status' || options.action === 'PAYOUT_STATUS') {
    directZibalUrl = 'https://gateway.zibal.ir/v1/checkout/status';
  }

  // Attempt: Direct Gateway Connection to Zibal (Proxy completely bypassed for speed)
  try {
    const directRes = await makeNodeRequest(directZibalUrl, payloadString, null, 8000);
    if (directRes.data && (directRes.data.result !== undefined || directRes.data.trackId !== undefined || directRes.data.success !== undefined)) {
      await PaymentLogger.logPaymentEvent({
        requestId: reqId,
        gateway: options.gateway || 'ZIBAL',
        action: options.action || 'UNKNOWN',
        status: 'SUCCESS_DIRECT',
        targetUrl: directZibalUrl,
        httpStatus: directRes.status,
        durationMs: directRes.durationMs,
        requestBody: logRequestBody,
        responseBody: directRes.text,
        orderId: options.orderId,
        userId: options.userId
      });
      return directRes;
    }

    return directRes;
  } catch (directErr: any) {
    console.error(`[ProxyClient Error] Both Proxy and Direct Gateway failed. Direct error: ${directErr.message}`);
    
    await PaymentLogger.logPaymentEvent({
      requestId: reqId,
      gateway: options.gateway || 'ZIBAL',
      action: options.action || 'UNKNOWN',
      status: 'FAILED',
      targetUrl: directZibalUrl,
      errorMessage: `Proxy & Direct failed: ${directErr.message}`,
      requestBody: logRequestBody,
      orderId: options.orderId,
      userId: options.userId
    });

    return {
      ok: false,
      status: 502,
      text: JSON.stringify({ result: -1, message: `خطا در برقراری ارتباط با درگاه پرداخت: ${directErr.message}` }),
      data: { result: -1, message: `خطا در برقراری ارتباط با درگاه پرداخت: ${directErr.message}` },
      durationMs: 0
    };
  }
}

