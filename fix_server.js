const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

// Add a helper function at the top
const helper = `
function toEngDigits(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}
`;

code = code.replace(/import express from 'express';/, "import express from 'express';\n" + helper);
code = code.replace(/parseFloat\(supplierBasePrice\)/g, 'parseFloat(toEngDigits(supplierBasePrice))');
code = code.replace(/parseInt\(stock \|\| 0\)/g, 'parseInt(toEngDigits(stock) || 0)');
code = code.replace(/parseFloat\(discount\) \|\| 0/g, 'parseFloat(toEngDigits(discount)) || 0');
code = code.replace(/parseFloat\(v.supplierBasePrice \|\| supplierBasePrice\)/g, 'parseFloat(toEngDigits(v.supplierBasePrice || supplierBasePrice))');
code = code.replace(/parseInt\(v.stock \|\| 0\)/g, 'parseInt(toEngDigits(v.stock) || 0)');

fs.writeFileSync(file, code);
