const fs = require('fs');
let code = fs.readFileSync('src/services/payment/ZibalService.ts', 'utf8');

const target1 = `      // 1. If Proxy settings are configured, route request through the Proxy server
      if (proxyUrl && proxySecret) {
        const endpoint = proxyUrl.endsWith('/request') ? proxyUrl : \`\${proxyUrl.replace(/\\/$/, '')}/request\`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': proxySecret,
          },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            amount: Number(amount),
            callbackUrl,
            description,
          }),
        });`;

const replacement1 = `      // 1. If Proxy settings are configured, route request through the Proxy server
      if (proxyUrl && proxySecret) {
        const endpoint = proxyUrl; // Do not append /request
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': proxySecret,
          },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            amount: Number(amount),
            callbackUrl,
            description,
            action: 'request',
          }),
        });`;

code = code.replace(target1, replacement1);

const target2 = `      // 1. Verify via Payment Proxy if configured
      if (proxyUrl && proxySecret) {
        const endpoint = proxyUrl.endsWith('/verify') ? proxyUrl : \`\${proxyUrl.replace(/\\/$/, '')}/verify\`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': proxySecret,
          },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            trackId: authority,
            action: 'verify',
          }),
        });`;

const replacement2 = `      // 1. Verify via Payment Proxy if configured
      if (proxyUrl && proxySecret) {
        const endpoint = proxyUrl; // Do not append /verify
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': proxySecret,
          },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            trackId: authority,
            action: 'verify',
          }),
        });`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/services/payment/ZibalService.ts', code, 'utf8');
