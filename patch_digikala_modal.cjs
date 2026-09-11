const fs = require('fs');

let code = fs.readFileSync('src/components/DigikalaProductModal.tsx', 'utf-8');

const badgesUI = `
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-full mb-1">امتیازات تأمین‌کننده:</span>
              {product.supplierInfo?.fulfillmentRate >= 95 ? (
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1" title="نرخ تأمین موفق بالای ۹۵٪">
                  <Sparkles className="w-4 h-4" /> تأمین‌کننده طلایی (بالای ۹۵٪ موفقیت)
                </span>
              ) : (
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> نرخ تأمین: {product.supplierInfo?.fulfillmentRate ? Number(product.supplierInfo.fulfillmentRate).toFixed(1) : 100}٪
                </span>
              )}
              {product.supplierInfo?.avgProcessingTimeHours <= 24 ? (
                <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black px-2.5 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1" title="ارسال سریع (زیر ۲۴ ساعت)">
                  <Zap className="w-4 h-4" /> سریع (زیر ۲۴ ساعت)
                </span>
              ) : (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> پردازش: {product.supplierInfo?.avgProcessingTimeHours ? Number(product.supplierInfo.avgProcessingTimeHours).toFixed(1) : 12} ساعت
                </span>
              )}
            </div>

            {/* Pricing Section Container */}
`;

code = code.replace(
  `{/* Pricing Section Container */}`,
  badgesUI
);

// We need to import Zap, Sparkles, Clock
if (!code.includes('Zap')) {
  code = code.replace(/ShoppingCart,/, 'ShoppingCart, Zap, Sparkles, Clock,');
}

fs.writeFileSync('src/components/DigikalaProductModal.tsx', code);
console.log('Patched DigikalaProductModal.tsx successfully');
