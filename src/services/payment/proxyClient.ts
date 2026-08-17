import https from 'https';
import http from 'http';
import { URL } from 'url';

export interface ProxyResponse {
  ok: boolean;
  status: number;
  text: string;
  data?: any;
}

function makeNodeRequest(urlStr: string, payloadString: string, apiKey: string, timeoutMs: number): Promise<ProxyResponse> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Length': Buffer.byteLength(payloadString),
        },
        timeout: timeoutMs,
        rejectUnauthorized: false,
        family: 4, // CRITICAL FOR VERCEL & AWS LAMBDA: Forces IPv4 socket connection
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
 * Highly robust HTTP/HTTPS client specifically optimized for Vercel (AWS Lambda) & Node.js environments.
 * It strictly enforces IPv4 (family: 4) using Node's https module as the PRIMARY strategy to prevent
 * Vercel AWS instances from hanging/timing out when connecting to Iranian servers that drop IPv6 packets.
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
  const apiKey = options.apiKey || process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
  const timeoutMs = options.timeoutMs || 12000;
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Always append ?key= so that even if Apache / LiteSpeed strips custom headers, the key is passed
  const targetUrl = baseProxyUrl.includes('key=') 
    ? baseProxyUrl 
    : `${baseProxyUrl}${baseProxyUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;

  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || !!process.env.NOW_BUILDER;
  const corsProxyPrefix = process.env.PAYMENT_CORS_PROXY || 'https://corsproxy.io/?';

  // On Vercel, to prevent the 10s AWS network drops from Mizbanfa firewall, we immediately route through CORS proxy.
  // In other environments, we try direct connection first, falling back to CORS proxy if it fails.
  const proxyUrl = isVercel ? `${corsProxyPrefix}${targetUrl}` : targetUrl;

  console.log(`[ProxyClient] Environment: ${isVercel ? 'Vercel' : 'Standard'}. Routing via: ${proxyUrl}`);

  // Strategy 1: Node.js https request with family: 4 (CRITICAL for Vercel / Cloud Run -> Iran)
  try {
    const res = await makeNodeRequest(proxyUrl, payloadString, apiKey, Math.max(timeoutMs, 10000));
    if (res.ok || (res.data && (res.data.result !== undefined || res.data.trackId !== undefined || res.data.payLink !== undefined))) {
      return res;
    }
  } catch (err: any) {
    console.warn(`[ProxyClient] Strategy 1 (IPv4 HTTPS) error, trying Strategy 2...`, err.message);
  }

  // Strategy 2: Node.js http request fallback with family: 4 (In case LiteSpeed SSL handshake hangs)
  try {
    const httpProxyUrl = proxyUrl.replace('https://', 'http://');
    const res = await makeNodeRequest(httpProxyUrl, payloadString, apiKey, 8000);
    if (res.ok || (res.data && (res.data.result !== undefined || res.data.trackId !== undefined || res.data.payLink !== undefined))) {
      return res;
    }
  } catch (err: any) {
    console.warn(`[ProxyClient] Strategy 2 (IPv4 HTTP) error, trying Strategy 3...`, err.message);
  }

  // If we are NOT on Vercel and direct connections failed, try one last time WITH CORS proxy!
  if (!isVercel) {
    const backupUrl = `${corsProxyPrefix}${targetUrl}`;
    console.log(`[ProxyClient] Fallback to CORS Proxy in Standard Environment: ${backupUrl}`);
    try {
      const res = await makeNodeRequest(backupUrl, payloadString, apiKey, 8000);
      if (res.ok || (res.data && (res.data.result !== undefined || res.data.trackId !== undefined || res.data.payLink !== undefined))) {
        return res;
      }
    } catch (err: any) {
      console.warn(`[ProxyClient] Backup CORS Proxy error:`, err.message);
    }
  }

  // Strategy 3: Native fetch as ultimate fallback
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Api-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: payloadString,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const responseText = await response.text();
    let data: any;
    try {
      if (responseText) data = JSON.parse(responseText);
    } catch (e) {}

    return {
      ok: response.ok,
      status: response.status,
      text: responseText,
      data: data || null,
    };
  } catch (fetchErr: any) {
    const isAbort = fetchErr.name === 'AbortError' || fetchErr.message?.includes('aborted');
    const errMsg = isAbort 
      ? 'زمان پاسخگویی سرور واسط ایران (bankkalaha.ir) به پایان رسید (Timeout). لطفاً مجدداً تلاش کنید.'
      : fetchErr.message;
    return {
      ok: false,
      status: 500,
      text: errMsg,
      data: { error: errMsg },
    };
  }
}


