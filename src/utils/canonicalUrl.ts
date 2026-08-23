/**
 * Canonical Application Base URL Utility
 * Ensures all payment callbacks and external redirects use the official production domain
 * instead of temporary Vercel preview URLs or intermediate proxy domains.
 */

export function getCanonicalAppUrl(req?: any): string {
  const rawUrl = process.env.APP_BASE_URL?.trim();

  if (rawUrl) {
    let normalizedUrl = rawUrl;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    return normalizedUrl.replace(/\/+$/, '');
  }

  if (req && req.headers) {
    const forwardedHost = req.headers['x-forwarded-host'];
    const host = (forwardedHost ? String(forwardedHost).split(',')[0].trim() : (req.headers.host || '')).trim();
    
    if (host) {
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : (isLocal ? 'http' : 'https'));
      return `${protocol}://${host}`.replace(/\/+$/, '');
    }
  }

  if (process.env.VERCEL_URL) {
    const vUrl = process.env.VERCEL_URL.trim();
    if (vUrl) {
      return `https://${vUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
    }
  }

  // Official production domain fallback
  return 'https://www.zopit.ir';
}

