/**
 * Client-Side Payment Bridge for Zibal & Iranian Banking Networks
 * Seamlessly handles payment generation directly from Iranian clients/browsers
 * when serverless environments (e.g., Vercel) face IP or network restrictions.
 */

export interface ClientPaymentRequestOptions {
  invoiceId: number;
  amountInRials: number;
  merchant?: string;
  callbackUrl?: string;
  description?: string;
  orderId?: string | number;
}

export interface ClientPaymentResult {
  success: boolean;
  payLink?: string;
  trackId?: string;
  error?: string;
}

const DEFAULT_PROXY_SECRET = "ZopitSec_9f84b13a7c6e25d0e81f72ac39014b";
const DEFAULT_ZIBAL_MERCHANT = "6a0213e61b27742a09938588";

const PROXY_CANDIDATES = [
  "https://bankkalaha.ir/zibal-proxy.php",
  "http://bankkalaha.ir/zibal-proxy.php",
  "https://www.bankkalaha.ir/zibal-proxy.php",
  "http://www.bankkalaha.ir/zibal-proxy.php",
];

export async function requestClientSideZibalPayment(
  options: ClientPaymentRequestOptions
): Promise<ClientPaymentResult> {
  const { invoiceId, amountInRials, description, orderId } = options;
  const merchant = options.merchant || DEFAULT_ZIBAL_MERCHANT;
  const baseUrl = window.location.origin;
  const callbackUrl =
    options.callbackUrl ||
    `${baseUrl}/api/public/store-invoice/callback?invoiceId=${invoiceId}`;
  const paymentDesc =
    description || `تسویه فاکتور فروشگاه #${invoiceId} در سامانه زوپیت`;

  let lastError = "خطا در ارتباط با سرور پرداخت";

  // 1. Try Iranian Proxy endpoints first (from user's browser in Iran)
  for (const proxyUrl of PROXY_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Proxy-Secret-Key": DEFAULT_PROXY_SECRET,
        },
        body: JSON.stringify({
          action: "request",
          merchant,
          amount: amountInRials,
          callbackUrl,
          description: paymentDesc,
          orderId: orderId || String(invoiceId),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data && (Number(data.result) === 100 || data.trackId || data.success)) {
          const trackId = String(data.trackId || data.authority);
          const payLink =
            data.payLink || `https://gateway.zibal.ir/start/${trackId}/direct`;

          // Attach trackId to the invoice in the backend
          await attachTrackIdToInvoice(invoiceId, trackId);

          return {
            success: true,
            payLink,
            trackId,
          };
        } else if (data && data.message) {
          lastError = data.message;
        }
      }
    } catch (err: any) {
      console.warn(`[ClientPaymentBridge] Proxy ${proxyUrl} attempt failed:`, err.message);
      lastError = err.message;
    }
  }

  // 2. Try Direct Zibal endpoint (client's browser has Iranian IP)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const directRes = await fetch("https://gateway.zibal.ir/v1/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant,
        amount: amountInRials,
        callbackUrl,
        description: paymentDesc,
        orderId: orderId || String(invoiceId),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (directRes.ok) {
      const data = await directRes.json().catch(() => null);
      if (data && Number(data.result) === 100 && data.trackId) {
        const trackId = String(data.trackId);
        const payLink = `https://gateway.zibal.ir/start/${trackId}/direct`;

        // Attach trackId to the invoice in the backend
        await attachTrackIdToInvoice(invoiceId, trackId);

        return {
          success: true,
          payLink,
          trackId,
        };
      } else if (data && data.message) {
        lastError = data.message;
      }
    }
  } catch (directErr: any) {
    console.warn("[ClientPaymentBridge] Direct Zibal attempt failed:", directErr.message);
    lastError = directErr.message;
  }

  return {
    success: false,
    error: lastError,
  };
}

async function attachTrackIdToInvoice(invoiceId: number, trackId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("token") || "";
    await fetch(`/api/public/store-invoice/${invoiceId}/attach-track-id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ trackId }),
    });
    return true;
  } catch (err) {
    console.error("[ClientPaymentBridge] Failed to attach trackId to invoice:", err);
    return false;
  }
}
