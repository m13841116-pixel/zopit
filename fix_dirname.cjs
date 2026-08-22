const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/__dirname/g, 'safeDirname');

// Insert const safeDirname definition if not already there, actually it's easier to just put it near the top of getStaticDistPath or globally.
// Let's replace the one in getStaticDistPath locally and globally.
// Wait, is there any other place?
