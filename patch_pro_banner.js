const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

const bannerOld = `<div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
              <span>{parseInt(settings.proAccountPrice || '239500').toLocaleString('fa-IR')} تومان</span>
              <span className="text-xs font-normal text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                هزینه فعال‌سازی اولیه
              </span>
            </div>`;

const bannerNew = `
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-slate-300/80 font-mono font-bold line-through decoration-rose-500 decoration-2 mb-1">
                ۹,۵۰۰,۰۰۰ تومان
              </div>
              <div className="text-3xl md:text-4xl font-black text-emerald-400 flex items-center justify-center gap-2">
                <span>کاملاً رایگان!</span>
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-2 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                تنها با پرداخت {parseInt(settings.proAccountPrice || '239500').toLocaleString('fa-IR')} تومان هزینه راه‌اندازی اولیه
              </div>
            </div>`;

code = code.replace(bannerOld, bannerNew);

// Remove the old total value block that was outside
const oldTotalValue = `<span className="text-xs text-slate-400 block mb-1">ارزش کل خدمات پکیج پرو:</span>
            <div className="text-lg text-emerald-400 font-mono font-bold">
    ۹,۵۰۰,۰۰۰ تومان
  </div>`;
code = code.replace(oldTotalValue, `<span className="text-xs text-slate-400 block mb-2">پکیج طلایی مدیران (ویژه)</span>`);

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
