const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SuperAdminDashboard.tsx', 'utf8');

const oldMenu = `    { id: "overview", label: "پیشخوان", icon: LayoutDashboard },`;
const newMenu = `    { id: "overview", label: "پیشخوان", icon: LayoutDashboard },\n    { id: "analytics", label: "گزارش عملکرد", icon: TrendingUp },`;

code = code.replace(oldMenu, newMenu);
code = code.replace(/import \{([^}]+)\} from "lucide-react";/, (match, p1) => {
  if (!p1.includes("TrendingUp")) {
    return `import {${p1}, TrendingUp} from "lucide-react";`;
  }
  return match;
});

const oldContent = `{activeTab === "overview" && (
            <Overview onNavigateTab={handleNavigateTab} />
          )}`;

const newContent = `{activeTab === "overview" && (
            <Overview onNavigateTab={handleNavigateTab} />
          )}
          {activeTab === "analytics" && (
            <PerformanceAnalytics />
          )}`;

code = code.replace(oldContent, newContent);

if (!code.includes('import PerformanceAnalytics')) {
  code = `import PerformanceAnalytics from "./PerformanceAnalytics";\n` + code;
}

fs.writeFileSync('src/components/superadmin/SuperAdminDashboard.tsx', code);
