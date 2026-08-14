const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');

// The file currently has some broken wrappers.
// Let's remove all the `</div> <div className={activeTab === ...` wrappers and start fresh.

code = code.replace(/<\/div>\n\s*<div className=\{activeTab === ".*?" \? "block space-y-8" : "hidden"\}>/g, "");

// Now we have one big `<div className="animate-fade-in-up"> <div className={activeTab === "core" ? "block space-y-8" : "hidden"}>` at the top.
// Let's find it.
const startRegex = /<div className="animate-fade-in-up">\n\s*<div className=\{activeTab === "core" \? "block space-y-8" : "hidden"\}>/;
code = code.replace(startRegex, `<div className="animate-fade-in-up">`);

// Remove the end wrappers I added
code = code.replace(/<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)\;\n\}/g, `</div>\n  );\n}`);

// Now the file should be a continuous list of sections without my broken wrappers.
// Let's add them back correctly using the EXACT section names we found:

code = code.replace(/\{\/\* System Update Module \*\/\}/, 
  `<div className={activeTab === "core" ? "block space-y-8" : "hidden"}>\n      {/* System Update Module */}`);

// We want Core to end before 5. PAYMENT & SMS INTEGRATION
// Wait, 6. SUPPORT INFO makes more sense for the "support" tab.
code = code.replace(/\{\/\* 6\. SUPPORT INFO \*\/\}/, 
  `</div>\n      <div className={activeTab === "support" ? "block space-y-8" : "hidden"}>\n      {/* 6. SUPPORT INFO */}`);

code = code.replace(/\{\/\* 7\. TERMS AND CONDITIONS \*\/\}/, 
  `</div>\n      <div className={activeTab === "terms" ? "block space-y-8" : "hidden"}>\n      {/* 7. TERMS AND CONDITIONS */}`);

code = code.replace(/\{\/\* 8\. CUSTOM CODE & EXTENSIBILITY ENGINE \*\/\}/, 
  `</div>\n      <div className={activeTab === "code" ? "block space-y-8" : "hidden"}>\n      {/* 8. CUSTOM CODE & EXTENSIBILITY ENGINE */}`);

code = code.replace(/\{\/\* 9\. PAYMENT & SMS SETTINGS MODULE \*\/\}/, 
  `</div>\n      <div className={activeTab === "gateways" ? "block space-y-8" : "hidden"}>\n      {/* 9. PAYMENT & SMS SETTINGS MODULE */}`);

// Close the last wrapper (gateways) before the final closing tag
code = code.replace(/<PaymentSmsSettings \/>/, `<PaymentSmsSettings />\n      </div>`);

fs.writeFileSync('src/components/superadmin/SystemSettings.tsx', code);
