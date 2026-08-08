const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldTab = `        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1 shadow-lg border border-border-default/50 dark:border-border-subtle/50">
          <button
            onClick={() => setView("explore")}
            className={\`px-6 py-2 rounded-xl text-sm font-black transition-all cursor-pointer \${view === "explore" ? "bg-primary-default text-white shadow-md" : "text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700"}\`}
          >
            اکسپلور
          </button>
          <button
            onClick={() => setView("login")}
            className={\`px-6 py-2 rounded-xl text-sm font-black transition-all cursor-pointer \${view === "login" ? "bg-primary-default text-white shadow-md" : "text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700"}\`}
          >
            ورود / ثبت‌نام
          </button>
        </div>`;

const newTab = `        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-1.5 rounded-2xl flex items-center shadow-xl border border-border-default/60 dark:border-border-subtle/60 w-[300px] sm:w-[350px]">
          <div className="relative flex w-full">
            <button
              onClick={() => setView("explore")}
              className={\`flex-1 py-2.5 rounded-xl text-sm font-black transition-all duration-300 cursor-pointer z-10 \${view === "explore" ? "text-white shadow-md bg-primary-default" : "text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700"}\`}
            >
              اکسپلور
            </button>
            <button
              onClick={() => setView("login")}
              className={\`flex-1 py-2.5 rounded-xl text-sm font-black transition-all duration-300 cursor-pointer z-10 \${view === "login" ? "text-white shadow-md bg-primary-default" : "text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700"}\`}
            >
              ورود / ثبت‌نام
            </button>
          </div>
        </div>`;

content = content.replace(oldTab, newTab);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Tab design updated');
