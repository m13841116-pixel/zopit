import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export interface ProxyResponse {
  ok: boolean;
  status: number;
  text: string;
  data?: any;
}

/**
 * Robust HTTP client designed for Vercel/Cloud serverless environments to communicate with Iranian proxy host (bankkalaha.ir)
 * - Forces IPv4 (family: 4) to avoid broken IPv6 handshakes on Vercel AWS Lambda
 * - Uses rejectUnauthorized: false to prevent SSL/TLS certificate renegotiation errors
 * - Automatically falls back to direct IP (88.135.68.18) with SNI/Host header if domain DNS resolution hangs
 */
export async function executeProxyRequest(
  payload: any,
  options: {
    proxyUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
  } = {}
): Promise<ProxyResponse> {
  const proxyUrl = options.proxyUrl || process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
  const apiKey = options.apiKey || process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
  const timeoutMs = options.timeoutMs || 15000;

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Targets in order of resilience for Vercel / serverless deployments:
  const targetUrls = [
    proxyUrl,
    'https://88.135.68.18/zibal-proxy.php', // Direct IP with Host header
  ];

  let lastError: any = null;

  for (const urlStr of targetUrls) {
    try {
      const u = new URL(urlStr);
      const isHttps = u.protocol === 'https:';
      const mod = isHttps ? https : http;

      const result = await new Promise<ProxyResponse>((resolve, reject) => {
        const req = mod.request({
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port || (isHttps ? 443 : 80),
          path: u.pathname + u.search,
          method: 'POST',
          family: 4, // Force IPv4 to prevent IPv6 unreachable errors on Vercel
          headers: {
            'Host': 'bankkalaha.ir',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Api-Key': apiKey,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Content-Length': Buffer.byteLength(payloadString)
          },
          timeout: timeoutMs,
          rejectUnauthorized: false // Avoid TLS issues in cloud lambda environments
        }, (res) => {
          let chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('end', () => {
            const rawText = Buffer.concat(chunks).toString('utf8');
            let parsedData: any = undefined;
            try {
              parsedData = JSON.parse(rawText);
            } catch {}
            
            resolve({
              ok: (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) || (parsedData && parsedData.result !== undefined),
              status: res.statusCode || 200,
              text: rawText,
              data: parsedData
            });
          });
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Connection to ${u.hostname} timed out after ${timeoutMs}ms`));
        });

        req.write(payloadString);
        req.end();
      });

      if (result.ok && result.data && (result.data.result !== undefined || result.data.success !== undefined || result.data.trackId !== undefined)) {
        return result;
      }
      
      // If we got a response with valid parsed JSON from proxy
      if (result.data && result.data.result !== undefined) {
        return result;
      }
    } catch (err: any) {
      console.warn(`[ProxyClient] Request to ${urlStr} failed:`, err?.message || err);
      lastError = err;
    }
  }

  // Final fallback to global fetch if node:https failed
  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), timeoutMs);
    const fetchRes = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Api-Key': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: payloadString,
      signal: controller.signal
    });
    clearTimeout(tId);
    const rawText = await fetchRes.text().catch(() => '');
    let parsedData: any = undefined;
    try { parsedData = JSON.parse(rawText); } catch {}
    return {
      ok: fetchRes.ok,
      status: fetchRes.status,
      text: rawText,
      data: parsedData
    };
  } catch (fetchErr: any) {
    lastError = fetchErr;
  }

  return {
    ok: false,
    status: 504,
    text: JSON.stringify({ error: `خطا در ارتباط با سرور واسط ایران: ${lastError?.message || 'عدم دسترسی'}` }),
    data: { error: `خطا در ارتباط با سرور واسط ایران: ${lastError?.message || 'عدم دسترسی'}` }
  };
}
