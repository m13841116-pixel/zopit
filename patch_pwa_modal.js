const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const pwaModalJSX = `
      {/* PWA Install Instructions Modal */}
      {showIosPwaModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-border-default dark:border-border-subtle animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowIosPwaModal(false)} className="absolute top-4 left-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
            <h3 className="text-xl font-black text-center text-text-primary mb-2">نصب نسخه موبایل زوپیت</h3>
            <p className="text-sm text-text-muted text-center mb-6 leading-relaxed">
              برای تجربه کاربری بهتر و دسترسی سریع‌تر، زوپیت را به صفحه اصلی دستگاه خود اضافه کنید. این نسخه <b>کاملاً ریسپانسیو و سازگار با سیستم‌عامل اندروید و iOS</b> است.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-xs text-text-secondary mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                راهنمای نصب:
              </h4>
              <ul className="text-xs text-text-muted space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 mt-0.5">۱</span>
                  <span>در مرورگر (مانند Chrome یا Safari)، منوی تنظیمات (سه نقطه یا دکمه اشتراک‌گذاری) را باز کنید.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 mt-0.5">۲</span>
                  <span>گزینه <b>Add to Home Screen</b> (افزودن به صفحه اصلی) را انتخاب کنید.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 mt-0.5">۳</span>
                  <span>در پنجره باز شده، دکمه <b>Add</b> یا افزودن را بزنید تا برنامه نصب شود.</span>
                </li>
              </ul>
            </div>
            
            <button onClick={() => setShowIosPwaModal(false)} className="w-full py-3.5 bg-primary-default hover:bg-primary-dark text-white rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg shadow-primary-default/20">
              متوجه شدم
            </button>
          </div>
        </div>
      )}
`;

content = content.replace('      {/* Top Banner & Tab Navigation */}', pwaModalJSX + '\n      {/* Top Banner & Tab Navigation */}');

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('PWA Modal Added');
