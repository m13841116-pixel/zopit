const fs = require('fs');
let content = fs.readFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', 'utf8');

const tabSwitcherTarget = `          <button
            onClick={() => setActiveTab("settings")}
            className={\`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 \${
              activeTab === "settings"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-muted hover:text-primary"
            }\`}
          >
            <Settings className="w-4 h-4" />
            <span>تنظیمات عمومی</span>
          </button>`;

const tabSwitcherReplacement = tabSwitcherTarget + `
          <button
            onClick={() => setActiveTab("discounts")}
            className={\`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 \${
              activeTab === "discounts"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-muted hover:text-primary"
            }\`}
          >
            <Ticket className="w-4 h-4" />
            <span>مدیریت کدهای تخفیف</span>
          </button>`;

content = content.replace(tabSwitcherTarget, tabSwitcherReplacement);

const tab2Target = `          </div>
        </form>
      )}
    </div>`;

const tab2Replacement = `          </div>
        </form>
      )}

      {/* TAB 3: DISCOUNT CODES */}
      {activeTab === "discounts" && (
        <SuperAdminDiscountCodes />
      )}
    </div>`;

content = content.replace(tab2Target, tab2Replacement);

if (!content.includes('Ticket')) {
    content = content.replace('Settings,', 'Settings, Ticket,');
}

fs.writeFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', content);
