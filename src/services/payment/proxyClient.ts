import https from 'https';
import http from 'http';
import { URL } from 'url';
import dns from 'dns';
import { PaymentLogger } from './PaymentLogger.js';

try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

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

async function makeFetchRequest(urlStr: string, payloadString: string, secretKey: string | null, timeoutMs: number): Promise<ProxyResponse> {
  const startTime = Date.now();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  if (secretKey) {
    headers['X-Proxy-Secret-Key'] = secretKey;
    headers['X-Proxy-Secret'] = secretKey;
    headers['X-Api-Key'] = secretKey;
  }

  try {
    const res = await fetch(urlStr, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const durationMs = Date.now() - startTime;
    const text = await res.text();
    let data: any;
    try {
      if (text) data = JSON.parse(text);
    } catch (e) {}

    return {
      ok: res.ok,
      status: res.status,
      text,
      data,
      durationMs,
    };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    if (err.name === 'AbortError' || err.name === 'TimeoutError' || err.message?.toLowerCase().includes('timeout') || err.message?.includes('پاسخگویی')) {
      const timeoutErr = new Error(`زمان پاسخگویی پایان یافت (${elapsed}ms Timeout)`) as any;
      timeoutErr.name = 'TimeoutError';
      timeoutErr.durationMs = elapsed;
      throw timeoutErr;
    }
    throw err;
  }
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Length': String(Buffer.byteLength(payloadString)),
      };

      if (secretKey) {
        headers['X-Proxy-Secret-Key'] = secretKey;
        headers['X-Proxy-Secret'] = secretKey;
        headers['X-Api-Key'] = secretKey;
      }

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

async function makeUnifiedRequest(urlStr: string, payloadString: string, secretKey: string | null, timeoutMs: number): Promise<ProxyResponse> {
  if (false) {
    try {
      return await makeFetchRequest(urlStr, payloadString, secretKey, timeoutMs);
    } catch (fetchErr: any) {
      if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError' || fetchErr.message?.includes('Timeout') || fetchErr.message?.includes('پاسخگویی')) {
        throw fetchErr;
      }
    }
  }
  return await makeNodeRequest(urlStr, payloadString, secretKey, timeoutMs);
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

  if (!baseProxyUrl || baseProxyUrl === 'undefined' || baseProxyUrl === 'null' || baseProxyUrl.length < 8) {
    baseProxyUrl = defaultProxyUrl;
  }
  if (!secretKey || secretKey === 'undefined' || secretKey === 'null') {
    secretKey = defaultSecretKey;
  }

  // Generous timeout for serverless environments to Iran
  const timeoutMs = options.timeoutMs || parseInt(process.env.PAYMENT_PROXY_TIMEOUT_MS || '15000', 10);
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

  // Primary and secondary Iranian Static IP Proxies (for Zibal IP whitelisting)
  let proxyErrToLog: any = null;
  const proxyCandidates = [
    'https://bankkalaha.ir/zibal-proxy.php',
    'https://www.bankkalaha.ir/zibal-proxy.php'
  ];

  for (let i = 0; i < proxyCandidates.length; i++) {
    const targetProxyUrl = proxyCandidates[i];
    try {
      const activeSecret = defaultSecretKey;
      // Generous timeouts for Vercel-to-Iran latency: 12s for primary, 10s for secondary
      const currentAttemptTimeout = i === 0 ? 12000 : 10000;
      const proxyRes = await makeUnifiedRequest(targetProxyUrl, payloadString, activeSecret, currentAttemptTimeout);
      
      // If we got a valid response (JSON from proxy or Zibal)
      if (proxyRes.data && (proxyRes.data.result !== undefined || proxyRes.data.trackId !== undefined || proxyRes.data.success !== undefined)) {
        // If proxy returned success or valid trackId
        if (proxyRes.data.result === 100 || proxyRes.data.trackId || proxyRes.data.success) {
          PaymentLogger.logPaymentEvent({
            requestId: reqId,
            gateway: options.gateway || 'ZIBAL',
            action: options.action || 'UNKNOWN',
            status: 'SUCCESS',
            targetUrl: targetProxyUrl,
            httpStatus: proxyRes.status,
            durationMs: proxyRes.durationMs,
            requestBody: logRequestBody,
            responseBody: proxyRes.text,
            orderId: options.orderId,
            userId: options.userId
          }).catch(() => {});
          return proxyRes;
        }
        // If proxy returned a specific gateway business error (e.g. 104, 106)
        if (proxyRes.data.result !== undefined) {
          return proxyRes;
        }
      }
    } catch (proxyErr: any) {
      proxyErrToLog = proxyErr;
      console.warn(`[ProxyClient] Attempt failed for ${targetProxyUrl} (${proxyErr.message})`);
    }
  }

  // If proxy attempts failed, try direct Zibal as a last resort (5.0s timeout)
  try {
    const directRes = await makeUnifiedRequest(directZibalUrl, payloadString, null, 5000);
    if (directRes.data && (directRes.data.result !== undefined || directRes.data.trackId !== undefined || directRes.data.success !== undefined)) {
      // Check if direct Zibal returned an IP restriction error (e.g., "invalid IP ...")
      const msgStr = String(directRes.data.message || directRes.data.error || '');
      const isInvalidIp = msgStr.toLowerCase().includes('invalid ip') || directRes.data.result === 115;
      
      if (isInvalidIp) {
        console.warn(`[ProxyClient] Direct Zibal rejected server IP (${msgStr}). Returning connection error.`);
        return {
          ok: false,
          status: 503,
          text: JSON.stringify({ result: -1, message: 'ارتباط با درگاه پرداخت به دلیل کندی شبکه برقرار نشد. لطفاً مجدداً دکمه تایید و ادامه را بزنید.' }),
          data: { result: -1, message: 'ارتباط با درگاه پرداخت به دلیل کندی شبکه برقرار نشد. لطفاً مجدداً دکمه تایید و ادامه را بزنید.' },
          durationMs: directRes.durationMs
        };
      }

      PaymentLogger.logPaymentEvent({
        requestId: reqId,
        gateway: options.gateway || 'ZIBAL',
        action: options.action || 'UNKNOWN',
        status: directRes.ok ? 'SUCCESS_DIRECT' : 'FAILED',
        targetUrl: directZibalUrl,
        httpStatus: directRes.status,
        durationMs: directRes.durationMs,
        requestBody: logRequestBody,
        responseBody: directRes.text,
        orderId: options.orderId,
        userId: options.userId
      }).catch(() => {});
      return directRes;
    }

    return directRes;
  } catch (directErr: any) {
    console.error(`[ProxyClient Error] Both Proxy and Direct Gateway failed. Proxy error: ${proxyErrToLog?.message}, Direct error: ${directErr.message}`);
    
    PaymentLogger.logPaymentEvent({
      requestId: reqId,
      gateway: options.gateway || 'ZIBAL',
      action: options.action || 'UNKNOWN',
      status: 'FAILED',
      targetUrl: directZibalUrl,
      errorMessage: `Proxy & Direct failed: ${proxyErrToLog?.message || ''} / ${directErr.message}`,
      requestBody: logRequestBody,
      orderId: options.orderId,
      userId: options.userId
    }).catch(() => {});

    return {
      ok: false,
      status: 502,
      text: JSON.stringify({ result: -1, message: 'ارتباط با درگاه پرداخت به دلیل ترافیک شبکه برقرار نشد. لطفاً مجدداً دکمه تایید و پرداخت را بزنید.' }),
      data: { result: -1, message: 'ارتباط با درگاه پرداخت به دلیل ترافیک شبکه برقرار نشد. لطفاً مجدداً دکمه تایید و پرداخت را بزنید.' },
      durationMs: 0
    };
  }
}

