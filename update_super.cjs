const fs = require('fs');
let content = fs.readFileSync('src/components/superadmin/SuperAdminDashboard.tsx', 'utf8');

if (!content.includes('import LeadsManager')) {
  content = content.replace(
    'import AdminAnnouncements from "./AdminAnnouncements";',
    'import AdminAnnouncements from "./AdminAnnouncements";\nimport LeadsManager from "./LeadsManager";'
  );
}

if (!content.includes('id: "leads"')) {
  content = content.replace(
    '{ id: "referrers", label: "معرف‌ها (Referrers)", icon: <Megaphone className="w-4 h-4" /> },',
    '{ id: "referrers", label: "معرف‌ها (Referrers)", icon: <Megaphone className="w-4 h-4" /> },\n      { id: "leads", label: "مدیریت سرنخ و سفیران", icon: <Target className="w-4 h-4" /> },'
  );
  content = content.replace(
    'import { LayoutDashboard',
    'import { LayoutDashboard, Target'
  );
}

if (!content.includes('activeTab === "leads"')) {
  content = content.replace(
    '{activeTab === "products" && <ProductsList />}',
    '{activeTab === "products" && <ProductsList />}\n          {activeTab === "leads" && <LeadsManager />}'
  );
}

fs.writeFileSync('src/components/superadmin/SuperAdminDashboard.tsx', content);
