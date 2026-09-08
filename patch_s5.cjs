const fs = require('fs');
let s5 = fs.readFileSync('/tmp/s5.txt', 'utf8');
const lastBracket = s5.lastIndexOf('</section>');
if (lastBracket !== -1) {
  s5 = s5.substring(0, lastBracket + 10);
}
fs.writeFileSync('/tmp/s5.txt', s5);
console.log('patched s5');
