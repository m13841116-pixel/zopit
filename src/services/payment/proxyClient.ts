export interface ProxyResponse {
  ok: boolean;
  status: number;
  text: string;
  data?: any;
}

/**
 * Standard fetch-based proxy client with automatic Vercel Geoblock bypass.
 * Vercel AWS IPs are frequently blocked by Iranian hosts (like MizbanFa).
 * If on Vercel, this client automatically routes through a global proxy first.
 */
export async function executeProxyRequest(
  payload: any,
  options: {
    proxyUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
  } = {}
): Promise<ProxyResponse> {
  const targetUrl = options.proxyUrl || process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
  const apiKey = options.apiKey || process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
  
  // Keep timeouts short so Vercel doesn't kill the function before we can fallback
  const timeoutMs = options.timeoutMs || 4500;

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
  
  // If on Vercel, prioritize the cors proxy to bypass the firewall.
  // Otherwise try direct first.
  let urlsToTry = [targetUrl, `https://proxy.cors.sh/${targetUrl}`];
  if (isVercel) {
    urlsToTry = [`https://proxy.cors.sh/${targetUrl}`, targetUrl];
  }

  let lastError: any;

  for (let i = 0; i < urlsToTry.length; i++) {
    const url = urlsToTry[i];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': apiKey,
          'User-Agent': 'Zopit-Vercel-Client/3.0'
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text().catch(() => '');
      let data: any = undefined;
      try {
        if (text) data = JSON.parse(text);
      } catch (err) {}

      // cors.sh returns 500/502 if the target is unreachable or times out,
      // but it will have CORS headers. If it's a proxy error and we have another URL, we might want to fallback.
      // But if it succeeded (status 200), return it!
      if (response.ok || (data && (data.result !== undefined || data.success !== undefined))) {
        return {
          ok: response.ok,
          status: response.status,
          text,
          data
        };
      } else {
        // If it's not OK and we have another URL to try, we throw to trigger the catch block fallback
        if (i < urlsToTry.length - 1) {
          throw new Error(`Proxy returned status ${response.status}`);
        }
        
        return {
          ok: response.ok,
          status: response.status,
          text,
          data
        };
      }

    } catch (err: any) {
      console.warn(`[ProxyClient] Fetch failed for ${url}:`, err.message);
      lastError = err;
      // loop continues to next URL
    }
  }

  throw new Error(`پاسخی از سرور واسط دریافت نشد. دلیل: مسدود بودن IP سرور. (${lastError?.message})`);
}
