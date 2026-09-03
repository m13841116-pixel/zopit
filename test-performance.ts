import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { status: { notIn: ['CANCELLED', 'REJECTED'] } } },
    include: {
      order: true,
      product: { include: { supplier: true } }
    }
  });
  console.log("Found", orderItems.length, "items");
}
main().catch(console.error).finally(() => prisma.$disconnect());
