const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// The user wants a 2-tab UI for unauthenticated users, defaulting to Explore.
// Currently, `useState("login")` is the default view. Let's change it to "explore".
appContent = appContent.replace(
  /useState<\s*\|\s*"login"[\s\S]*?>\("login"\);/,
  'useState<\n    | "login"\n    | "role_select"\n    | "supplier_form"\n    | "store_manager_form"\n    | "customer_form"\n    | "referrer_form"\n    | "forgot_password"\n    | "dashboard"\n    | "explore"\n  >("explore");'
);

// We should remove the floating button:
appContent = appContent.replace(
  /<button\s*onClick=\{\(\) => setView\("explore"\)\}[\s\S]*?<\/button>/,
  ''
);

fs.writeFileSync('src/App.tsx', appContent, 'utf8');
console.log('App default view changed to explore and floating button removed.');
