const fs = require('fs');
const file = 'src/services/payment/proxyClient.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /if \(\!res\.ok && res\.status >= 500\) \{/g,
  `if (!res.ok) {
      console.error(\`[ProxyClient Error] Proxy request failed. Status: \${res.status}, URL: \${baseProxyUrl}\`);
      console.error(\`[ProxyClient Error Response]: \${res.text}\`);
    }
    if (!res.ok && res.status >= 500) {`
);

code = code.replace(
  /const errorMsg = isTimeout/g,
  `console.error(\`[ProxyClient Network Error] Code: \${errorCode}, Message: \${err.message}\`);
    const errorMsg = isTimeout`
);

fs.writeFileSync(file, code);
