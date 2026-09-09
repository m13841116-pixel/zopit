
// --- Supplier Shipping Endpoints ---

// Get shipping profile
app.get('/api/supplier/shipping-profile', authenticateToken, requireSupplier, async (req: any, res: any) => {
  try {
    let profile = await prisma.supplierShippingProfile.findUnique({
      where: { supplierId: req.user.userId }
    });
    if (!profile) {
      profile = await prisma.supplierShippingProfile.create({
        data: { supplierId: req.user.userId, active: true }
      });
    }
    return res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: 'خطا در دریافت پروفایل پستی' });
  }
});

// Update shipping profile
app.put('/api/supplier/shipping-profile', authenticateToken, requireSupplier, async (req: any, res: any) => {
  try {
    const { provider, accountId, originAddress } = req.body;
    const profile = await prisma.supplierShippingProfile.upsert({
      where: { supplierId: req.user.userId },
      update: { provider, accountId, originAddress },
      create: { supplierId: req.user.userId, provider, accountId, originAddress, active: true }
    });
    return res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: 'خطا در ذخیره پروفایل پستی' });
  }
});

// Update tracking code & status for a supplier order group
app.put('/api/supplier/order-groups/:groupId/tracking', authenticateToken, requireSupplier, async (req: any, res: any) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { trackingCode, carrier, newStatus } = req.body;

    const group = await prisma.supplierOrderGroup.findFirst({
      where: { id: groupId, supplierId: req.user.userId }
    });

    if (!group) return res.status(404).json({ error: 'گروه سفارش یافت نشد.' });

    await prisma.$transaction(async (tx) => {
      if (trackingCode && trackingCode !== group.trackingCode) {
        await tx.trackingHistory.create({
          data: {
            supplierOrderGroupId: groupId,
            oldTrackingCode: group.trackingCode,
            newTrackingCode: trackingCode,
            carrier: carrier || group.shippingProvider,
            changedBy: req.user.username
          }
        });
      }

      await tx.supplierOrderGroup.update({
        where: { id: groupId },
        data: {
          trackingCode,
          shippingProvider: carrier || group.shippingProvider,
          status: newStatus || group.status,
          ...(newStatus === 'SHIPPED' && group.status !== 'SHIPPED' ? { shippedAt: new Date() } : {})
        }
      });
      
      if (newStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
         await tx.orderItem.updateMany({
           where: { supplierGroupId: groupId },
           data: { status: 'SHIPPED' }
         });
      }
      
      // Sync parent order status dynamically
      await syncSupplierGroupAndParentStatus(group.orderId, req.user.userId, tx);
    });

    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'خطا در ثبت کد رهگیری' });
  }
});

// Upload shipping label
app.post('/api/supplier/order-groups/:groupId/label', authenticateToken, requireSupplier, safeUploadMulter.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'فایلی انتخاب نشده است.' });
    
    const groupId = parseInt(req.params.groupId);
    const group = await prisma.supplierOrderGroup.findFirst({
      where: { id: groupId, supplierId: req.user.userId }
    });

    if (!group) return res.status(404).json({ error: 'گروه سفارش یافت نشد.' });

    const labelUrl = `/uploads/${req.file.filename}`;
    
    await prisma.supplierOrderGroup.update({
      where: { id: groupId },
      data: { shippingLabelUrl: labelUrl }
    });
    
    return res.json({ labelUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'خطا در بارگذاری لیبل' });
  }
});

