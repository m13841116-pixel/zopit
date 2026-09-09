const fs = require('fs');
let code = fs.readFileSync('src/components/supplier/SupplierDashboard.tsx', 'utf8');

code = code.replace(
  'مشاهده تاریخچه سفارش',
  '📦 ثبت ارسال'
);

code = code.replace(
  'مشاهده تاریخچه و رهگیری',
  '📦 پیگیری ارسال'
);

// We want to add a summary card for ready to ship orders
// It already has a "orders" state. Let's just fix the Tracker button.

fs.writeFileSync('src/components/supplier/SupplierDashboard.tsx', code);

let tracker = fs.readFileSync('src/components/supplier/SupplierOrderTracker.tsx', 'utf8');
tracker = tracker.replace('ثبت نهایی ارسال', '🚚 ارسال شد');
fs.writeFileSync('src/components/supplier/SupplierOrderTracker.tsx', tracker);

console.log('Fixed terminology');
