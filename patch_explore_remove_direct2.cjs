const fs = require('fs');
let content = fs.readFileSync('src/components/Explore.tsx', 'utf8');

// The user requested to remove the direct purchase ENTIRELY.
// There is still a floating cart button and cart state logic remaining.
// I will just remove the floating cart button HTML entirely, and the cart sidebar.

content = content.replace(/<div\n\s*id="explore-floating-cart-btn"[\s\S]*?<\/div>/g, '');
content = content.replace(/<div\n\s*className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-500 flex flex-col \${[\s\S]*?<\/div>\n\s*<\/div>/g, '');

fs.writeFileSync('src/components/Explore.tsx', content);
