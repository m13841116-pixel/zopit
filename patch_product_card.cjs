const fs = require('fs');

let code = fs.readFileSync('src/components/Explore.tsx', 'utf-8');

// We need to add Trust Badges to the Product Cards in Explore
const trustBadges = `
                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {current.supplierInfo?.fulfillmentRate >= 95 && (
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5" title="نرخ تأمین موفق بالای ۹۵٪">
                              <Sparkles className="w-3 h-3" /> طلایی
                            </span>
                          )}
                          {current.supplierInfo?.avgProcessingTimeHours <= 24 && (
                            <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5" title="ارسال سریع (زیر ۲۴ ساعت)">
                              <Zap className="w-3 h-3" /> سریع
                            </span>
                          )}
                        </div>
`;

code = code.replace(
  `{current.storeName || "مدیر فروشگاه"}
                          </span>`,
  `{current.storeName || "مدیر فروشگاه"}
                          </span>
                          ${trustBadges}`
);

// We need to make sure Zap is imported
if (!code.includes('Zap,')) {
  code = code.replace(/Sparkles,/, 'Sparkles, Zap,');
}

fs.writeFileSync('src/components/Explore.tsx', code);
console.log('Patched Explore.tsx successfully');
