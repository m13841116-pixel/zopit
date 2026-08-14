const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

const supportSection = `
            {/* Support and Documents Section */}
            <div className="bg-surface p-6 rounded-3xl border border-subtle mt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-primary text-base flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    ارسال مدارک برای اخذ اینماد و درگاه
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    جهت پیشبرد امور اداری (اینماد، درگاه پرداخت و مالیات)، لطفا تصاویر کارت ملی، شناسنامه و شماره شبا خود را از طریق تیکت پشتیبانی (دپارتمان اکانت پرو) برای کارشناسان ما ارسال نمایید.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('tickets')}
                  className="px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-black rounded-2xl transition-all shadow-sm border border-indigo-500/30 text-xs flex items-center gap-2 shrink-0"
                >
                  <PenTool className="w-4 h-4" />
                  <span>ارسال تیکت به پشتیبانی پرو</span>
                </button>
              </div>
            </div>`;

code = code.replace(/\{proAccount\.torobConnected \? \(/, `${supportSection}\n\n            {proAccount.torobConnected ? (`);

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
