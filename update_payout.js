const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `app.post('/api/admin/settlements/:id/approve', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const payoutId = req.params.id;
    const payoutRequest = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });

    if (!payoutRequest) {
      return res.status(404).json({ error: 'درخواست تسویه یافت نشد' });
    }

    if (payoutRequest.status !== 'PENDING' && payoutRequest.status !== 'PROCESSING') {
      return res.status(400).json({ error: 'درخواست در وضعیت نهایی است' });
    }

    await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'PROCESSING' }
    });

    res.json({ success: true, message: 'درخواست تسویه تایید شد و در وضعیت در حال پردازش قرار گرفت.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

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

    // Process payout through Zibal simulation automatically
    const paymentGateway = await PaymentServiceFactory.getService();
    const payoutResult = await paymentGateway.requestPayout(
      payoutRequest.amount * 10, // Amount in Rials
      shaba,
      \`تسویه حساب تامین‌کننده \${payoutRequest.wallet?.supplier?.companyName || payoutRequest.wallet?.supplier?.firstName || ''} - شماره \${payoutRequest.id}\`
    );

    if (payoutResult.success) {
      // Mark as success immediately
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

        // Update associated ledger entry
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

content = content.replace(target, replacement);
fs.writeFileSync('server.ts', content, 'utf8');
