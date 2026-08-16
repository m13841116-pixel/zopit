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
 * Highly robust HTTP/HTTPS client specifically optimized for Vercel (AWS Lambda) environments.
 * It bypasses fetch/undici DNS resolution issues by explicitly using family: 4 (IPv4),
 * ensuring that requests to Iranian servers that drop IPv6 packets do not hang or timeout.
 */
export function executeProxyRequest(
  payload: any,
  options: {
    proxyUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
  } = {}
): Promise<ProxyResponse> {
  return new Promise((resolve, reject) => {
    const proxyUrl = options.proxyUrl || process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
    const apiKey = options.apiKey || process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
    const timeoutMs = options.timeoutMs || 15000;

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(proxyUrl);
    } catch (e) {
      return reject(new Error('آدرس پروکسی نامعتبر است'));
    }

    const isHttps = parsedUrl.protocol === 'https:';

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Api-Key': apiKey,
        'User-Agent': 'Zopit-Vercel-Client/2.0',
        'Content-Length': Buffer.byteLength(payloadString)
      },
      timeout: timeoutMs,
      family: 4, // FORCE IPv4 to prevent Vercel/AWS IPv6 DNS timeout issues
      rejectUnauthorized: false // Skip strict SSL checks for proxy connections
    };

    const client = isHttps ? https : http;

    const req = client.request(requestOptions, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        let data: any;
        try {
          if (responseBody) data = JSON.parse(responseBody);
        } catch (e) {}
        
        resolve({
          ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
          status: res.statusCode || 500,
          text: responseBody,
          data
        });
      });
    });

    req.on('error', (err: any) => {
      console.warn(`[ProxyClient] connection failed:`, err.message);
      reject(new Error(`ارتباط با سرور واسط ایران برقرار نشد: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('پاسخی از سرور واسط دریافت نشد (Timeout)'));
    });

    req.write(payloadString);
    req.end();
  });
}
