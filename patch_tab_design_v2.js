const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const newTab = `        {/* Floating Navigation Pill */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:top-6 md:bottom-auto z-[100] w-[90%] max-w-[360px]">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-1.5 rounded-full flex items-center shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-black/5">
            <div className="relative flex w-full gap-1">
              <button
                onClick={() => setView("explore")}
                className={\`flex-1 py-3 rounded-full text-sm font-extrabold transition-all duration-300 cursor-pointer z-10 flex items-center justify-center gap-2 \${view === "explore" ? "text-white shadow-md bg-gradient-to-r from-primary-default to-indigo-600 scale-100" : "text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 scale-95 hover:scale-100"}\`}
              >
                <Compass className={\`w-4 h-4 \${view === "explore" ? "animate-pulse" : ""}\`} />
                <span>اکسپلور کالا</span>
              </button>
              <button
                onClick={() => setView("login")}
                className={\`flex-1 py-3 rounded-full text-sm font-extrabold transition-all duration-300 cursor-pointer z-10 flex items-center justify-center gap-2 \${view === "login" ? "text-white shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 scale-100" : "text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 scale-95 hover:scale-100"}\`}
              >
                <User className="w-4 h-4" />
                <span>ورود / ثبت‌نام</span>
              </button>
            </div>
          </div>
        </div>`;

content = content.replace(/<div className="fixed top-6 left-1\/2 -translate-x-1\/2 z-\[100\].*?<\/div>\s*<\/div>/s, newTab);

fs.writeFileSync('src/App.tsx', content, 'utf8');
