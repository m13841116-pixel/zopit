const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/return str.replace\(\/\[۰-۹\]\/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf\(d\)\);/, "return str.replace(/[۰-۹]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());");
code = code.replace(/function toEngDigits\(str\) {/, "function toEngDigits(str: any): any {");

fs.writeFileSync(file, code);
