const fs = require('fs');

let code = fs.readFileSync('src/components/store-manager/StoreMarketplace.tsx', 'utf-8');

const badgesUI = `
                      <span className="text-primary-hover font-bold max-w-full block truncate group-hover:text-primary-default transition-colors" title={product.name}>
                        {product.name}
                      </span>
                      
                      {/* Trust Badges */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.supplierInfo?.fulfillmentRate >= 95 && (
                          <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-1 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5" title="نرخ تأمین موفق بالای ۹۵٪">
                            <Sparkles className="w-2.5 h-2.5" /> طلایی
                          </span>
                        )}
                        {product.supplierInfo?.avgProcessingTimeHours <= 24 && (
                          <span className="bg-blue-500/10 text-blue-500 text-[9px] font-black px-1 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5" title="ارسال سریع (زیر ۲۴ ساعت)">
                            <Zap className="w-2.5 h-2.5" /> سریع
                          </span>
                        )}
                      </div>
`;

code = code.replace(
  `<span className="text-primary-hover font-bold max-w-full block truncate group-hover:text-primary-default transition-colors" title={product.name}>
                        {product.name}
                      </span>`,
  badgesUI
);

// We need to import Zap, Sparkles
if (!code.includes('Zap')) {
  code = code.replace(/ShoppingCart,/, 'ShoppingCart, Zap, Sparkles,');
}

fs.writeFileSync('src/components/store-manager/StoreMarketplace.tsx', code);
console.log('Patched StoreMarketplace.tsx successfully');
