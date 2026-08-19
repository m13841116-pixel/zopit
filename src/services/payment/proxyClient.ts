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
        headers['X-Api-Key'] = secretKey;
        headers['Authorization'] = `Bearer ${secretKey}`;
      }

      const req = client.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers,
        timeout: timeoutMs,
        rejectUnauthorized: false, // Critical for Vercel -> Iran server SSL connection
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
  const baseProxyUrl = options.proxyUrl || process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
  const secretKey = options.apiKey || process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
  const timeoutMs = options.timeoutMs || 7000;
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const reqId = options.requestId || PaymentLogger.generateRequestId();

  let proxyUrlToLog = baseProxyUrl;
  try {
    const pUrl = new URL(baseProxyUrl);
    proxyUrlToLog = pUrl.origin + pUrl.pathname;
  } catch(e) {}

  if (!baseProxyUrl) {
    return {
      ok: false,
      status: 500,
      text: 'Fatal: PAYMENT_PROXY_URL is missing.',
      data: { error: 'Fatal: PAYMENT_PROXY_URL is missing in environment variables.' },
      durationMs: 0
    };
  }

  // Attempt 1: Proxy
  try {
    const res = await makeNodeRequest(baseProxyUrl, payloadString, secretKey, timeoutMs);
    
    await PaymentLogger.logPaymentEvent({
      requestId: reqId,
      gateway: options.gateway || 'ZIBAL',
      action: options.action || 'UNKNOWN',
      status: res.ok ? 'SUCCESS' : 'FAILED',
      targetUrl: proxyUrlToLog,
      httpStatus: res.status,
      durationMs: res.durationMs,
      dnsMs: res.dnsMs,
      connectMs: res.connectMs,
      tlsMs: res.tlsMs,
      requestBody: payloadString,
      responseBody: res.text,
      orderId: options.orderId,
      userId: options.userId
    });

    if (!res.ok && res.status >= 500) {
      // It's a server error on proxy, let's trigger fallback
      throw new Error(`پاسخ سرور واسط نامعتبر است (کد ${res.status})`);
    }

    return res;
  } catch (err: any) {
    const errorCode = err.code || '';
    const isTimeout = errorCode === 'ETIMEDOUT' || errorCode === 'ECONNABORTED' || err.message.includes('Timeout');
    const isNetworkError = errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN';
    
    let status = 'FAILED';
    if (isTimeout) status = 'TIMEOUT';
    else if (isNetworkError) status = 'NETWORK_ERROR';

    // Log failure for proxy
    await PaymentLogger.logPaymentEvent({
      requestId: reqId,
      gateway: options.gateway || 'ZIBAL',
      action: options.action || 'UNKNOWN',
      status,
      targetUrl: proxyUrlToLog,
      durationMs: err.durationMs || 0,
      dnsMs: err.dnsMs,
      connectMs: err.connectMs,
      tlsMs: err.tlsMs,
      errorMessage: err.message,
      errorCode,
      requestBody: payloadString,
      orderId: options.orderId,
      userId: options.userId
    });

    // Attempt 2: Direct Fallback to Zibal
    if (options.action === 'request' || options.action === 'verify' || options.action === 'checkout') {
      let directUrl = `https://gateway.zibal.ir/v1/${options.action}`;
      
      try {
        console.warn(`[ProxyClient] Switching to direct fallback for ${directUrl} (ReqID: ${reqId})`);
        // Note: passing null for secretKey because direct Zibal uses the payload for merchant info, not headers
        const fallbackRes = await makeNodeRequest(directUrl, payloadString, null, timeoutMs);
        
        await PaymentLogger.logPaymentEvent({
          requestId: reqId,
          gateway: options.gateway || 'ZIBAL',
          action: options.action || 'UNKNOWN',
          status: fallbackRes.ok ? 'SUCCESS' : 'FAILED',
          targetUrl: directUrl,
          httpStatus: fallbackRes.status,
          durationMs: fallbackRes.durationMs,
          dnsMs: fallbackRes.dnsMs,
          connectMs: fallbackRes.connectMs,
          tlsMs: fallbackRes.tlsMs,
          requestBody: payloadString,
          responseBody: fallbackRes.text,
          orderId: options.orderId,
          userId: options.userId
        });
        
        return fallbackRes;
      } catch (fallbackErr: any) {
        const fErrorCode = fallbackErr.code || '';
        const fIsTimeout = fErrorCode === 'ETIMEDOUT' || fErrorCode === 'ECONNABORTED' || fallbackErr.message.includes('Timeout');
        let fStatus = fIsTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';
        
        await PaymentLogger.logPaymentEvent({
          requestId: reqId,
          gateway: options.gateway || 'ZIBAL',
          action: options.action || 'UNKNOWN',
          status: fStatus,
          targetUrl: directUrl,
          durationMs: fallbackErr.durationMs || 0,
          dnsMs: fallbackErr.dnsMs,
          connectMs: fallbackErr.connectMs,
          tlsMs: fallbackErr.tlsMs,
          errorMessage: fallbackErr.message,
          errorCode: fErrorCode,
          requestBody: payloadString,
          orderId: options.orderId,
          userId: options.userId
        });
        
        const finalErrorMsg = fIsTimeout 
          ? 'ارتباط با درگاه پرداخت به دلیل کندی شبکه مقدور نیست. لطفا از اتصال اینترنت خود اطمینان حاصل کنید.'
          : `خطای شبکه در ارتباط مستقیم با درگاه: ${fallbackErr.message}`;
          
        return {
          ok: false,
          status: fIsTimeout ? 504 : 502,
          text: finalErrorMsg,
          data: { error: finalErrorMsg, isTimeout: fIsTimeout, canRetry: true },
          durationMs: (err.durationMs || 0) + (fallbackErr.durationMs || 0)
        };
      }
    }

    // If no fallback supported for this action
    const errorMsg = isTimeout 
      ? 'ارتباط با سرور واسط به دلیل کندی شبکه مقدور نیست.'
      : `خطا در ارتباط با سرور: ${err.message}`;
      
    return {
      ok: false,
      status: isTimeout ? 504 : 502,
      text: errorMsg,
      data: { error: errorMsg, isTimeout, canRetry: true },
      durationMs: err.durationMs || 0
    };
  }
}

