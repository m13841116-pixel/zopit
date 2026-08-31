const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import AmbassadorDashboard')) {
  content = content.replace(
    'import ReferrerDashboard from "./components/referrer/ReferrerDashboard";',
    'import ReferrerDashboard from "./components/referrer/ReferrerDashboard";\nimport AmbassadorDashboard from "./components/ambassador/AmbassadorDashboard";'
  );
}

if (!content.includes('case "AMBASSADOR":')) {
  content = content.replace(
    'case "REFERRER":',
    'case "AMBASSADOR":\n        return <AmbassadorDashboard />;\n      case "REFERRER":'
  );
}

fs.writeFileSync('src/App.tsx', content);
