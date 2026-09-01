import { getPrisma } from '../prisma.js';

export function registerDiscountRoutes(app: any, authenticateToken: any, requireSuperAdmin: any) {
  const prisma = getPrisma();

  // Create discount code
  app.post('/api/admin/discounts', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { code, discountType, discountValue, maxUses, expiryDate, applicablePlan, isPublic, title } = req.body;
      const newCode = await prisma.discountCode.create({
        data: {
          code: code.toUpperCase(),
          discountType: discountType || 'PERCENTAGE',
          discountValue: parseFloat(discountValue),
          applicablePlan: applicablePlan || 'ALL', // 'ALL', 'PRO', 'PRO_MAX'
          isPublic: isPublic === true || isPublic === 'true',
          title: title ? String(title).trim() : null,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        }
      });
      res.json(newCode);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // List discount codes for Admin
  app.get('/api/admin/discounts', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(codes);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Toggle status / update properties
  app.patch('/api/admin/discounts/:id', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { isActive, isPublic, applicablePlan, title } = req.body;
      const updateData: any = {};
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;
      if (applicablePlan) updateData.applicablePlan = applicablePlan;
      if (title !== undefined) updateData.title = title;

      const code = await prisma.discountCode.update({
        where: { id: parseInt(id) },
        data: updateData
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

  // Public promotions (Active public discount codes to display on Pro registration page)
  app.get('/api/public/discounts/promotions', async (req: any, res: any) => {
    try {
      const codes = await prisma.discountCode.findMany({
        where: {
          isActive: true,
          isPublic: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      // Filter out expired or exhausted ones in memory
      const now = new Date();
      const validPromotions = codes.filter((d: any) => {
        if (d.expiryDate && new Date(d.expiryDate) < now) return false;
        if (d.maxUses && d.usedCount >= d.maxUses) return false;
        return true;
      });

      res.json(validPromotions);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Validation function helper
  const validateDiscount = async (codeStr: string, planType?: string) => {
    if (!codeStr) throw new Error('لطفاً کد تخفیف را وارد کنید');
    const cleanCode = codeStr.trim().toUpperCase();
    const discount = await prisma.discountCode.findUnique({ where: { code: cleanCode } });
    
    if (!discount) throw new Error('کد تخفیف وارد شده معتبر نیست');
    if (!discount.isActive) throw new Error('این کد تخفیف در حال حاضر غیرفعال می‌باشد');
    if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) {
      throw new Error('مهلت استفاده از این کد تخفیف به پایان رسیده است');
    }
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      throw new Error('سقف مجاز استفاده از این کد تخفیف تکمیل شده است');
    }

    // Check plan restriction (PRO vs PRO_MAX vs ALL)
    if (planType && discount.applicablePlan && discount.applicablePlan !== 'ALL') {
      const targetPlan = discount.applicablePlan === 'PRO_MAX' ? 'PRO_MAX' : 'PRO';
      const userPlan = planType === 'PRO_MAX' ? 'PRO_MAX' : 'PRO';
      if (targetPlan !== userPlan) {
        const planNameFa = targetPlan === 'PRO_MAX' ? 'پرومکس (PRO MAX)' : 'پرو (PRO)';
        throw new Error(`این کد تخفیف منحصراً ویژه اشتراک ${planNameFa} صادر شده است.`);
      }
    }

    return discount;
  };

  // Validate discount code (Public / Store Manager)
  app.post('/api/public/discounts/validate', async (req: any, res: any) => {
    try {
      const { code, planType } = req.body;
      const discount = await validateDiscount(code, planType);
      res.json(discount);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Apply discount for store manager
  app.post('/api/store-manager/pro/apply-discount', async (req: any, res: any) => {
    try {
      const { code, planType } = req.body;
      const discount = await validateDiscount(code, planType);
      res.json(discount);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
}

