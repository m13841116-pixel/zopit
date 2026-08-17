import https from 'https';
import http from 'http';
import { URL } from 'url';

export interface ProxyResponse {
  ok: boolean;
  status: number;
  text: string;
  data?: any;
}

function makeNodeRequest(urlStr: string, payloadString: string, secretKey: string, timeoutMs: number): Promise<ProxyResponse> {
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
        rejectUnauthorized: false, // Allow SSL connection even if intermediate CA is missing in Vercel Node
        family: 4, // CRITICAL FOR VERCEL: Forces IPv4 socket connection
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let data: any;
          try {
            if (body) data = JSON.parse(body);
          } catch (e) {}
          resolve({
            ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
            status: res.statusCode || 500,
            text: body,
            data,
          });
        });
      });

      req.on('error', (err) => reject(new Error(`ارتباط با سرور واسط برقرار نشد: ${err.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('زمان پاسخگویی سرور واسط پایان یافت (Timeout).'));
      });

      req.write(payloadString);
      req.end();
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Optimized HTTP/HTTPS client for Vercel -> Iran Proxy communication.
 * Uses fetch with node fallback and fallback environment variables.
 */
export async function executeProxyRequest(
  payload: any,
  options: {
    proxyUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
  } = {}
): Promise<ProxyResponse> {
  const baseProxyUrl = options.proxyUrl || process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
  const secretKey = options.apiKey || process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
  const timeoutMs = options.timeoutMs || 18000;
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  if (!baseProxyUrl) {
    throw new Error('Fatal: PAYMENT_PROXY_URL is missing in environment variables.');
  }

  // 1. Try global fetch first (Native in Vercel Node 18+)
  if (typeof fetch === 'function') {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const targetUrl = baseProxyUrl.includes('key=') ? baseProxyUrl : `${baseProxyUrl}?key=${encodeURIComponent(secretKey)}`;

      const fetchRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': secretKey,
          'X-Proxy-Secret': secretKey,
          'Authorization': `Bearer ${secretKey}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZopitPaymentProxy/1.0',
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const text = await fetchRes.text();
      let data: any;
      try {
        if (text) data = JSON.parse(text);
      } catch (e) {}

      if (fetchRes.ok || data?.result !== undefined || data?.trackId || data?.payLink || data?.success) {
        return {
          ok: fetchRes.ok,
          status: fetchRes.status,
          text,
          data,
        };
      }
    } catch (fetchErr: any) {
      console.warn(`[ProxyClient Fetch Fallback] fetch failed: ${fetchErr.message}, trying node https request...`);
    }
  }

  // 2. Fallback to node https client
  try {
    const res = await makeNodeRequest(baseProxyUrl, payloadString, secretKey, timeoutMs);
    return res;
  } catch (err: any) {
    console.error(`[ProxyClient Error] Failed request to proxy: ${err.message}`);
    return {
      ok: false,
      status: 500,
      text: err.message,
      data: { error: err.message },
    };
  }
}
