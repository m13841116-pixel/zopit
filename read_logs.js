const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { id: 'desc' },
      take: 10
    });
    console.log('--- RECENT ACTIVITY LOGS ---');
    console.log(JSON.stringify(logs, null, 2));

    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' },
      take: 2,
      include: {
        images: true,
        variants: true
      }
    });
    console.log('--- RECENT PRODUCTS ---');
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Error running debug script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
