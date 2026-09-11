const fs = require('fs');

let code = fs.readFileSync('src/components/store-manager/ProductModal.tsx', 'utf-8');

const badgesUI = `
            <p className="text-secondary text-sm font-medium leading-relaxed">
              {product.description || product.shortDescription}
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mt-4 bg-surface p-3 rounded-xl border border-subtle">
              <span className="text-xs font-bold text-muted w-full mb-1">امتیازات تأمین‌کننده:</span>
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
                <span className="bg-surface text-secondary text-xs font-bold px-2.5 py-1 rounded-lg border border-subtle flex items-center gap-1">
                  <Clock className="w-4 h-4" /> پردازش: {product.supplierInfo?.avgProcessingTimeHours ? Number(product.supplierInfo.avgProcessingTimeHours).toFixed(1) : 12} ساعت
                </span>
              )}
            </div>
`;

code = code.replace(
  `<p className="text-secondary text-sm font-medium leading-relaxed">
              {product.description || product.shortDescription}
            </p>`,
  badgesUI
);

// We need to import Zap, Sparkles, Clock, CheckCircle
if (!code.includes('Zap')) {
  code = code.replace(/X,/, 'X, Zap, Sparkles, Clock, CheckCircle,');
}

fs.writeFileSync('src/components/store-manager/ProductModal.tsx', code);
console.log('Patched ProductModal.tsx successfully');
