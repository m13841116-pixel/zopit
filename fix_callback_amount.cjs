const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// I will just use regex to replace the verification logic block
// from: const verifyData = await paymentGateway.verifyPayment(String(trackId), 0);
// to: the end of finding the order.

const regex = /\/\/ We pass 0 for amount to let verifyPayment just verify the status[\s\S]*?if \(\!orderToUpdate && orderId\) \{[\s\S]*?\}\n      \}/m;

const replacement = `// 1. Find the associated order (either by trackingCode matching trackId, or by orderId query)
      let orderToUpdate: any = null;
      if (trackId) {
        orderToUpdate = await prisma.order.findFirst({
          where: { trackingCode: String(trackId) },
          include: { items: true }
        }).catch(() => null);
      }
      if (!orderToUpdate && orderId) {
        const numericOrderId = parseInt(orderId.toString().replace(/\\D/g, ''), 10);
        if (!isNaN(numericOrderId)) {
          orderToUpdate = await prisma.order.findUnique({
            where: { id: numericOrderId },
            include: { items: true }
          }).catch(() => null);
        }
      }

      // 2. Determine actual amount from DB
      let expectedAmount = 0;
      if (orderToUpdate) {
        expectedAmount = Math.round(orderToUpdate.totalAmount * 10);
      }

      // 3. Verify Payment with Actual Amount
      console.log(\`[Zibal Payment Verify] Verifying trackId: \${trackId} with amount \${expectedAmount}\`);
      const verifyData = await paymentGateway.verifyPayment(String(trackId), expectedAmount);
      
      if (verifyData.success) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
