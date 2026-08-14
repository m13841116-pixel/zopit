const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `app.post('/api/admin/settlements/:id/approve', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const payoutId = req.params.id;
    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { wallet: { include: { supplier: true } } }
    });
    if (!payoutRequest) {
      return res.status(404).json({ error: 'درخواست تسویه یافت نشد' });
    }
    if (payoutRequest.status !== 'PENDING' && payoutRequest.status !== 'PROCESSING') {
      return res.status(400).json({ error: 'درخواست در وضعیت نهایی است' });
    }

    const shaba = payoutRequest.shaba || payoutRequest.wallet?.supplier?.shaba;
    if (!shaba) {
      return res.status(400).json({ error: 'شماره شبای تامین‌کننده یافت نشد.' });
    }

    const paymentGateway = await PaymentServiceFactory.getService();
    const payoutResult = await paymentGateway.requestPayout(
      payoutRequest.amount * 10,
      shaba,
      \`تسویه حساب تامین‌کننده \${payoutRequest.wallet?.supplier?.companyName || payoutRequest.wallet?.supplier?.firstName || ''} - شماره \${payoutRequest.id}\`
    );

    if (payoutResult.success) {
      await prisma.$transaction(async (tx) => {
        await tx.payoutRequest.update({
          where: { id: payoutId },
          data: { 
            status: 'SUCCESS',
            trackId: payoutResult.trackId,
            paymentDate: new Date(),
            paymentNotes: 'پرداخت خودکار از طریق درگاه زیبال',
            financiallyLocked: true
          }
        });
        await tx.ledgerEntry.updateMany({
          where: { referenceId: payoutId, type: 'WITHDRAWAL' },
          data: { status: 'COMPLETED' }
        });
      });
      return res.json({ success: true, message: 'تسویه حساب با موفقیت از طریق درگاه پرداخت انجام و نهایی شد.' });
    } else {
      await prisma.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'PROCESSING' }
      });
      return res.json({ success: true, message: 'درخواست تسویه تایید شد و در وضعیت در حال پردازش قرار گرفت. (انتقال خودکار ناموفق بود)' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

const startIndex = code.indexOf(`app.post('/api/admin/settlements/:id/approve', authenticateToken, requireAdmin, async (req: any, res: any) => {`);
if (startIndex !== -1) {
  const endIndex = code.indexOf(`app.post('/api/admin/settlements/:id/reject', authenticateToken, requireAdmin, async (req: any, res: any) => {`, startIndex);
  if (endIndex !== -1) {
    code = code.substring(0, startIndex) + replacement + '\n' + code.substring(endIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Success");
  } else {
    console.log("Could not find end index");
  }
} else {
  console.log("Could not find start index");
}
