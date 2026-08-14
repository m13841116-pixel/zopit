import { prisma } from '../../../../prisma';

/**
 * Next.js App Router API Route for Payment Request via Zibal Proxy
 * Endpoint: POST /api/payment/request
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      amount,
      description,
      orderId: inputOrderId,
      storeId,
      customerName,
      customerPhone,
      customerAddress,
    } = body;

    const proxyUrl = process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
    const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
    const merchantId = process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588';
    const appUrl = process.env.APP_URL || 'https://www.zopit.ir';

    if (!proxyUrl || !proxySecret) {
      return Response.json(
        {
          success: false,
          error: 'متغیرهای محیطی PAYMENT_PROXY_URL یا PAYMENT_PROXY_SECRET_KEY بر روی سرور تنظیم نشده‌اند.',
        },
        { status: 500 }
      );
    }

    // 1. Create a new Order in Prisma database with status PENDING (or update existing)
    let order: any = null;
    if (inputOrderId) {
      const parsedId = Number(inputOrderId);
      if (!isNaN(parsedId)) {
        order = await prisma.order.findUnique({ where: { id: parsedId } }).catch(() => null);
        if (order) {
          order = await prisma.order.update({
            where: { id: parsedId },
            data: {
              status: 'PENDING',
              ...(amount ? { totalAmount: Number(amount) } : {}),
            },
          }).catch(() => order);
        }
      }
    }

    if (!order) {
      order = await prisma.order.create({
        data: {
          totalAmount: Number(amount || 0),
          status: 'PENDING',
          storeId: storeId ? Number(storeId) : undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          customerAddress: customerAddress || undefined,
        },
      });
    }

    const callbackUrl = `${appUrl.replace(/\/$/, '')}/api/payment/callback?orderId=${order.id}`;

    // 2. Send POST request to PAYMENT_PROXY_URL with header X-Api-Key
    const proxyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': proxySecret,
      },
      body: JSON.stringify({
        action: 'request',
        merchant: merchantId,
        amount: Number(amount || order.totalAmount),
        orderId: order.id,
        callbackUrl,
        description: description || `پرداخت سفارش #${order.id}`,
      }),
    });

    const data = await proxyResponse.json();
    const trackId = data.trackId || data.authority;

    // 3. If success and trackId received, prepare redirect URL
    if ((data.success || Number(data.result) === 100) && trackId) {
      const redirectGatewayUrl = `https://gateway.zibal.ir/start/${trackId}`;

      const acceptHeader = request.headers.get('accept') || '';
      if (acceptHeader.includes('text/html')) {
        return Response.redirect(redirectGatewayUrl, 302);
      }

      return Response.json({
        success: true,
        trackId,
        orderId: order.id,
        payLink: redirectGatewayUrl,
        redirectUrl: redirectGatewayUrl,
        message: 'درخواست پرداخت با موفقیت ثبت شد.',
      });
    } else {
      return Response.json(
        {
          success: false,
          error: data.message || data.error || 'خطا در دریافت پاسخ از پروکسی درگاه زیبال',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Payment Request Error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'خطای داخلی سرور هنگام ثبت درخواست پرداخت',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get('amount') || '10000';
  const orderId = searchParams.get('orderId');

  const proxyUrl = process.env.PAYMENT_PROXY_URL || 'https://bankkalaha.ir/zibal-proxy.php';
  const proxySecret = process.env.PAYMENT_PROXY_SECRET_KEY || 'ZopitPay2026Key';
  const merchantId = process.env.ZIBAL_MERCHANT_ID || '6a0213e61b27742a09938588';
  const appUrl = process.env.APP_URL || 'https://www.zopit.ir';

  if (!proxyUrl || !proxySecret) {
    return Response.redirect(
      `${appUrl.replace(/\/$/, '')}/checkout/failed?message=${encodeURIComponent('تنظیمات پروکسی پرداخت انجام نشده است')}`,
      302
    );
  }

  try {
    let order: any = null;
    if (orderId) {
      const parsedId = Number(orderId);
      if (!isNaN(parsedId)) {
        order = await prisma.order.findUnique({ where: { id: parsedId } }).catch(() => null);
        if (order) {
          order = await prisma.order.update({
            where: { id: parsedId },
            data: { status: 'PENDING' },
          }).catch(() => order);
        }
      }
    }

    if (!order) {
      order = await prisma.order.create({
        data: {
          totalAmount: Number(amount),
          status: 'PENDING',
        },
      });
    }

    const callbackUrl = `${appUrl.replace(/\/$/, '')}/api/payment/callback?orderId=${order.id}`;

    const proxyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': proxySecret,
      },
      body: JSON.stringify({
        action: 'request',
        merchant: merchantId,
        amount: Number(amount),
        orderId: order.id,
        callbackUrl,
      }),
    });

    const data = await proxyResponse.json();
    const trackId = data.trackId || data.authority;

    if ((data.success || Number(data.result) === 100) && trackId) {
      return Response.redirect(`https://gateway.zibal.ir/start/${trackId}`, 302);
    } else {
      return Response.redirect(
        `${appUrl.replace(/\/$/, '')}/checkout/failed?orderId=${order.id}&message=${encodeURIComponent(data.message || 'درخواست درگاه ناموفق بود')}`,
        302
      );
    }
  } catch (err: any) {
    return Response.redirect(
      `${appUrl.replace(/\/$/, '')}/checkout/failed?message=${encodeURIComponent(err.message || 'خطای سرور')}`,
      302
    );
  }
}

