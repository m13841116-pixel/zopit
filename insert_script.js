const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');
const newEndpoints = fs.readFileSync('new_endpoints.ts', 'utf8');
serverCode = serverCode.replace("app.get('/api/supplier/orders'", newEndpoints + "\napp.get('/api/supplier/orders'");
fs.writeFileSync('server.ts', serverCode);
