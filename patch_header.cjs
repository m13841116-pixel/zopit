const fs = require('fs');
let header = fs.readFileSync('/tmp/header.txt', 'utf8');

// The header ends with `<div className="p-8 spac`. We want to cut that part off.
// Let's just find the closing bracket of the modal or just remove the last line if it's incomplete.
const lastBracket = header.lastIndexOf(')}');
if (lastBracket !== -1) {
  header = header.substring(0, lastBracket + 2);
}
fs.writeFileSync('/tmp/header.txt', header);
console.log('patched header');
