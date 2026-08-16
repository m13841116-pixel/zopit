const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const prismaModule = require\('@prisma\/client'\);\n\s*PrismaClient = prismaModule\.PrismaClient;/g,
  'PrismaClient = StaticPrismaClient;');

fs.writeFileSync('server.ts', code);
