const fs = require('fs');
const file = 'src/components/CustomCodeInjector.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const fn = new Function\(`try \{ \$\{code\} \} catch\(err\) \{ console\.warn\("\[\$\{sourceName\} Runtime Error\]:", err\); \}`\);/g,
  "const fn = new Function(`try { \\n${code}\\n } catch(err) { console.warn(\\\"[${sourceName} Runtime Error]:\\\", err); }`);"
);

fs.writeFileSync(file, code);
