const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, regex, replacement) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = content.replace(regex, replacement);
    fs.writeFileSync(filePath, newContent);
    console.log("Updated", filePath);
  }
}

const dashboards = [
  'src/components/store-manager/StoreManagerDashboard.tsx',
  'src/components/superadmin/SuperAdminDashboard.tsx',
  'src/components/supplier/SupplierDashboard.tsx',
  'src/components/referrer/ReferrerDashboard.tsx',
  'src/components/CustomerDashboard.tsx'
];

dashboards.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace: const [activeTab, setActiveTab] = useState("overview"); 
  // OR const [activeTab, setActiveTab] = useState<...>("...");
  // with reading from URL!
  
  let match = content.match(/const \[activeTab, setActiveTab\] = useState(?:<[^>]+>)?\("([^"]+)"\);/);
  if (match) {
    const defaultTab = match[1];
    let routeBase = "";
    if (file.includes('StoreManager')) routeBase = "/store";
    else if (file.includes('SuperAdmin')) routeBase = "/admin";
    else if (file.includes('Supplier')) routeBase = "/supplier";
    else if (file.includes('Referrer')) routeBase = "/referrer";
    else if (file.includes('Customer')) routeBase = "/customer";

    const replacement = `const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith("${routeBase}/") && path.length > "${routeBase}/".length) {
        return path.replace("${routeBase}/", "");
      }
    }
    return "${defaultTab}";
  });`;

    content = content.replace(match[0], replacement);
    fs.writeFileSync(file, content);
    console.log("Fixed useState for activeTab in", file);
  }
});

