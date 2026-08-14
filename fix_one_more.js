const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SystemSettings.tsx', 'utf8');
code = code.replace(/<\/div>\n<\/div>\n<\/div>\n<\/div>\n  \);\n\}/, '</div>\n</div>\n</div>\n</div>\n</div>\n  );\n}');
fs.writeFileSync('src/components/superadmin/SystemSettings.tsx', code);
