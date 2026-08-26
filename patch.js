const fs = require('fs');
const path = 'src/services/payment/proxyClient.ts';
let content = fs.readFileSync(path, 'utf-8');

const target = `    } catch (proxyErr: any) {
      proxyErrToLog = proxyErr;
      console.warn(\`[ProxyClient] Attempt failed for \${targetProxyUrl} (\${proxyErr.message})\`);
    }
  }

  // If proxy attempts failed, try direct Zibal as a last resort (5.0s timeout)`;

const replacement = `    } catch (proxyErr: any) {
      console.error(\`[ProxyClient] Attempt failed for \${targetProxyUrl} (\${proxyErr.message})\`);
      return {
        ok: false,
        status: 503,
        text: JSON.stringify({ result: -1, message: 'ارتباط با سرور واسط به دلیل خطا برقرار نشد: ' + proxyErr.message }),
        data: { result: -1, message: 'ارتباط با سرور واسط به دلیل خطا برقرار نشد: ' + proxyErr.message },
        durationMs: Date.now() - startTime
      };
    }
  }

  // If proxy attempts failed, try direct Zibal as a last resort (5.0s timeout)`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log("Patched successfully");
