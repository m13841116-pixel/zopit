import https from 'https';
import http from 'http';
import { URL } from 'url';

export interface ProxyResponse {
  ok: boolean;
  status: number;
  text: string;
  data?: any;
}

/**
 * Highly robust HTTP/HTTPS client specifically optimized for Vercel (AWS Lambda) & Node.js environments.
 * Uses native fetch with AbortController for fast execution within Vercel's 10s serverless timeout,
 * with fallback to Node https module.
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
  const timeoutMs = options.timeoutMs || 6000;
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Always append ?key= so that even if Apache / LiteSpeed strips custom headers, the key is passed
  const proxyUrl = baseProxyUrl.includes('key=') 
    ? baseProxyUrl 
    : `${baseProxyUrl}${baseProxyUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;

  // Strategy 1: Primary fast fetch (works natively in Node 18+, Vercel Serverless Functions)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Api-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'curl/7.88.1',
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

    if (response.ok || data) {
      return {
        ok: response.ok,
        status: response.status,
        text: responseText,
        data,
      };
    }
    console.warn(`[ProxyClient] Fetch returned status ${response.status}: ${responseText.slice(0, 200)}`);
  } catch (fetchErr: any) {
    console.warn(`[ProxyClient] Fetch attempt failed: ${fetchErr.message}`);
  }

  // Strategy 2: Node.js https fallback
  try {
    const { default: https } = await import('https');
    const { default: http } = await import('http');
    const { URL } = await import('url');

    const parsedUrl = new URL(proxyUrl);
    const isHttps = parsedUrl.protocol === 'https:';

    return await new Promise<ProxyResponse>((resolve, reject) => {
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'curl/7.88.1',
          'Content-Length': Buffer.byteLength(payloadString),
        },
        timeout: Math.min(timeoutMs, 5000),
        rejectUnauthorized: false,
      };

      const client = isHttps ? https : http;
      const req = client.request(requestOptions, (res) => {
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
    });
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      text: err.message,
      data: { error: err.message },
    };
  }
}

