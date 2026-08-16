const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const injectionPoint = `// 7. Super Admin Update Pro Account`;

const newRoutes = `
// Super Admin Discount Codes API
app.get('/api/admin/discounts', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const discounts = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch discount codes' });
  }
});

app.post('/api/admin/discounts', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { code, discountType, discountValue, maxUses, expiryDate } = req.body;
    if (!code || !discountValue) return res.status(400).json({ error: 'Invalid data' });
    
    const existing = await prisma.discountCode.findUnique({ where: { code } });
    if (existing) return res.status(400).json({ error: 'کد تخفیف تکراری است' });

    const newDiscount = await prisma.discountCode.create({
      data: {
        code,
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });
    res.json(newDiscount);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create discount code' });
  }
});

app.delete('/api/admin/discounts/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.discountCode.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.patch('/api/admin/discounts/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    await prisma.discountCode.update({
      where: { id },
      data: { isActive }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.post('/api/store-manager/pro/apply-discount', authenticateToken, requireStoreManager, async (req: any, res: any) => {
  try {
    const { code } = req.body;
    const discount = await prisma.discountCode.findUnique({ where: { code } });
    if (!discount || !discount.isActive) {
      return res.status(400).json({ error: 'کد تخفیف نامعتبر یا منقضی شده است' });
    }
    if (discount.expiryDate && new Date() > discount.expiryDate) {
      return res.status(400).json({ error: 'کد تخفیف منقضی شده است' });
    }
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ error: 'ظرفیت این کد تخفیف به پایان رسیده است' });
    }
    
    res.json({
      success: true,
      discountType: discount.discountType,
      discountValue: discount.discountValue
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

`;

content = content.replace(injectionPoint, newRoutes + injectionPoint);
fs.writeFileSync('server.ts', content);
