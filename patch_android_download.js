const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const pwaButtonsOld = `                    {/* PWA Web App Install Capability */}
                    <div className="mt-5 pt-4 border-t border-border-default/50 dark:border-border-subtle/50 space-y-2">
                      <button
                        type="button"
                        onClick={handleInstallPwa}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>نصب وب‌اپلیکیشن (PWA) / افزودن به خانه</span>
                        {isAppInstalled && (
                          <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-black mr-1">
                            نصب شده
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setView("explore")}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <Compass className="w-4 h-4 text-emerald-200" />
                        <span>ورود مستقیم به بخش اکسپلور کالاها (بدون نیاز به ثبت‌نام)</span>
                      </button>
                    </div>`;

const pwaButtonsNew = `                    {/* PWA Web App Install Capability & Android APK */}
                    <div className="mt-5 pt-4 border-t border-border-default/50 dark:border-border-subtle/50 space-y-2">
                      <button
                        type="button"
                        onClick={handleInstallPwa}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>نصب وب‌اپلیکیشن (PWA) / افزودن به خانه</span>
                        {isAppInstalled && (
                          <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-black mr-1">
                            نصب شده
                          </span>
                        )}
                      </button>
                      
                      <a 
                        href="/zopit-android-app.apk"
                        download
                        className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white"><path d="M17.523 15.3414C17.523 15.3414 17.523 15.3414 17.523 15.3414C17.4716 15.4227 17.3826 15.4727 17.2878 15.4746C17.192 15.4764 17.0988 15.4312 17.043 15.3524C16.9852 15.2717 16.974 15.166 17.0132 15.0743L17.523 15.3414ZM6.47702 15.3414C6.47702 15.3414 6.47702 15.3414 6.47702 15.3414C6.42555 15.4227 6.33659 15.4727 6.24177 15.4746C6.14603 15.4764 6.05278 15.4312 5.99703 15.3524C5.93922 15.2717 5.928 15.166 5.96726 15.0743L6.47702 15.3414ZM12.0007 19.2618C15.6517 19.2618 18.7753 17.0673 19.9882 13.9142L4.01314 13.9142C5.22602 17.0673 8.34963 19.2618 12.0007 19.2618Z" opacity="0.4"></path><path d="M19.9882 13.9142C19.9677 13.861 19.9463 13.8082 19.9239 13.756C19.8242 13.5186 19.7126 13.2875 19.5901 13.0631C18.995 11.9774 18.1724 11.0371 17.1818 10.3015C16.3262 9.66444 15.3622 9.17094 14.327 8.84711L15.3995 7.15176C15.5451 6.92131 15.4735 6.61921 15.2396 6.47708C15.0057 6.33496 14.698 6.40654 14.5524 6.63699L13.4357 8.39922C12.9739 8.28786 12.4938 8.23005 12.0007 8.23005C11.5075 8.23005 11.0274 8.28786 10.5656 8.39922L9.4489 6.63699C9.30327 6.40654 8.99558 6.33496 8.76166 6.47708C8.52775 6.61921 8.45617 6.92131 8.60181 7.15176L9.67431 8.84711C8.63909 9.17094 7.67512 9.66444 6.8195 10.3015C5.82885 11.0371 5.0063 11.9774 4.41117 13.0631C4.28867 13.2875 4.17709 13.5186 4.07733 13.756C4.05497 13.8082 4.0336 13.861 4.01314 13.9142L19.9882 13.9142Z"></path><circle cx="8.5" cy="11.5" r="1"></circle><circle cx="15.5" cy="11.5" r="1"></circle></svg>
                        <span>دانلود مستقیم نسخه اندروید (APK)</span>
                      </a>
                      
                      <button
                        type="button"
                        onClick={() => setView("explore")}
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-lg shadow-slate-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <Compass className="w-4 h-4 text-slate-300" />
                        <span>ورود مستقیم به بخش اکسپلور کالاها</span>
                      </button>
                    </div>`;

content = content.replace(pwaButtonsOld, pwaButtonsNew);

fs.writeFileSync('src/App.tsx', content, 'utf8');
