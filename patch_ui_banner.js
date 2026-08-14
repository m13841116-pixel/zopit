const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

const bannerOld = `<div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
              <span>کاملاً رایگان!</span>
              <span className="text-xs font-normal text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                (در حال حاضر)
              </span>
            </div>`;

const bannerNew = `<div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
              <span>{parseInt(settings.proAccountPrice || '239500').toLocaleString('fa-IR')} تومان</span>
              <span className="text-xs font-normal text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                هزینه فعال‌سازی اولیه
              </span>
            </div>`;

code = code.replace(bannerOld, bannerNew);
fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
