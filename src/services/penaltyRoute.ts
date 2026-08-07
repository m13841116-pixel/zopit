import { Decimal } from '@prisma/client/runtime/library';

export default function registerPenaltyRoutes(app: any, prisma: any) {
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

  // 7. Get Supplier's Own Performance (for Supplier Dashboard)
  app.get('/api/supplier/performance', async (req: any, res: any) => {
    try {
      // Find user based on token. Fallback to supplierId from query or body if user is admin
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const supplier = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      const penalties = await prisma.supplierPenalty.findMany({
        where: { supplierId: userId },
        orderBy: { createdAt: 'desc' }
      });

      // Count distinct orders affected by penalties
      const affectedOrders = penalties
        .map((p: any) => p.orderNumber)
        .filter((o: any) => o);
      
      const distinctAffectedOrders = new Set(affectedOrders).size;

      res.json({
        supplier,
        penalties,
        distinctAffectedOrders,
        affectedOrdersCount: affectedOrders.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
}
