const fs = require('fs');
const file = 'src/services/payment/proxyClient.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Attempt 1: Proxy via Iran intermediary host.*?catch \(proxyErr: any\) \{.*?\}/s;
if (code.match(regex)) {
    code = code.replace(regex, `// Attempt 1 (Proxy) has been bypassed to ensure FAST connection to Zibal directly.
  // Note: The user MUST disable IP restriction in their Zibal panel for this to work.`);
    fs.writeFileSync(file, code);
    console.log("Proxy bypassed successfully!");
} else {
    console.log("Could not find proxy block.");
}
