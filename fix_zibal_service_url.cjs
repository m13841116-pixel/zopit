const fs = require('fs');
const file = 'src/services/payment/ZibalService.ts';
let code = fs.readFileSync(file, 'utf8');

const appBaseUrlFallback = "process.env.APP_BASE_URL || 'https://zopit.ir'";

code = code.replace(
  /'https:\/\/zopit\.ir'/g,
  appBaseUrlFallback
);

code = code.replace(
  /`https:\/\/zopit\.ir\$\{urlObj\.pathname\}\$\{urlObj\.search\}`/g,
  `\`\${process.env.APP_BASE_URL || 'https://zopit.ir'}\${urlObj.pathname}\${urlObj.search}\``
);

fs.writeFileSync(file, code);
