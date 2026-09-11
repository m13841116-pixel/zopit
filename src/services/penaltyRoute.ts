import { Decimal } from '@prisma/client/runtime/library';
import jwt from 'jsonwebtoken';

/**
 * Automate calculation of Supplier Metrics:
 * - Fulfillment Rate: percentage of successfully shipped items vs cancelled/rejected
 * - Average Processing Time: average hours from order placement to shipping
 * - Cancellation Rate: percentage of cancelled items
 * - Performance Score & Warning Level based on 20% cancellation threshold & penalty points
 */
export async function computeAndSaveSupplierMetrics(prisma: any, supplierId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: supplierId }
    });
    if (!user) return null;

    const items = await prisma.orderItem.findMany({
      where: { supplierId },
      include: {
        order: {
          include: {
            statusHistory: true
          }
        }
      }
    });

    const totalOrdersCount = items.length;
    const shippedItems = items.filter((i: any) => ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(i.status));
    const cancelledItems = items.filter((i: any) => ['CANCELLED', 'REJECTED'].includes(i.status));
    const finalizedCount = shippedItems.length + cancelledItems.length;

    let fulfillmentRate = 100.0;
    let cancellationRate = 0.0;

    if (finalizedCount > 0) {
      fulfillmentRate = (shippedItems.length / finalizedCount) * 100;
      cancellationRate = (cancelledItems.length / finalizedCount) * 100;
    } else if (totalOrdersCount > 0) {
      fulfillmentRate = 100.0;
      cancellationRate = 0.0;
    }

    // Processing Time calculation
    let totalProcessingHours = 0;
    let validProcessingCount = 0;

    for (const item of shippedItems) {
      const order = item.order;
      if (!order) continue;

      const orderCreated = new Date(order.createdAt).getTime();
      // Look for SHIPPED status history timestamp
      const shippedHistory = order.statusHistory?.find((h: any) => h.toStatus === 'SHIPPED');
      const shippedTime = shippedHistory
        ? new Date(shippedHistory.createdAt).getTime()
        : new Date(order.updatedAt || order.createdAt).getTime();

      const diffHours = Math.max(0.5, (shippedTime - orderCreated) / (1000 * 60 * 60));
      totalProcessingHours += diffHours;
      validProcessingCount++;
    }

    let avgProcessingTimeHours = 12.0;
    if (validProcessingCount > 0) {
      avgProcessingTimeHours = totalProcessingHours / validProcessingCount;
    } else if (user.avgProcessingTimeHours) {
      avgProcessingTimeHours = user.avgProcessingTimeHours;
    }

    // Penalty Points & Warning Level
    const penaltyPoints = user.penaltyPoints || 0;
    let warningLevel = user.warningLevel || 'NONE';

    // Auto-flag "Needs Review" / Warning if cancellation rate > 20% (with at least 3 orders)
    if (finalizedCount >= 3 && cancellationRate > 20) {
      if (warningLevel === 'NONE') {
        warningLevel = cancellationRate > 40 ? 'MEDIUM' : 'LOW';
      }
    }

    // Auto calculate performance score (100 - penalties - excess cancellations)
    const excessCancelPenalty = (finalizedCount >= 3 && cancellationRate > 10)
      ? Math.round((cancellationRate - 10) * 1.2)
      : 0;
    const computedScore = Math.max(0, Math.min(100, 100 - penaltyPoints - excessCancelPenalty));

    const updated = await prisma.user.update({
      where: { id: supplierId },
      data: {
        fulfillmentRate: parseFloat(fulfillmentRate.toFixed(1)),
        avgProcessingTimeHours: parseFloat(avgProcessingTimeHours.toFixed(1)),
        performanceScore: computedScore,
        warningLevel
      }
    });

    return {
      user: updated,
      totalOrdersCount,
      shippedCount: shippedItems.length,
      cancelledCount: cancelledItems.length,
      fulfillmentRate: parseFloat(fulfillmentRate.toFixed(1)),
      cancellationRate: parseFloat(cancellationRate.toFixed(1)),
      avgProcessingTimeHours: parseFloat(avgProcessingTimeHours.toFixed(1)),
      performanceScore: computedScore,
      warningLevel,
      badges: {
        isFastShipper: avgProcessingTimeHours <= 24,
        isGoldSupplier: fulfillmentRate >= 95 && computedScore >= 80,
        isNeedsReview: (finalizedCount >= 3 && cancellationRate > 20) || warningLevel !== 'NONE' || computedScore < 70
      }
    };
  } catch (err) {
    console.error('Error computing supplier metrics for supplierId', supplierId, err);
    return null;
  }
}

