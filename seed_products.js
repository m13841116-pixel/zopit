const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get an existing supplier or create one
  let supplier = await prisma.user.findFirst({
    where: { role: 'SUPPLIER' }
  });

  if (!supplier) {
    supplier = await prisma.user.create({
      data: {
        username: 'test_supplier',
        password: 'password',
        role: 'SUPPLIER',
        brandName: 'تامین‌کننده نمونه',
        firstName: 'علی',
        lastName: 'تست'
      }
    });
  }

  // Create products
  const products = [
    {
      title: 'مادربرد ایسوس PRIME H610M-K',
      description: 'مادربرد حرفه‌ای برای سیستم‌های خانگی و اداری با قابلیت پشتیبانی از پردازنده‌های نسل ۱۲ اینتل',
      categoryId: '1',
      supplierBasePrice: 4200000,
      stock: 15,
      sku: 'ASUS-H610',
      brand: 'ASUS',
      warranty: '۱۸ ماهه اصلی',
      images: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=500&fit=crop',
      status: 'APPROVED',
      isPublic: true,
      marginType: 'PERCENTAGE',
      marginValue: 10
    },
    {
      title: 'کارت گرافیک گیگابایت RTX 3060',
      description: 'کارت گرافیک قدرتمند مناسب برای گیمینگ و کارهای گرافیکی سنگین',
      categoryId: '2',
      supplierBasePrice: 18500000,
      stock: 5,
      sku: 'GIGA-3060',
      brand: 'Gigabyte',
      warranty: '۳۶ ماهه آواژنگ',
      images: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&h=500&fit=crop',
      status: 'APPROVED',
      isPublic: true,
      marginType: 'PERCENTAGE',
      marginValue: 12
    },
    {
      title: 'رم کورسیر 16GB DDR4',
      description: 'رم قدرتمند کورسیر فرکانس 3200',
      categoryId: '3',
      supplierBasePrice: 2100000,
      stock: 30,
      sku: 'COR-16G',
      brand: 'Corsair',
      warranty: 'مادام العمر',
      images: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&h=500&fit=crop',
      status: 'APPROVED',
      isPublic: true,
      marginType: 'FIXED',
      marginValue: 200000
    }
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        ...p,
        supplierId: supplier.id
      }
    });
  }

  console.log('Test products created successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
