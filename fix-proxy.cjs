const fs = require('fs');
const file = 'src/services/payment/proxyClient.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the entire Attempt 1 and Attempt 2 with just the direct connection
code = code.replace(/\/\/ Attempt 1 \(Proxy\).*?return directRes;\n  \} catch \(directErr: any\) \{/s, `// Attempt: Direct Gateway Connection to Zibal (Proxy completely bypassed for speed)
  try {
    const directRes = await makeNodeRequest(directZibalUrl, payloadString, null, 8000);
    if (directRes.data && (directRes.data.result !== undefined || directRes.data.trackId !== undefined || directRes.data.success !== undefined)) {
      await PaymentLogger.logPaymentEvent({
        requestId: reqId,
        gateway: options.gateway || 'ZIBAL',
        action: options.action || 'UNKNOWN',
        status: 'SUCCESS_DIRECT',
        targetUrl: directZibalUrl,
        httpStatus: directRes.status,
        durationMs: directRes.durationMs,
        requestBody: logRequestBody,
        responseBody: directRes.text,
        orderId: options.orderId,
        userId: options.userId
      });
      return directRes;
    }

    return directRes;
  } catch (directErr: any) {`);
fs.writeFileSync(file, code);