export default function registerPenaltyRoutes(app: any, prisma: any, authenticateToken?: any) {
  // 1. Get Penalty Stats
  app.get('/api/admin/penalty-stats', async (req: any, res: any) => {
    try {
      const totalPenalties = await prisma.supplierPenalty.count();
      
      const topViolators = await prisma.user.findMany({
        where: { role: 'SUPPLIER', penaltyPoints: { gt: 0 } },
        orderBy: { penaltyPoints: 'desc' },
        take: 5,
        select: { id: true, username: true, penaltyPoints: true, warningLevel: true }
      });

      const recentPenalties = await prisma.supplierPenalty.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          supplier: {
            select: { id: true, username: true, brandName: true }
          }
        }
      });

      res.json({
        totalPenalties,
        topViolators,
        recentPenalties
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 2. Manage Penalty Rules (Presets)
  app.get('/api/admin/penalty-rules', async (req: any, res: any) => {
    try {
      const rules = await prisma.penaltyRule.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/admin/penalty-rules', async (req: any, res: any) => {
    try {
      const { title, description, negativePoints, autoNotification, isActive } = req.body;
      const rule = await prisma.penaltyRule.create({
        data: {
          title,
          description,
          negativePoints: parseInt(negativePoints, 10) || 0,
          autoNotification: autoNotification !== false,
          isActive: isActive !== false
        }
      });
      res.json(rule);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.put('/api/admin/penalty-rules/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const ruleId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;
      if (updateData.negativePoints !== undefined) {
        updateData.negativePoints = parseInt(updateData.negativePoints, 10) || 0;
      }

      const rule = await prisma.penaltyRule.update({
        where: { id: ruleId },
        data: updateData
      });
      res.json(rule);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.delete('/api/admin/penalty-rules/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const ruleId = parseInt(id, 10);
      await prisma.penaltyRule.delete({
        where: { id: ruleId }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 3. Penalty Configurations
  app.get('/api/admin/penalty-config', async (req: any, res: any) => {
    try {
      let config = await prisma.penaltyConfig.findFirst();
      if (!config) {
        config = await prisma.penaltyConfig.create({
          data: {
            id: 1,
            underReviewThreshold: 20,
            temporarySuspensionThreshold: 40,
            blockedThreshold: 60,
            autoSuspensionEnabled: true
          }
        });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.put('/api/admin/penalty-config', async (req: any, res: any) => {
    try {
      const { underReviewThreshold, temporarySuspensionThreshold, blockedThreshold, autoSuspensionEnabled } = req.body;
      const config = await prisma.penaltyConfig.upsert({
        where: { id: 1 },
        update: {
          underReviewThreshold: parseInt(underReviewThreshold, 10),
          temporarySuspensionThreshold: parseInt(temporarySuspensionThreshold, 10),
          blockedThreshold: parseInt(blockedThreshold, 10),
          autoSuspensionEnabled: !!autoSuspensionEnabled
        },
        create: {
          id: 1,
          underReviewThreshold: parseInt(underReviewThreshold, 10) || 20,
          temporarySuspensionThreshold: parseInt(temporarySuspensionThreshold, 10) || 40,
          blockedThreshold: parseInt(blockedThreshold, 10) || 60,
          autoSuspensionEnabled: autoSuspensionEnabled !== false
        }
      });
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 4. List Suppliers for admin
  app.get('/api/admin/suppliers', async (req: any, res: any) => {
    try {
      const suppliers = await prisma.user.findMany({
        where: { role: 'SUPPLIER' },
        select: {
          id: true,
          username: true,
          brandName: true,
          firstName: true,
          lastName: true,
          mobile: true,
          status: true,
          performanceScore: true,
          penaltyPoints: true,
          warningLevel: true
        }
      });
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 5. Supplier Penalty Profile
  app.get('/api/admin/suppliers/:id/penalty-profile', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const supplierId = parseInt(id, 10);
      if (isNaN(supplierId)) {
        return res.status(400).json({ error: 'Invalid supplier ID' });
      }

      const supplier = await prisma.user.findUnique({
        where: { id: supplierId },
        select: {
          id: true,
          username: true,
          brandName: true,
          performanceScore: true,
          penaltyPoints: true,
          warningLevel: true,
          status: true
        }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      const penalties = await prisma.supplierPenalty.findMany({
        where: { supplierId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ supplier, penalties });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 6. Apply Penalty to Supplier
  app.post('/api/admin/suppliers/:id/apply-penalty', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const supplierId = parseInt(id, 10);
      const { reason, points, description, orderNumber } = req.body;

      if (isNaN(supplierId)) {
        return res.status(400).json({ error: 'Invalid supplier ID' });
      }

      const supplier = await prisma.user.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      const penaltyPts = parseInt(points, 10) || 0;

      // Update supplier score & points
      const newPenaltyPoints = (supplier.penaltyPoints || 0) + penaltyPts;
      const newPerformanceScore = Math.max(0, 100 - newPenaltyPoints);

      // Determine warning level and system status based on thresholds
      const config = await prisma.penaltyConfig.findFirst() || {
        underReviewThreshold: 20,
        temporarySuspensionThreshold: 40,
        blockedThreshold: 60,
        autoSuspensionEnabled: true
      };

      let warningLevel = 'NONE';
      let status = supplier.status || 'ACTIVE';

      if (newPenaltyPoints >= config.blockedThreshold) {
        warningLevel = 'HIGH';
        if (config.autoSuspensionEnabled) status = 'BLOCKED';
      } else if (newPenaltyPoints >= config.temporarySuspensionThreshold) {
        warningLevel = 'MEDIUM';
        if (config.autoSuspensionEnabled) status = 'SUSPENDED';
      } else if (newPenaltyPoints >= config.underReviewThreshold) {
        warningLevel = 'LOW';
        if (config.autoSuspensionEnabled) status = 'WARNING';
      }

      // Create penalty record and update user in a transaction
      const [penaltyRecord, updatedUser] = await prisma.$transaction([
        prisma.supplierPenalty.create({
          data: {
            supplierId,
            reason,
            points: penaltyPts,
            description: description || '',
            orderNumber: orderNumber || null,
            adminName: 'مدیریت سیستم'
          }
        }),
        prisma.user.update({
          where: { id: supplierId },
          data: {
            penaltyPoints: newPenaltyPoints,
            performanceScore: newPerformanceScore,
            warningLevel,
            status
          }
        })
      ]);

      res.json({ success: true, penalty: penaltyRecord, supplier: updatedUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // 7. Get Supplier's Own Performance (for Supplier Dashboard & SupplierPerformancePanel)
  const performanceHandler = async (req: any, res: any) => {
    try {
      let userId = req.user?.userId || req.user?.id;
      if (!userId) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
          try {
            const decoded: any = jwt.decode(token);
            if (decoded) {
              userId = decoded.userId || decoded.id;
            }
          } catch (e) {}
        }
      }
      // Fallback for dev / demo supplier
      if (!userId) {
        userId = 5;
      }

      // Compute fresh metrics
      const computed = await computeAndSaveSupplierMetrics(prisma, Number(userId));

      const supplierFromDb = computed?.user || await prisma.user.findUnique({
        where: { id: Number(userId) }
      }).catch(() => null);

      const supplier = supplierFromDb || {
        id: Number(userId),
        username: 'تامین‌کننده',
        brandName: 'تامین‌کننده رسمی زوپیت',
        role: 'SUPPLIER',
        status: 'ACTIVE',
        performanceScore: 100,
        fulfillmentRate: 100.0,
        avgProcessingTimeHours: 12.0,
        penaltyPoints: 0,
        warningLevel: 'NONE'
      };

      // Guarantee defaults if null in DB
      if (supplier.performanceScore === undefined || supplier.performanceScore === null) {
        supplier.performanceScore = 100;
      }
      if (supplier.penaltyPoints === undefined || supplier.penaltyPoints === null) {
        supplier.penaltyPoints = 0;
      }
      if (!supplier.warningLevel) {
        supplier.warningLevel = 'NONE';
      }
      if (!supplier.status) {
        supplier.status = 'ACTIVE';
      }

      const penalties = (await prisma.supplierPenalty.findMany({
        where: { supplierId: Number(userId) },
        orderBy: { createdAt: 'desc' }
      }).catch(() => [])) || [];

      // Count distinct orders affected by penalties
      const affectedOrders = penalties
        .map((p: any) => p.orderNumber)
        .filter((o: any) => Boolean(o));
      
      const distinctAffectedOrders = Array.from(new Set(affectedOrders));

      const productsCount = (await prisma.product.count({ where: { supplierId: Number(userId) } }).catch(() => 0)) || 0;
      const ordersCount = computed?.totalOrdersCount ?? ((await prisma.orderItem.count({ where: { supplierId: Number(userId) } }).catch(() => 0)) || 0);
      const completedOrders = computed?.shippedCount ?? ((await prisma.orderItem.count({ where: { supplierId: Number(userId), status: { in: ['SHIPPED', 'DELIVERED', 'COMPLETED'] } } }).catch(() => 0)) || 0);

      const score = Number(supplier.performanceScore) || 100;
      let grade = 'A+';
      if (score < 50) grade = 'F';
      else if (score < 60) grade = 'D';
      else if (score < 70) grade = 'C';
      else if (score < 80) grade = 'B';
      else if (score < 90) grade = 'A';

      const fulfillmentRate = computed?.fulfillmentRate ?? (typeof supplier.fulfillmentRate === 'number' ? supplier.fulfillmentRate : 100.0);
      const avgProcessingTimeHours = computed?.avgProcessingTimeHours ?? (typeof supplier.avgProcessingTimeHours === 'number' ? supplier.avgProcessingTimeHours : 12.0);
      const cancellationRate = computed?.cancellationRate ?? 0;

      const badges = {
        isFastShipper: avgProcessingTimeHours <= 24,
        isGoldSupplier: fulfillmentRate >= 95 && score >= 80,
        isNeedsReview: (ordersCount >= 3 && cancellationRate > 20) || supplier.warningLevel !== 'NONE' || score < 70
      };

      res.json({
        supplier,
        penalties,
        distinctAffectedOrders,
        affectedOrdersCount: affectedOrders.length,
        // Combined flat fields for complete dashboard compatibility
        score,
        grade,
        status: supplier.status,
        warningLevel: supplier.warningLevel,
        totalProducts: productsCount,
        totalOrders: ordersCount,
        completedOrders,
        fulfillmentRate,
        cancellationRate,
        avgProcessingTimeHours,
        onTimeDeliveryRate: 100,
        penaltiesCount: penalties.length,
        walletBalance: 0,
        badges
      });
    } catch (error: any) {
      console.error('Error in /api/supplier/performance:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  if (authenticateToken) {
    app.get('/api/supplier/performance', authenticateToken, performanceHandler);
  } else {
    app.get('/api/supplier/performance', performanceHandler);
  }
}
