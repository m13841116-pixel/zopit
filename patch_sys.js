const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');

const oldHeader = code.substring(
  code.indexOf('{/* Title Header */}'),
  code.indexOf('{/* System Update Module */}')
);

const newHeader = `{/* Title Header */}
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
                } catch (err) {
                  toast("❌ خطا در خروجی: " + err.message, "error");
                }
              }}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Database className="w-4 h-4" />
              خروجی گرفتن از تمام داده‌ها
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "core", label: "هسته سیستم و قوانین", icon: Power },
            { id: "gateways", label: "درگاه پرداخت و پیامک", icon: CreditCard },
            { id: "support", label: "پشتیبانی و ارتباطات", icon: Scale },
            { id: "terms", label: "قرارداد اکانت پرو", icon: FileText },
            { id: "code", label: "تزریق کدهای سفارشی", icon: Code },
            { id: "woocommerce", label: "اتصال ووکامرس", icon: ShoppingBag }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={\`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer \${
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
      
      <div className="animate-fade-in-up">
        <div className={activeTab === "core" ? "block space-y-8" : "hidden"}>
`;

code = code.replace(oldHeader, newHeader);

// We need to wrap each section. 
// "core" includes System Update, System Access (1), Commissions (2), Modules (3), Global Store (4), SLA (5)
// "support" includes Support Info (6), Return Info (7)
// "terms" includes Pro Terms (8)
// "gateways" includes PaymentSmsSettings (9)
// "code" includes Custom JS/CSS (10)
// "woocommerce" includes WooCommerce (11)

// Let's do replacements based on comments
code = code.replace(/\{\/\* 6\. SUPPORT INFO \*\/\}/, `</div>
        <div className={activeTab === "support" ? "block space-y-8" : "hidden"}>
      {/* 6. SUPPORT INFO */}`);

code = code.replace(/\{\/\* 8\. PRO ACCOUNT TERMS \*\/\}/, `</div>
        <div className={activeTab === "terms" ? "block space-y-8" : "hidden"}>
      {/* 8. PRO ACCOUNT TERMS */}`);

code = code.replace(/\{\/\* 9\. PAYMENT & SMS SETTINGS MODULE \*\/\}/, `</div>
        <div className={activeTab === "gateways" ? "block space-y-8" : "hidden"}>
      {/* 9. PAYMENT & SMS SETTINGS MODULE */}`);

code = code.replace(/\{\/\* 10\. CUSTOM JS & CSS INJECTION MODULE \*\/\}/, `</div>
        <div className={activeTab === "code" ? "block space-y-8" : "hidden"}>
      {/* 10. CUSTOM JS & CSS INJECTION MODULE */}`);

code = code.replace(/\{\/\* 11\. WOOCOMMERCE CONNECTION MODULE \*\/\}/, `</div>
        <div className={activeTab === "woocommerce" ? "block space-y-8" : "hidden"}>
      {/* 11. WOOCOMMERCE CONNECTION MODULE */}`);

// We need to close the very last tab wrapper.
code = code.replace(/<PaymentSmsSettings \/>/, `<PaymentSmsSettings />`);

// Find the end of the file and close the `<div className="animate-fade-in-up">`
code = code.replace(/<\/div>\n\s*<\/div>\n\s*\)\;\n\}/, `</div>\n      </div>\n    </div>\n  );\n}`);

fs.writeFileSync('src/components/superadmin/SystemSettings.tsx', code);
