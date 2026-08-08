const fs = require('fs');
let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
env = env.replace(/^DATABASE_URL=.*$/m, '');
env += `\nDATABASE_URL="postgresql://neondb_owner:npg_5sjQXIVuGTg0@ep-weathered-resonance-aynrmla6-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"`;
fs.writeFileSync('.env', env.trim());
