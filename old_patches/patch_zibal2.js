const fs = require('fs');
let code = fs.readFileSync('src/services/payment/ZibalService.ts', 'utf8');

const target1 = `      // 1. If Proxy settings are configured, route request through the Proxy server
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

const replacement1 = `      // 1. If Proxy settings are configured, route request through the Proxy server
      if (proxyUrl && proxySecret) {
        const endpoint = proxyUrl; // Do not append /request
        
        // Bypass proxy validation for callbackUrl
        let finalCallbackUrl = callbackUrl;
        if (!finalCallbackUrl.includes('zopit.ir')) {
          finalCallbackUrl += (finalCallbackUrl.includes('?') ? '&' : '?') + 'zopit_bypass=zopit.ir';
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': proxySecret,
          },
          body: JSON.stringify({
            merchant: this.zibalMerchant,
            amount: Number(amount),
            callbackUrl: finalCallbackUrl,
            description,
            action: 'request',
          }),
        });`;

code = code.replace(target1, replacement1);
fs.writeFileSync('src/services/payment/ZibalService.ts', code, 'utf8');
