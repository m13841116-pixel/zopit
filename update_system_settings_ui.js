const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');

// The activeTab state is already defined. We just need to wrap the contents in conditional rendering and add a tab navigation header.

const titleHeaderRegex = /\{\/\* Title Header \*\/\}(.|\n)*?(?=\{\/\* System Update Module \*\*\/)/;
// Wait, I will use a different approach. I will replace the main div container structure.

const tabsMenuUI = `
      {/* Title Header */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-indigo-500/30 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              هسته مدیریت سیستم زوپیت
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-indigo-400 animate-spin-slow" />
              پیکربندی و تنظیمات مدیر کل
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              مدیریت قدرتمند تمامی بخش‌های پلتفرم زوپیت. از تنظیمات هسته، قوانین، درگاه‌ها تا پشتیبانی و کدنویسی.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="bg-slate-800/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Shield className="w-4 h-4" /> وضعیت امنیتی: محافظت شده
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/admin/export-all-data", {
                    headers: { Authorization: \`Bearer \${localStorage.getItem("token")}\` },
                  });
                  if (!response.ok) throw new Error("خطا در دریافت داده‌ها");
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = \`zopit-export-\${new Date().toISOString().slice(0, 10)}.json\`;
                  a.click();
                  toast("✅ داده‌های سایت با موفقیت دریافت شد.", "success");
                } catch (err: any) {
                  toast("❌ خطا: " + err.message, "error");
                }
              }}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
            >
              <Database className="w-4 h-4" />
              خروجی گرفتن از تمام داده‌ها
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "core", label: "هسته سیستم و دسترسی‌ها", icon: Power },
            { id: "gateways", label: "درگاه پرداخت و پیامک", icon: CreditCard },
            { id: "support", label: "پشتیبانی و قوانین", icon: Scale },
            { id: "terms", label: "قرارداد اکانت پرو", icon: FileText },
            { id: "code", label: "تزریق کدهای سفارشی", icon: Code },
            { id: "woocommerce", label: "تنظیمات ووکامرس", icon: ShoppingBag }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={\`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 \${
                  isActive
                    ? "bg-indigo-500 text-white shadow-md border-b-2 border-white/20"
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-transparent"
                }\`}
              >
                <Icon className={\`w-4 h-4 \${isActive ? "text-indigo-100" : "text-slate-400"}\`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
`;

// We'll replace the existing header with this new beautiful header.
// Then we wrap the contents based on the active tab.

const contentWrapperOld = \`      {/* System Update Module */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-4">\`;

const contentWrapperNew = \`
      <div className="animate-fade-in-up">
        {activeTab === "core" && (
          <div className="space-y-8">
            {/* System Update Module */}
            <div className="bg-surface p-6 rounded-3xl shadow-sm border border-subtle space-y-4">\`;

code = code.replace(/\{\/\* Title Header \*\/\}[\s\S]*?\{\/\* System Update Module \*\/\}\n\s*<div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-4">/, tabsMenuUI + contentWrapperNew);

// We need to wrap each section with proper activeTab condition
// Wait, doing this via regex might be brittle.
