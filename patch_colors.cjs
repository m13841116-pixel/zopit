const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// The user requested: "رنگ‌بندی را تغییر بده. رنگ پس‌زمینه نباید با رنگ متن یکی باشد تا متن دیده شود."

content = content.replace(/--color-background:\s*#f8fafc;/g, '--color-background: #ffffff;');
content = content.replace(/--color-surface:\s*#ffffff;/g, '--color-surface: #f1f5f9;');
content = content.replace(/--color-text-primary:\s*#0f172a;/g, '--color-text-primary: #1e293b;');
content = content.replace(/--color-text-secondary:\s*#334155;/g, '--color-text-secondary: #475569;');
content = content.replace(/--color-text-muted:\s*#64748b;/g, '--color-text-muted: #94a3b8;');
content = content.replace(/--color-border:\s*#e2e8f0;/g, '--color-border: #cbd5e1;');
content = content.replace(/--color-border-subtle:\s*#f1f5f9;/g, '--color-border-subtle: #e2e8f0;');

// Also in Dark Mode
content = content.replace(/--color-background:\s*#020617;/g, '--color-background: #0f172a;');
content = content.replace(/--color-surface:\s*#0f172a;/g, '--color-surface: #1e293b;');
content = content.replace(/--color-text-primary:\s*#f8fafc;/g, '--color-text-primary: #ffffff;');
content = content.replace(/--color-text-secondary:\s*#cbd5e1;/g, '--color-text-secondary: #f1f5f9;');
content = content.replace(/--color-text-muted:\s*#94a3b8;/g, '--color-text-muted: #cbd5e1;');

// Change default fonts to iranyekan if the font has issues with numbers
// The user says: "اگر در جایی نیاز به تغییر فونت اعداد است، فونت ایران یکان را استفاده کن." 
// Let's ensure iranyekan or Vazirmatn is set for numbers. Currently Vazirmatn is primarily used. Let's make iranyekan available in index.css if not already.

fs.writeFileSync('src/index.css', content);
