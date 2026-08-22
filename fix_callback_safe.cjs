const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `
    // If result is 100 (successful verification)
    if (resCode === 100) {
      // Find the associated order (either by trackingCode matching trackId, or by orderId query)
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

      if (orderToUpdate) {
        if (orderToUpdate.status === 'PAID' || orderToUpdate.status === 'SUCCESS' || orderToUpdate.status === 'COMPLETED' || orderToUpdate.status === 'WAITING_SUPPLIER_CONFIRMATION') {
          console.log(\`[Payment Callback Idempotency] Order #\${orderToUpdate.id} is already marked as paid/processed. Skipping duplicate wallet credit.\`);
          return res.redirect(\`\${redirectBase}/checkout/success?trackId=\${trackId}&orderId=\${orderToUpdate.id}\`);
        }
`;

const replaceStr = `
    // If result is 100 (successful verification)
    if (resCode === 100) {
      // Find the associated order (either by trackingCode matching trackId, or by orderId query)
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

      if (orderToUpdate) {
        // Amount matching
        if (verifyData.amount) {
           const expectedAmount = Math.round(orderToUpdate.totalAmount * 10);
           if (Number(verifyData.amount) !== expectedAmount) {
              console.error(\`Amount mismatch: Expected \${expectedAmount}, got \${verifyData.amount}\`);
              return res.redirect(\`\${redirectBase}/checkout/failed?trackId=\${trackId}&orderId=\${orderToUpdate.id}&reason=amount_mismatch\`);
           }
        }
        
        if (orderToUpdate.status === 'PAID' || orderToUpdate.status === 'SUCCESS' || orderToUpdate.status === 'COMPLETED') {
          console.log(\`[Payment Callback Idempotency] Order #\${orderToUpdate.id} is already marked as paid/processed. Skipping duplicate wallet credit.\`);
          return res.redirect(\`\${redirectBase}/checkout/success?trackId=\${trackId}&orderId=\${orderToUpdate.id}\`);
        }
`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced successfully!");
} else {
  console.log("Target string not found!");
}
