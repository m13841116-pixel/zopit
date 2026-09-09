const fs = require('fs');
let content = fs.readFileSync('src/components/store-manager/StoreManagerDashboard.tsx', 'utf8');

const target = `{/* Quick Shortcuts */}`;

const topSellersSection = `
                  {/* Better Sellers Section (فروشندگان برتر و بالاتر از میانگین) */}
                  <div className="bg-gradient-to-br from-card to-background p-6 md:p-8 rounded-3xl border border-subtle shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-subtle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                          <Crown className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-primary flex items-center gap-2">
                            <span>فروشندگان برتر شبکه (بالاتر از میانگین فروش)</span>
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">Top Sellers</span>
                          </h3>
                          <p className="text-xs text-muted mt-0.5">
                            میانگین فروش شبکه: {stats.averageSales ? stats.averageSales.toLocaleString('fa-IR') : '۰'} تومان
                          </p>
                        </div>
                      </div>
                      <div className="bg-surface px-3 py-1.5 rounded-xl border border-subtle text-xs text-muted flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <span>رتبه‌بندی عملکرد بر اساس مجموع فروش موفق</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.betterSellers && stats.betterSellers.length > 0 ? (
                        stats.betterSellers.map((seller: any, idx: number) => {
                          const isAboveAvg = seller.totalSales >= (stats.averageSales || 0);
                          return (
                            <div
                              key={seller.id || idx}
                              className="p-4 rounded-2xl bg-surface/50 border border-subtle hover:border-amber-500/30 hover:bg-surface transition-all flex items-center justify-between gap-3 relative overflow-hidden group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={\`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs \${
                                  idx === 0 ? "bg-amber-500 text-slate-950 shadow-sm" :
                                  idx === 1 ? "bg-slate-300 text-slate-950" :
                                  idx === 2 ? "bg-amber-700/60 text-white" :
                                  "bg-card text-muted border border-subtle"
                                }\`}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-primary group-hover:text-amber-500 transition-colors">
                                    {seller.name || seller.storeName}
                                  </h4>
                                  <span className="text-[10px] text-muted block mt-0.5">
                                    {seller.orderCount || 0} سفارش ثبت شده
                                  </span>
                                </div>
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                                  {seller.totalSales ? seller.totalSales.toLocaleString('fa-IR') : '۰'}
                                  <span className="text-[9px] font-normal text-muted mr-1">تومان</span>
                                </span>
                                {isAboveAvg && (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                                    + بالاتر از میانگین
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-6 text-center text-xs text-muted">
                          اطلاعات فروشندگان به زودی ثبت خواهد شد.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Shortcuts */}`;

content = content.replace(target, topSellersSection);
if (!content.includes('Crown,')) {
  content = content.replace('Award,', 'Award, Crown,');
}
fs.writeFileSync('src/components/store-manager/StoreManagerDashboard.tsx', content);
