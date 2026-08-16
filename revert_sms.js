const fs = require('fs');
const content = fs.readFileSync('src/services/sms/SmsService.ts', 'utf8');
const newContent = content.replace(
  /const proxyResult = await executeProxyRequest\(payload, \{[\s\S]*?timeoutMs: 15000[\s\S]*?\}\);\s*const proxyData: any = proxyResult\.data \|\| \{\};\s*const isProxySuccess = proxyResult\.ok && \(/g,
  `const proxyResponse = await fetch('https://bankkalaha.ir/sms-proxy.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'ZopitSMS2026Key'
        },
        body: JSON.stringify(payload)
      });
      const proxyData: any = await proxyResponse.json().catch(() => ({}));
      const isProxySuccess = proxyResponse.ok && (`
);
const finalContent = newContent.replace(
  /const proxyResult = await executeProxyRequest\(payload, \{[\s\S]*?timeoutMs: 15000[\s\S]*?\}\);\s*const proxyData: any = proxyResult\.data \|\| \{\};\s*if \(proxyResult\.ok && \(proxyData\.success/g,
  `const proxyResponse = await fetch('https://bankkalaha.ir/sms-proxy.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'ZopitSMS2026Key'
        },
        body: JSON.stringify(payload)
      });
      const proxyData: any = await proxyResponse.json().catch(() => ({}));
      if (proxyResponse.ok && (proxyData.success`
);

const finalContent2 = finalContent.replace(
  "import { executeProxyRequest } from '../payment/proxyClient.js';\n",
  ""
);

fs.writeFileSync('src/services/sms/SmsService.ts', finalContent2);
