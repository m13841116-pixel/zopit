import { Express, Request, Response } from 'express';
import {
  validateWholesaleTiers,
  calculateAuthoritativeWholesalePricing,
  detectWholesaleAnomalies,
  buildWholesaleOrderSnapshot
} from './pricing/wholesalePricingEngine';

export function registerWholesaleRoutes(
  app: Express,
  prisma: any,
  authenticateToken: any,
  requireSupplier: any,
  requireStoreManager: any,
  requireAdmin: any
) {
  // 1. Calculate Authoritative Wholesale Pricing for any quantity (Server-Authoritative)
  app.post('/api/products/:id/wholesale-calculation', async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id, 10);
      const { quantity, variantId } = req.body;

      if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({ error: 'شناسه محصول نامعتبر است.', success: false });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          wholesaleTiers: {
            orderBy: { minQuantity: 'asc' }
          },
          variants: true
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'محصول یافت نشد.', success: false });
      }

      let selectedVariant = null;
      if (variantId) {
        selectedVariant = product.variants?.find((v: any) => v.id === parseInt(String(variantId), 10)) || null;
      }

      const calculation = calculateAuthoritativeWholesalePricing({
        product,
        variant: selectedVariant,
        quantity: parseInt(String(quantity || 1), 10)
      });

      return res.json({
        success: true,
        calculation,
        wholesaleTiers: product.wholesaleTiers || []
      });
    } catch (err: any) {
      console.error('[Wholesale Calculation API Error]:', err);
      return res.status(500).json({ error: 'خطا در محاسبه قیمت همکاری و عمده', success: false });
    }
  });

  // 2. Get Wholesale Tiers for a Supplier's Product
  app.get(
    '/api/supplier/products/:id/wholesale-tiers',
    authenticateToken,
    requireSupplier,
    async (req: any, res: Response) => {
      try {
        const productId = parseInt(req.params.id, 10);
        const supplierId = req.user.supplierId || req.user.id || req.user.userId;

        const product = await prisma.product.findFirst({
          where: { id: productId, supplierId },
          include: {
            wholesaleTiers: {
              orderBy: { minQuantity: 'asc' }
            }
          }
        });

        if (!product) {
          return res.status(404).json({ error: 'محصول یافت نشد یا دسترسی مجاز نیست.', success: false });
        }

        const anomalyCheck = detectWholesaleAnomalies(product);

        return res.json({
          success: true,
          supplierBasePrice: product.supplierBasePrice,
          wholesaleTiers: product.wholesaleTiers || [],
          anomalies: anomalyCheck.anomalies,
          hasAnomalies: anomalyCheck.hasAnomalies
        });
      } catch (err: any) {
        console.error('[Supplier Get Wholesale Tiers Error]:', err);
        return res.status(500).json({ error: 'خطا در دریافت پله‌های خرید عمده', success: false });
      }
    }
  );

  // 3. Update Wholesale Tiers for a Supplier's Product with Server-Side Validation
  app.put(
    '/api/supplier/products/:id/wholesale-tiers',
    authenticateToken,
    requireSupplier,
    async (req: any, res: Response) => {
      try {
        const productId = parseInt(req.params.id, 10);
        const supplierId = req.user.supplierId || req.user.id || req.user.userId;
        const { wholesaleTiers } = req.body;

        const product = await prisma.product.findFirst({
          where: { id: productId, supplierId }
        });

        if (!product) {
          return res.status(404).json({ error: 'محصول یافت نشد یا شما مالک آن نیستید.', success: false });
        }

        // Validate wholesale tiers against business rules
        const validation = validateWholesaleTiers(wholesaleTiers || [], product.supplierBasePrice);
        if (!validation.valid) {
          return res.status(400).json({
            error: validation.errors[0] || 'تنظیمات پله‌های خرید عمده معتبر نمی‌باشد.',
            errors: validation.errors,
            success: false
          });
        }

        // Atomic update of wholesale tiers in transaction
        const result = await prisma.$transaction(async (tx: any) => {
          // Delete existing tiers
          await tx.wholesalePriceTier.deleteMany({
            where: { productId }
          });

          // Insert validated tiers
          if (validation.normalizedTiers.length > 0) {
            await tx.wholesalePriceTier.createMany({
              data: validation.normalizedTiers.map((t) => ({
                productId,
                minQuantity: t.minQuantity,
                maxQuantity: t.maxQuantity,
                unitPrice: t.unitPrice
              }))
            });
          }

          // Fetch updated product with tiers
          return await tx.product.findUnique({
            where: { id: productId },
            include: {
              wholesaleTiers: {
                orderBy: { minQuantity: 'asc' }
              }
            }
          });
        });

        // Audit logging
        try {
          await prisma.auditTrail.create({
            data: {
              actorId: supplierId,
              action: 'SUPPLIER_UPDATED_WHOLESALE_TIERS',
              resource: `PRODUCT:${productId}`,
              metadata: JSON.stringify({
                tierCount: validation.normalizedTiers.length,
                tiers: validation.normalizedTiers,
                timestamp: new Date().toISOString()
              })
            }
          });
        } catch (auditErr) {
          console.warn('Audit trail error:', auditErr);
        }

        return res.json({
          success: true,
          message: 'پله‌های قیمت عمده با موفقیت ذخیره شدند.',
          product: result
        });
      } catch (err: any) {
        console.error('[Supplier Update Wholesale Tiers Error]:', err);
        return res.status(500).json({ error: 'خطا در ذخیره‌سازی پله‌های خرید عمده', success: false });
      }
    }
  );

  // 4. Admin Inspect Wholesale Products and Anomaly Report
  app.get(
    '/api/admin/wholesale/products',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const products = await prisma.product.findMany({
          where: {
            wholesaleTiers: {
              some: {}
            }
          },
          include: {
            supplier: {
              select: {
                id: true,
                brandName: true,
                firstName: true,
                lastName: true,
                mobile: true,
                city: true,
                province: true
              }
            },
            category: true,
            wholesaleTiers: {
              orderBy: { minQuantity: 'asc' }
            }
          },
          orderBy: { updatedAt: 'desc' }
        });

        const enriched = products.map((prod: any) => {
          const anomalyInfo = detectWholesaleAnomalies(prod);
          return {
            ...prod,
            hasAnomalies: anomalyInfo.hasAnomalies,
            anomalies: anomalyInfo.anomalies,
            tierCount: prod.wholesaleTiers?.length || 0,
            maxDiscountTier: prod.wholesaleTiers?.length > 0
              ? prod.wholesaleTiers[prod.wholesaleTiers.length - 1]
              : null
          };
        });

        return res.json({
          success: true,
          count: enriched.length,
          products: enriched
        });
      } catch (err: any) {
        console.error('[Admin Wholesale Products API Error]:', err);
        return res.status(500).json({ error: 'خطا در دریافت لیست کالاهای عمده', success: false });
      }
    }
  );

  // 5. Admin Inspect All Platform Wholesale Anomalies
  app.get(
    '/api/admin/wholesale/anomalies',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const productsWithTiers = await prisma.product.findMany({
          where: {
            wholesaleTiers: {
              some: {}
            }
          },
          include: {
            supplier: {
              select: {
                id: true,
                brandName: true,
                firstName: true,
                lastName: true,
                mobile: true
              }
            },
            wholesaleTiers: {
              orderBy: { minQuantity: 'asc' }
            }
          }
        });

        const anomalyReports: any[] = [];
        for (const prod of productsWithTiers) {
          const check = detectWholesaleAnomalies(prod);
          if (check.hasAnomalies) {
            anomalyReports.push({
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              status: prod.status,
              supplier: prod.supplier,
              supplierBasePrice: prod.supplierBasePrice,
              tiers: prod.wholesaleTiers,
              anomalies: check.anomalies
            });
          }
        }

        return res.json({
          success: true,
          totalAnomalies: anomalyReports.length,
          anomalies: anomalyReports
        });
      } catch (err: any) {
        console.error('[Admin Wholesale Anomalies Error]:', err);
        return res.status(500).json({ error: 'خطا در تحلیل مغایرت‌های قیمت عمده', success: false });
      }
    }
  );
}

export default registerWholesaleRoutes;
