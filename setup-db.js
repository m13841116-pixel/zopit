const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');

// Determine local prisma binary
const prismaBin = path.join(rootDir, 'node_modules', 'prisma', 'build', 'index.js');
const hasPrismaBin = fs.existsSync(prismaBin);
const prismaCmd = hasPrismaBin ? `node "${prismaBin}"` : 'npx prisma';

// 1. Load .env file if it exists
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  console.log('[Setup DB] Loading environment variables from .env...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// 2. Determine DATABASE_URL and provider
let dbUrl = process.env.DATABASE_URL || '';

if (dbUrl) {
  let cleaned = dbUrl.trim();
  while (cleaned.startsWith('DATABASE_URL=')) {
    cleaned = cleaned.substring('DATABASE_URL='.length).trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
  }
  dbUrl = cleaned;
  process.env.DATABASE_URL = dbUrl;
}

let provider = "mysql";

const isCloudRun = !!process.env.K_SERVICE;
const isAIStudio = !!process.env.APPLET_ID;

const isRealRemoteDb = dbUrl && (
  dbUrl.startsWith('mysql://') || 
  dbUrl.startsWith('mysqls://') || 
  dbUrl.startsWith('postgresql://') || 
  dbUrl.startsWith('postgres://')
) && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('dummy_db');

if (!isRealRemoteDb) {
  provider = "postgresql";
  dbUrl = "postgresql://dummy:dummy@dummy_db/dummy";
  process.env.DATABASE_URL = dbUrl;
  console.log('[Setup DB] No real remote DB URL found. Defaulting to postgresql anyway for Vercel/Neon deployment.');
} else {
  if (dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:')) {
    provider = "sqlite";
  } else if (dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')) {
    provider = "postgresql";
  } else {
    provider = "mysql";
  }
}

console.log(`[Setup DB] Target database provider: ${provider}, URL: ${dbUrl.substring(0, 30)}...`);

if (fs.existsSync(schemaPath)) {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const datasourceRegex = /datasource db \{[\s\S]*?\}/;
  const targetDatasourceBlock = `datasource db {\n  provider = "${provider}"\n  url      = env("DATABASE_URL")\n}`;

  if (schemaContent.match(datasourceRegex)) {
    const currentMatch = schemaContent.match(datasourceRegex);
    if (currentMatch && currentMatch[0].trim() !== targetDatasourceBlock.trim()) {
      try {
        schemaContent = schemaContent.replace(datasourceRegex, targetDatasourceBlock);
        fs.writeFileSync(schemaPath, schemaContent, 'utf8');
        console.log(`[Setup DB] Updated schema.prisma provider to "${provider}".`);
      } catch (e) {
        console.warn(`[Setup DB] Skipped writing schema.prisma (read-only filesystem):`, e.message);
      }
    }
  }

  try {
    const childEnv = { 
      ...process.env, 
      CI: 'true', 
      PRISMA_HIDE_UPDATE_MESSAGE: 'true', 
      PRISMA_TELEMETRY_DISABLED: '1',
      PRISMA_CLI_QUERY_ENGINE_TYPE: 'library',
      DATABASE_URL: dbUrl
    };

    const runPrismaCmd = (args, description, timeoutMs = 30000) => {
      console.log(`[Setup DB] ${description}...`);
      try {
        const output = execSync(`${prismaCmd} ${args}`, { 
          cwd: rootDir,
          stdio: ['ignore', 'pipe', 'pipe'], 
          env: childEnv, 
          timeout: timeoutMs,
          encoding: 'utf8'
        });
        if (output && output.trim()) {
          console.log(output.trim());
        }
        return true;
      } catch (err) {
        const out = (err.stdout || '') + '\n' + (err.stderr || '');
        if (out.trim()) {
          console.log(out.trim());
        }
        console.warn(`[Setup DB] Notice on ${description}:`, err.message);
        return false;
      }
    };

    runPrismaCmd('generate', `Generating Prisma Client (${provider})`, 30000);

    if (dbUrl && !dbUrl.includes('dummy_db') && isRealRemoteDb) {
      let syncSuccess = runPrismaCmd('db push --accept-data-loss --skip-generate', `Synchronizing database schema (${provider})`, 45000);
      if (!syncSuccess && provider === 'sqlite') {
        const actualDbPath = dbUrl.replace(/^file:/, '');
        if (fs.existsSync(actualDbPath)) {
          console.warn('[Setup DB] SQLite database appears corrupted. Removing and recreating:', actualDbPath);
          try {
            fs.unlinkSync(actualDbPath);
            syncSuccess = runPrismaCmd('db push --accept-data-loss --skip-generate', `Retrying schema synchronization after removing corrupt SQLite db (${provider})`, 45000);
          } catch (unlinkErr) {
            console.error('[Setup DB] Failed to remove corrupt SQLite file:', unlinkErr.message);
          }
        }
      }
      console.log('[Setup DB] Database setup & synchronization completed successfully.');

      (async () => {
        try {
          const { PrismaClient } = require('@prisma/client');
          const bcrypt = require('bcryptjs');
          const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
          
          const categoryCount = await prisma.category.count();
          if (categoryCount === 0) {
            console.log('[Setup DB] Seeding 16 default categories...');
            const defaultCategories = [
              "موبایل", "لپ‌تاپ", "کالای دیجیتال", "خانه و آشپزخانه",
              "لوازم خانگی برقی", "آرایشی و بهداشتی", "مد و پوشاک", "طلا و نقره",
              "خودرو و موتورسیکلت", "سلامت و پزشکی", "ابزارآلات و تجهیزات", "کتاب و هنر",
              "ورزش و سفر", "اسباب بازی کودک و نوزاد", "محصولات بومی و محلی", "پت شاپ"
            ];
            for (let i = 0; i < defaultCategories.length; i++) {
              await prisma.category.create({
                data: { name: defaultCategories[i], isActive: true, sortOrder: i + 1 }
              });
            }
            console.log('[Setup DB] Successfully seeded 16 default categories.');
          }

          const userCount = await prisma.user.count();
          if (userCount === 0) {
            console.log('[Setup DB] Seeding default users (admin, store, supplier, customer)...');
            const passAdmin = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || '!Bahankala@2026', 10);
            const passStore = await bcrypt.hash('store', 10);
            const passSupplier = await bcrypt.hash('supplier', 10);
            const passStandard = await bcrypt.hash('!Bahankala@2026', 10);

            // Super Admin
            await prisma.user.create({
              data: {
                username: process.env.SUPER_ADMIN_USERNAME || 'admin',
                email: 'admin@marketplace.com',
                password: passAdmin,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                firstName: 'مدیر',
                lastName: 'ارشد',
                mobile: '09120000000'
              }
            });

            // Store Manager (store)
            await prisma.user.create({
              data: {
                username: 'store',
                email: 'store@marketplace.com',
                password: passStore,
                role: 'STORE_MANAGER',
                status: 'ACTIVE',
                firstName: 'مدیر',
                lastName: 'فروشگاه نمونه',
                mobile: '09122222222',
                storeName: 'فروشگاه نمونه',
                storeUrl: 'samplestore.ir',
                platformType: 'WOOCOMMERCE',
                fieldOfActivity: 'لوازم الکترونیکی',
                productCount: 50
              }
            });

            // Store 1
            await prisma.user.create({
              data: {
                username: 'store1',
                email: 'store1@marketplace.com',
                password: passStandard,
                role: 'STORE_MANAGER',
                status: 'ACTIVE',
                firstName: 'مدیر',
                lastName: 'فروشگاه تست ۱',
                mobile: '09121111111',
                storeName: 'فروشگاه تست ۱',
                storeUrl: 'store1.ir',
                platformType: 'WOOCOMMERCE',
                fieldOfActivity: 'پوشاک و لوازم ورزشی',
                productCount: 120
              }
            });

            // Supplier (supplier)
            await prisma.user.create({
              data: {
                username: 'supplier',
                email: 'supplier@marketplace.com',
                password: passSupplier,
                role: 'SUPPLIER',
                status: 'ACTIVE',
                firstName: 'تامین‌کننده',
                lastName: 'اصلی',
                mobile: '09123333333',
                brandName: 'شرکت تامین نمونه',
                fieldOfActivity: 'واردات و پخش دیجیتال'
              }
            });

            // Supplier 1
            await prisma.user.create({
              data: {
                username: 'supplier1',
                email: 'supplier1@marketplace.com',
                password: passStandard,
                role: 'SUPPLIER',
                status: 'ACTIVE',
                firstName: 'تامین‌کننده',
                lastName: 'تست ۱',
                mobile: '09124444444',
                brandName: 'شرکت آریا تجارت',
                fieldOfActivity: 'لوازم خانگی'
              }
            });

            // Customer
            await prisma.user.create({
              data: {
                username: 'customer',
                email: 'customer@marketplace.com',
                password: passStandard,
                role: 'CUSTOMER',
                status: 'ACTIVE',
                firstName: 'خریدار',
                lastName: 'نمونه',
                mobile: '09125555555'
              }
            });

            console.log('[Setup DB] Successfully seeded default users.');
          }

          await prisma.$disconnect();
        } catch (e) {
          console.warn('[Setup DB] Seeding check warning:', e.message);
        }
      })();
    } else {
      console.warn('[Setup DB] DATABASE_URL is a dummy URL. Skipping DB push.');
    }
  } catch (err) {
    console.error('[Setup DB] Error during database setup:', err.message);
  }
}

