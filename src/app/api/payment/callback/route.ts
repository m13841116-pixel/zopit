import { prisma } from '../../../../prisma';

/**
 * Next.js App Router API Route for Payment Callback & Verification
 * Endpoint: GET/POST /api/payment/callback
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId') || searchParams.get('authority');
  const successStatus = searchParams.get('success') || searchParams.get('status');
  const orderId = searchParams.get('orderId');

  const proxyUrl = process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
  const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
  const merchantId = process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588';
  const appUrl = process.env.APP_URL || 'https://www.zopit.ir';

  const redirectBase = appUrl.replace(/\/$/, '');

  if (!trackId) {
    return Response.redirect(
      `${redirectBase}/checkout/failed?message=${encodeURIComponent('شناسه تراکنش (trackId) دریافت نشد')}`,
      302
    );
  }

  if (successStatus === '0' || successStatus === 'false') {
    return Response.redirect(
      `${redirectBase}/checkout/failed?trackId=${trackId}&orderId=${orderId || ''}&message=${encodeURIComponent('پرداخت توسط کاربر لغو شد یا ناموفق بود')}`,
      302
    );
  }

  try {
    if (!proxyUrl || !proxySecret) {
      throw new Error('متغیرهای محیطی پروکسی پرداخت (PAYMENT_PROXY_URL یا PAYMENT_PROXY_SECRET_KEY) تنظیم نشده‌اند.');
    }

    // Send POST request with header X-Api-Key and action verify to verify transaction
    const verifyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': proxySecret,
      },
      body: JSON.stringify({
        action: 'verify',
        merchant: merchantId,
        trackId: trackId,
      }),
    });

    const verifyData = await verifyResponse.json();
    const resCode = Number(verifyData.result);

    // Check if verification succeeded (result === 100)
    if (verifyData.success || resCode === 100 || resCode === 201) {
      const refNumber = verifyData.refNumber || verifyData.refId || trackId;

      // Update Order status in Prisma database to PAID and save refNumber
      if (orderId) {
        const numericOrderId = Number(orderId);
        if (!isNaN(numericOrderId)) {
          await prisma.order.update({
            where: { id: numericOrderId },
            data: {
              status: 'PAID',
              trackingCode: String(refNumber),
            },
          }).catch((e: any) => console.error('Prisma order update error:', e));
        }
      }

      return Response.redirect(
        `${redirectBase}/checkout/success?trackId=${trackId}&refNumber=${refNumber}&orderId=${orderId || ''}`,
        302
      );
    } else {
      const errorMsg = verifyData.message || verifyData.error || 'تراکنش مورد تایید درگاه قرار نگرفت';
      return Response.redirect(
        `${redirectBase}/checkout/failed?trackId=${trackId}&orderId=${orderId || ''}&message=${encodeURIComponent(errorMsg)}`,
        302
      );
    }
  } catch (error: any) {
    console.error('Payment Callback Verification Error:', error);
    return Response.redirect(
      `${redirectBase}/checkout/failed?trackId=${trackId || ''}&orderId=${orderId || ''}&message=${encodeURIComponent(error.message || 'خطا در تایید نهایی پرداخت')}`,
      302
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  return GET(request);
}

