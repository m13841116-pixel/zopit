const fs = require('fs');

let code = fs.readFileSync('src/components/store-manager/StoreMarketplace.tsx', 'utf-8');

const badgesUI = `
                    <h3 className="font-bold text-primary text-base mb-2 leading-tight group-hover:text-primary-hover transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.supplierInfo?.fulfillmentRate >= 95 && (
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5" title="نرخ تأمین موفق بالای ۹۵٪">
                          <Sparkles className="w-3 h-3" /> طلایی
                        </span>
                      )}
                      {product.supplierInfo?.avgProcessingTimeHours <= 24 && (
                        <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5" title="ارسال سریع (زیر ۲۴ ساعت)">
                          <Zap className="w-3 h-3" /> سریع
                        </span>
                      )}
                    </div>
`;

code = code.replace(
  `<h3 className="font-bold text-primary text-base mb-2 leading-tight group-hover:text-primary-hover transition-colors line-clamp-2">
                      {product.name}
                    </h3>`,
  badgesUI
);

// We need to import Zap, Sparkles
if (!code.includes('Zap')) {
  code = code.replace(/ShoppingCart,/, 'ShoppingCart, Zap, Sparkles,');
}

fs.writeFileSync('src/components/store-manager/StoreMarketplace.tsx', code);
console.log('Patched StoreMarketplace.tsx successfully');
