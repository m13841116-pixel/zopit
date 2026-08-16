const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/let PrismaClient: any;\ntry \{\n  PrismaClient = require\('@prisma\/client'\)\.PrismaClient;\n\} catch \(err: any\) \{\n  console\.warn\('PrismaClient loading failed initially, will attempt lazy loading:', err\.message\);\n\}/g, 
  'let PrismaClient: any = StaticPrismaClient;');

code = code.replace(/try \{\n          PrismaClient = require\('@prisma\/client'\)\.PrismaClient;\n        \} catch \(e: any\) \{\n          console\.warn\('\[Server Prisma\] Failed to require @prisma\/client dynamically:', e\.message\);\n        \}/g,
  'PrismaClient = StaticPrismaClient;');

fs.writeFileSync('server.ts', code);
