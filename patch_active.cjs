const fs = require('fs');
const content = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

const targetStr = `{isProApproved ? (
        <div className="space-y-8">
          {/* Status Badge */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">`;

const replacement = `{isProApproved ? (
        <div className="space-y-8">
          {/* VIP Status Badge */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <Crown className="w-8 h-8 text-slate-950" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white flex items-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">اکانت پرومکس فعال است</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                    Zopit PRO MAX
                  </span>
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  شما در حال استفاده از قدرتمندترین زیرساخت اختصاصی زوپیت هستید.
                </p>
              </div>
            </div>
            {proAccount.createdAt && (
              <div className="relative z-10 flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">تاریخ فعال‌سازی</span>
                <span className="text-sm font-mono text-amber-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-amber-500/20 shadow-inner">
                  {new Date(proAccount.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
            )}
          </div>`;

const newContent = content.replace(targetStr, replacement);
fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', newContent);
console.log("Done");
