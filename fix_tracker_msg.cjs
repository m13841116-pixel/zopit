const fs = require('fs');
let code = fs.readFileSync('src/components/supplier/SupplierOrderTracker.tsx', 'utf8');

const target = `showNotification(isShipment ? 'مرسوله با موفقیت ثبت ارسال شد.' : 'کد رهگیری بروزرسانی شد.', 'success');`;
const replacement = `showNotification(isShipment ? 'مرسوله با موفقیت ثبت ارسال شد. مبلغ این سفارش به موجودی حساب شما اضافه شد.' : 'کد رهگیری بروزرسانی شد.', 'success');`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/supplier/SupplierOrderTracker.tsx', code);
console.log('Fixed tracker message');
