/**
 * Next.js Pages Router API Route for Payment Callback & Verification
 * Endpoint: GET /api/payment/callback
 */
export default async function handler(req: any, res: any) {
  const { trackId, authority, success, status, orderId } = req.query || {};
  const currentTrackId = (trackId || authority) as string;
  const successStatus = (success || status) as string;

  const proxyUrl = process.env.PAYMENT_PROXY_URL;
  const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY;
  const merchantId = process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT || '6a0213e61b27742a09938588';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const redirectBase = appUrl.replace(/\/$/, '');

  if (!currentTrackId) {
    return res.redirect(`${redirectBase}/payment-result?status=failed&message=${encodeURIComponent('شناسه تراکنش دریافت نشد')}`);
  }

  if (successStatus === '0' || successStatus === 'false') {
    return res.redirect(`${redirectBase}/payment-result?status=failed&trackId=${currentTrackId}&orderId=${orderId || ''}`);
  }

  try {
    if (!proxyUrl || !proxySecret) {
      throw new Error('تنظیمات پروکسی پرداخت (PAYMENT_PROXY_URL یا SECRET_KEY) یافت نشد.');
    }

    const verifyEndpoint = proxyUrl.endsWith('/verify') ? proxyUrl : `${proxyUrl.replace(/\/$/, '')}/verify`;

    const verifyResponse = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': proxySecret,
      },
      body: JSON.stringify({
        merchant: merchantId,
        trackId: currentTrackId,
        action: 'verify',
        orderId,
      }),
    });

    const verifyData = await verifyResponse.json();
    const resCode = Number(verifyData.result);

    if (verifyData.success || resCode === 100 || resCode === 201) {
      const refNumber = verifyData.refNumber || verifyData.refId || currentTrackId;
      return res.redirect(`${redirectBase}/payment-result?status=success&trackId=${currentTrackId}&refId=${refNumber}&orderId=${orderId || ''}`);
    } else {
      return res.redirect(`${redirectBase}/payment-result?status=failed&trackId=${currentTrackId}&message=${encodeURIComponent(verifyData.message || 'پرداخت ناموفق بود')}`);
    }
  } catch (error: any) {
    console.error('Payment Callback Pages API Error:', error);
    return res.redirect(`${redirectBase}/payment-result?status=error&message=${encodeURIComponent(error.message || 'خطا در تایید تراکنش')}`);
  }
}
