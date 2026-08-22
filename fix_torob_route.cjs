const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Torob & Emalls XML Feed for Store[\s\S]*?\}\);/m;
const match = code.match(regex);
if (match) {
  code = code.replace(regex, '');
  code = code.replace('startServer();', match[0] + '\n\nstartServer();');
  fs.writeFileSync('server.ts', code);
}
