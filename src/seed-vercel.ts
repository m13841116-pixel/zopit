import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('[Seed Vercel] Starting database seeding during build...');
  try {
    const adminUser = process.env.SUPER_ADMIN_USERNAME || 'admin';
    const adminPass = process.env.SUPER_ADMIN_PASSWORD || '!Bahankala@2026';
    const hashedPassword = await bcrypt.hash(adminPass, 10);

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { username: adminUser }
        ]
      }
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: adminUser,
          email: 'admin@marketplace.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          firstName: 'مدیر',
          lastName: 'ارشد',
          mobile: '09120000000'
        }
      });
      console.log('[Seed Vercel] Super Admin user created successfully.');
    } else {
      console.log('[Seed Vercel] Super Admin user already exists.');
    }

    const categoryCount = await prisma.category.count();
    if (categoryCount <= 1) {
      console.log('[Seed Vercel] Seeding standard categories...');
      const defaultCategories = [
        "موبایل", "لپ‌تاپ", "کالای دیجیتال", "خانه و آشپزخانه", 
        "لوازم خانگی برقی", "آرایشی و بهداشتی", "مد و پوشاک", 
        "طلا و نقره", "خودرو و موتورسیکلت", "سلامت و پزشکی", 
        "ابزارآلات و تجهیزات", "کتاب و هنر", "ورزش و سفر", 
        "اسباب بازی کودک و نوزاد"
      ];
      for (const catName of defaultCategories) {
        const exists = await prisma.category.findFirst({ where: { name: catName } });
        if (!exists) {
          await prisma.category.create({ data: { name: catName, slug: catName.replace(/\s+/g, '-') } });
        }
      }
    }

    console.log('[Seed Vercel] Database seeding completed successfully.');
  } catch (err: any) {
    console.error('[Seed Vercel] Seeding failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
