/**
 * High-Speed Universal Client-Side Payment Bridge for Zibal & Shaparak
 * Dispatches requests via optimized parallel channels (Iranian proxy + direct gateway)
 * for sub-second gateway redirect speeds and 100% uptime resilience.
 */

export interface UniversalPaymentRequestOptions {
  amountInRials: number;
  callbackUrl: string;
  description: string;
  orderId?: string | number;
  invoiceId?: number;
  merchant?: string;
  mobile?: string;
  onTrackIdReceived?: (trackId: string) => Promise<any> | void;
}

export interface UniversalPaymentResult {
  success: boolean;
  payLink?: string;
  trackId?: string;
  error?: string;
}

const DEFAULT_PROXY_SECRET = "ZopitSec_9f84b13a7c6e25d0e81f72ac39014b";
const DEFAULT_ZIBAL_MERCHANT = "6a0213e61b27742a09938588";

const PRIMARY_PROXY_URL = "https://bankkalaha.ir/zibal-proxy.php";
const BACKUP_PROXY_URL = "https://www.bankkalaha.ir/zibal-proxy.php";
const DIRECT_ZIBAL_URL = "https://gateway.zibal.ir/v1/request";

export async function requestClientSideZibalPayment(
  options: UniversalPaymentRequestOptions
): Promise<UniversalPaymentResult> {
  const { amountInRials, description, orderId, invoiceId, mobile } = options;
  const merchant = options.merchant || DEFAULT_ZIBAL_MERCHANT;
  const baseUrl = window.location.origin;
  const callbackUrl =
    options.callbackUrl ||
    (invoiceId
      ? `${baseUrl}/api/public/store-invoice/callback?invoiceId=${invoiceId}`
      : `${baseUrl}/api/public/checkout/callback`);

  const paymentPayload = {
    action: "request",
    merchant,
    amount: amountInRials,
    callbackUrl,
    description: description || "پرداخت آنلاین در سامانه زوپیت",
    ...(orderId ? { orderId: String(orderId) } : invoiceId ? { orderId: String(invoiceId) } : {}),
    ...(mobile ? { mobile } : {}),
  };

  // Helper for proxy request
  const fetchFromProxy = async (url: string, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Proxy-Secret-Key": DEFAULT_PROXY_SECRET,
        },
        body: JSON.stringify(paymentPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && (Number(data.result) === 100 || data.trackId || data.authority || data.success)) {
        const trackId = String(data.trackId || data.authority);
        const payLink = data.payLink || `https://gateway.zibal.ir/start/${trackId}/direct`;
        return { trackId, payLink };
      }
      throw new Error(data?.message || "پاسخ نامعتبر از درگاه");
    } catch (e: any) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  // Helper for direct Zibal request (works directly from Iranian client browsers)
  const fetchFromDirect = async (timeoutMs = 4500) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(DIRECT_ZIBAL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchant,
          amount: amountInRials,
          callbackUrl,
          description: description || "پرداخت آنلاین زوپیت",
          ...(orderId ? { orderId: String(orderId) } : invoiceId ? { orderId: String(invoiceId) } : {}),
          ...(mobile ? { mobile } : {}),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && Number(data.result) === 100 && data.trackId) {
        const trackId = String(data.trackId);
        const payLink = `https://gateway.zibal.ir/start/${trackId}/direct`;
        return { trackId, payLink };
      }
      throw new Error(data?.message || "خطا در استعلام زیبال");
    } catch (e: any) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  // Fast Race Strategy: Fire primary proxy and direct gateway in parallel for instant sub-second response
  try {
    const fastestResult = await Promise.any([
      fetchFromProxy(PRIMARY_PROXY_URL, 3500),
      fetchFromDirect(4000),
      fetchFromProxy(BACKUP_PROXY_URL, 4000),
    ]);

    if (fastestResult && fastestResult.payLink) {
      // If an invoiceId is present, attach trackId to invoice
      if (invoiceId) {
        attachTrackIdToInvoice(invoiceId, fastestResult.trackId).catch(() => {});
      }
      if (options.onTrackIdReceived) {
        try {
          await options.onTrackIdReceived(fastestResult.trackId);
        } catch (_) {}
      }

      return {
        success: true,
        payLink: fastestResult.payLink,
        trackId: fastestResult.trackId,
      };
    }
  } catch (parallelErr: any) {
    console.warn("[ClientPaymentBridge] Parallel race failed, trying single fallback...", parallelErr);
  }

  // Fallback sequential try if parallel failed
  try {
    const fallbackRes = await fetchFromProxy(PRIMARY_PROXY_URL, 6000);
    if (fallbackRes && fallbackRes.payLink) {
      if (invoiceId) {
        attachTrackIdToInvoice(invoiceId, fallbackRes.trackId).catch(() => {});
      }
      if (options.onTrackIdReceived) {
        try {
          await options.onTrackIdReceived(fallbackRes.trackId);
        } catch (_) {}
      }
      return {
        success: true,
        payLink: fallbackRes.payLink,
        trackId: fallbackRes.trackId,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "خطا در اتصال به درگاه پرداخت زیبال",
    };
  }

  return {
    success: false,
    error: "خطا در دریافت لینک پرداخت از درگاه زیبال",
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
