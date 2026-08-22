/**
 * Canonical Application Base URL Utility
 * Ensures all payment callbacks and external redirects use the official production domain
 * instead of temporary Vercel preview URLs or intermediate proxy domains.
 */

export function getCanonicalAppUrl(req?: any): string {
  const isProduction =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.NODE_ENV === 'production';

  if (isProduction) {
    const rawUrl = process.env.APP_BASE_URL?.trim();

    if (!rawUrl) {
      throw new Error('APP_BASE_URL is required in production');
    }

    let normalizedUrl = rawUrl;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const url = new URL(normalizedUrl);

    if (url.protocol !== 'https:') {
      throw new Error('APP_BASE_URL must use HTTPS in production');
    }

    if (url.hostname.endsWith('.vercel.app')) {
      throw new Error('APP_BASE_URL must not be a Vercel domain in production');
    }

    return url.toString().replace(/\/+$/, '');
  }

  // Non-production (local development/testing):
  if (process.env.APP_BASE_URL && process.env.APP_BASE_URL.trim()) {
    let url = process.env.APP_BASE_URL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
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

  // Default fallback for local development
  return 'http://localhost:3000';
}

