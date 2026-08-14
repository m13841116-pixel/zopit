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
console.log("Target found:", content.includes(target));
