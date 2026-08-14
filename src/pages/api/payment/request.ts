/**
 * Next.js Pages Router API Route for Payment Request via Zibal Proxy
 * Endpoint: POST /api/payment/request
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { amount, description, orderId, cartItems, customerMobile } = req.body || {};

    const proxyUrl = process.env.PAYMENT_PROXY_URL;
    const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY;
    const merchantId = process.env.ZIBAL_MERCHANT_ID || process.env.ZIBAL_MERCHANT || '6a0213e61b27742a09938588';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (!proxyUrl || !proxySecret) {
      return res.status(500).json({
        success: false,
        error: 'متغیرهای محیطی PAYMENT_PROXY_URL یا PAYMENT_PROXY_SECRET_KEY بر روی سرور تنظیم نشده‌اند.',
      });
    }

    const callbackUrl = `${appUrl.replace(/\/$/, '')}/api/payment/callback?orderId=${orderId || 'DIRECT'}`;
    const requestEndpoint = proxyUrl.endsWith('/request') ? proxyUrl : `${proxyUrl.replace(/\/$/, '')}/request`;

    const proxyResponse = await fetch(requestEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': proxySecret,
      },
      body: JSON.stringify({
        merchant: merchantId,
        amount: Number(amount),
        callbackUrl,
        description: description || `پرداخت سفارش #${orderId || ''}`,
        orderId,
        cartItems,
        customerMobile,
      }),
    });

    const data = await proxyResponse.json();

    if ((data.success || Number(data.result) === 100) && (data.payLink || data.trackId)) {
      const payLink = data.payLink || `https://gateway.zibal.ir/start/${data.trackId}`;
      return res.status(200).json({
        success: true,
        payLink,
        trackId: data.trackId || data.authority,
        message: 'درخواست پرداخت با موفقیت ثبت شد.',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.message || data.error || 'خطا در دریافت پاسخ از پروکسی درگاه زیبال',
      });
    }
  } catch (error: any) {
    console.error('Payment Request Pages API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'خطای داخلی سرور هنگام ثبت درخواست پرداخت',
    });
  }
}
