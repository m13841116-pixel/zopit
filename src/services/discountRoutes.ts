import { getPrisma } from '../prisma.js';

export function registerDiscountRoutes(app: any, authenticateToken: any, requireSuperAdmin: any) {
  const prisma = getPrisma();

  // Create discount code
  app.post('/api/admin/discounts', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { code, discountType, discountValue, maxUses, expiryDate } = req.body;
      const newCode = await prisma.discountCode.create({
        data: {
          code: code.toUpperCase(),
          discountType,
          discountValue: parseFloat(discountValue),
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        }
      });
      res.json(newCode);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // List discount codes
  app.get('/api/admin/discounts', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(codes);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Toggle status
  app.patch('/api/admin/discounts/:id', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const code = await prisma.discountCode.update({
        where: { id: parseInt(id) },
        data: { isActive }
      });
      res.json(code);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete discount code
  app.delete('/api/admin/discounts/:id', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      await prisma.discountCode.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Validate discount code (Public/Store Manager)
  app.post('/api/public/discounts/validate', async (req: any, res: any) => {
    try {
      const { code } = req.body;
      const discount = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });
      
      if (!discount) return res.status(404).json({ error: 'کد تخفیف معتبر نیست' });
      if (!discount.isActive) return res.status(400).json({ error: 'این کد تخفیف غیرفعال شده است' });
      if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) return res.status(400).json({ error: 'انقضای این کد تخفیف به پایان رسیده است' });
      if (discount.maxUses && discount.usedCount >= discount.maxUses) return res.status(400).json({ error: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است' });

      res.json(discount);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
}
