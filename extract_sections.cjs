const fs = require('fs');
const code = fs.readFileSync('src/components/supplier/SupplierAddProduct.tsx', 'utf8');

const s1Start = code.indexOf('{/* Step 1: Basic Info */}');
const s2Start = code.indexOf('{/* Step 2: Price & Inventory */}');
const s3Start = code.indexOf('{/* Step 3: Variants */}');
const s4Start = code.indexOf('{/* Step 4: Media */}');
const s5Start = code.indexOf('{/* Live Marketplace Card Preview Section */}');
const s5End = code.indexOf('{/* Footer Controls */}');
const modalsStart = code.indexOf('{/* WooCommerce Import Modal */}');

const s1 = code.substring(s1Start, s2Start);
const s2 = code.substring(s2Start, s3Start);
const s3 = code.substring(s3Start, s4Start);
const s4 = code.substring(s4Start, s5Start);
const s5 = code.substring(s5Start, s5End - 13); // subtract to omit the closing div if needed, or we just keep it

const modals = code.substring(modalsStart);
const header = code.substring(code.indexOf('<div className="bg-background border-b border-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">'), s1Start - 40);

fs.writeFileSync('/tmp/s1.txt', s1);
fs.writeFileSync('/tmp/s2.txt', s2);
fs.writeFileSync('/tmp/s3.txt', s3);
fs.writeFileSync('/tmp/s4.txt', s4);
fs.writeFileSync('/tmp/s5.txt', s5);
fs.writeFileSync('/tmp/modals.txt', modals);
fs.writeFileSync('/tmp/header.txt', header);
console.log('Extracted sections correctly');
