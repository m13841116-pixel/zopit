const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'SUPPLIER' } });
    if (!user) {
      console.log('No supplier user found.');
      return;
    }
    console.log('Supplier:', user.id, user.username);

    const product = await prisma.product.create({
      data: {
        supplierId: user.id,
        categoryId: 1, // assuming category 1 exists
        name: 'Test Product',
        supplierBasePrice: 1000,
        inventory: 10,
        status: 'ACTIVE',
      }
    });
    console.log('Product created:', product);
  } catch (err) {
    console.error('Error creating product:', err);
  }
}
test();
