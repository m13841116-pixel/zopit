const fs = require('fs');
let content = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

// 1. Add activePromotions state
if (!content.includes('activePromotions')) {
  content = content.replace(
    'const [isDiscountApplied, setIsDiscountApplied] = useState<boolean>(false);',
    'const [isDiscountApplied, setIsDiscountApplied] = useState<boolean>(false);\n  const [activePromotions, setActivePromotions] = useState<any[]>([]);'
  );
}

// 2. Add handleApplyDiscountCodeWithCode helper
if (!content.includes('handleApplyDiscountCodeWithCode')) {
  const oldApplyFunc = `  const handleApplyDiscountCode = async () => {\n    const code = discountCodeText.trim().toUpperCase();`;
  const newApplyFunc = `  const handleApplyDiscountCode = () => handleApplyDiscountCodeWithCode();\n  const handleApplyDiscountCodeWithCode = async (overrideCode?: string) => {\n    const code = (overrideCode || discountCodeText).trim().toUpperCase();\n    if (overrideCode) setDiscountCodeText(overrideCode);`;
  content = content.replace(oldApplyFunc, newApplyFunc);
}

// 3. Update fetchProStatus
if (!content.includes('setActivePromotions(data.activePromotions)')) {
  content = content.replace(
    'if (data.settings) {\n          setSettings(data.settings);\n        }',
    'if (data.settings) {\n          setSettings(data.settings);\n        }\n        if (data.activePromotions) {\n          setActivePromotions(data.activePromotions);\n        }'
  );
}

// 4. Add Promo Banner above or in the registration view
const expectationBox = '<div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-right space-y-2">';

const promoBanner = `{/* Active Promotion Banner for Initial Registration */}
          {activePromotions && activePromotions.length > 0 && !isProApproved && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/40 p-5 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-right">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                      🔥 تخفیف ویژه هزینه اولیه ثبت‌نام
                    </span>
                    <h3 className="font-black text-sm md:text-base text-white">
                      کد تخفیف <span className="font-mono text-emerald-400">{activePromotions[0].code}</span> فعال است!
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    با استفاده از این کد از <strong className="text-emerald-300 font-bold">{activePromotions[0].discountType === 'PERCENTAGE' ? (activePromotions[0].discountValue + '٪ تخفیف') : (activePromotions[0].discountValue?.toLocaleString('fa-IR') + ' تومان تخفیف')}</strong> روی هزینه اولیه بهره‌مند شوید. {activePromotions[0].remainingUses ? ('(تنها ' + activePromotions[0].remainingUses + ' ظرفیت باقی‌مانده)') : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleApplyDiscountCodeWithCode(activePromotions[0].code)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>اعمال خودکار این کد تخفیف</span>
              </button>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-right space-y-2">`;

if (content.includes(expectationBox) && !content.includes('Active Promotion Banner for Initial Registration')) {
  content = content.replace(expectationBox, promoBanner);
}

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', content);
console.log('StoreProAccount.tsx patched successfully');
