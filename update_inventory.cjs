const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Find where order is created and deduct inventory
const deductInventorySnippet = `
      // Deduct inventory
      for (const i of groupItems) {
        if (i.variantId) {
          await prisma.productVariant.update({
            where: { id: i.variantId },
            data: { stock: { decrement: i.quantity } }
          });
        }
        await prisma.product.update({
          where: { id: i.product.id },
          data: { inventory: { decrement: i.quantity } }
        });
      }
`;

content = content.replace(
  /orderSource: 'store',\s*items: {/,
  deductInventorySnippet + "\n          orderSource: 'store',\n          items: {"
);

fs.writeFileSync('server.ts', content);
