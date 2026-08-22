const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ 1\. Read Merchant ID from Database[\s\S]*?if \(resCode === 100\) \{[\s\S]*?\/\/ Find the associated order/m;
const replacement = `const paymentGateway = await PaymentServiceFactory.getService();
    console.log(\`[Zibal Payment Verify] Verifying trackId: \${trackId}\`);
    
    // 1. Find the associated order (either by trackingCode matching trackId, or by orderId query)
`;

code = code.replace(regex, replacement);

const regex2 = /\/\/ Find the associated order \(either by trackingCode matching trackId, or by orderId query\)[\s\S]*?if \(!orderToUpdate && orderId\) \{[\s\S]*?\}[\s\S]*?\}[\s\S]*?if \(orderToUpdate\) \{/m;
const replacement2 = `let orderToUpdate: any = null;
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
      
      if (verifyData.success) {
      if (orderToUpdate) {`;

code = code.replace(regex2, replacement2);

const regex3 = /if \(orderToUpdate\.status === 'PAID' \|\| orderToUpdate\.status === 'SUCCESS' \|\| orderToUpdate\.status === 'COMPLETED' \|\| orderToUpdate\.status === 'WAITING_SUPPLIER_CONFIRMATION'\) \{/g;
const replacement3 = `if (orderToUpdate.status === 'PAID' || orderToUpdate.status === 'SUCCESS' || orderToUpdate.status === 'COMPLETED') {`;
code = code.replace(regex3, replacement3);

fs.writeFileSync('server.ts', code);
