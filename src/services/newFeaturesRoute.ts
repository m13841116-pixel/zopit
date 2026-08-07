export default function registerNewFeatures(app: any, prisma: any) {
  // === INFO PAGES ===
  app.get('/api/admin/info-pages', async (req: any, res: any) => {
    try {
      const pages = await prisma.infoPage.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(pages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/admin/info-pages', async (req: any, res: any) => {
    try {
      const { title, slug, category, summary, content, images, attachments, videos, tags, isPublished, isPinned } = req.body;
      const page = await prisma.infoPage.create({
        data: {
          title,
          slug,
          category,
          summary,
          content,
          images: images || null,
          attachments: attachments || null,
          videos: videos || null,
          tags: tags || null,
          isPublished: isPublished !== false,
          isPinned: !!isPinned
        }
      });
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.put('/api/admin/info-pages/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const pageId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;

      const page = await prisma.infoPage.update({
        where: { id: isNaN(pageId) ? undefined : pageId },
        data: updateData
      });
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.delete('/api/admin/info-pages/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const pageId = parseInt(id, 10);
      await prisma.infoPage.delete({
        where: { id: isNaN(pageId) ? undefined : pageId }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // === PUBLIC MESSAGES ===
  app.get('/api/admin/public-messages', async (req: any, res: any) => {
    try {
      const messages = await prisma.publicMessage.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/admin/public-messages', async (req: any, res: any) => {
    try {
      const { content, icon, color, expiryDate, isActive } = req.body;
      const msg = await prisma.publicMessage.create({
        data: {
          content,
          icon: icon || 'info',
          color: color || 'indigo',
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          isActive: isActive !== false
        }
      });
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.put('/api/admin/public-messages/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;
      if (updateData.expiryDate) {
        updateData.expiryDate = new Date(updateData.expiryDate);
      }

      const msg = await prisma.publicMessage.update({
        where: { id: isNaN(msgId) ? undefined : msgId },
        data: updateData
      });
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.delete('/api/admin/public-messages/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      await prisma.publicMessage.delete({
        where: { id: isNaN(msgId) ? undefined : msgId }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // === DASHBOARD MESSAGES ===
  app.get('/api/admin/dashboard-messages', async (req: any, res: any) => {
    try {
      const messages = await prisma.dashboardMessage.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/admin/dashboard-messages', async (req: any, res: any) => {
    try {
      const { title, content, targetRole, priority, expiryDate, publishDate, attachments } = req.body;
      const msg = await prisma.dashboardMessage.create({
        data: {
          title,
          content,
          targetRole: targetRole || 'ALL',
          priority: priority || 'MEDIUM',
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          publishDate: publishDate ? new Date(publishDate) : new Date(),
          attachments: attachments || null
        }
      });
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.put('/api/admin/dashboard-messages/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;
      if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
      if (updateData.publishDate) updateData.publishDate = new Date(updateData.publishDate);

      const msg = await prisma.dashboardMessage.update({
        where: { id: isNaN(msgId) ? undefined : msgId },
        data: updateData
      });
      res.json(msg);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.delete('/api/admin/dashboard-messages/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      await prisma.dashboardMessage.delete({
        where: { id: isNaN(msgId) ? undefined : msgId }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // === DYNAMIC MENUS ===
  app.get('/api/menus/:selectedRole', async (req: any, res: any) => {
    try {
      const { selectedRole } = req.params;
      const menu = await prisma.dynamicMenu.findUnique({
        where: { role: selectedRole }
      });
      res.json(menu ? JSON.parse(menu.items) : null);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/admin/menus/:selectedRole', async (req: any, res: any) => {
    try {
      const { selectedRole } = req.params;
      const { items } = req.body;
      const menu = await prisma.dynamicMenu.upsert({
        where: { role: selectedRole },
        update: { items: typeof items === 'string' ? items : JSON.stringify(items) },
        create: {
          role: selectedRole,
          items: typeof items === 'string' ? items : JSON.stringify(items)
        }
      });
      res.json(menu);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // === PUBLIC ENDPOINTS FOR INFO PAGES AND DASHBOARD MESSAGES ===
  app.get('/api/info-pages', async (req: any, res: any) => {
    try {
      const pages = await prisma.infoPage.findMany({
        where: { isPublished: true },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      res.json(pages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.get('/api/dashboard-messages', async (req: any, res: any) => {
    try {
      const messages = await prisma.dashboardMessage.findMany({
        where: {
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.get('/api/public-messages', async (req: any, res: any) => {
    try {
      const messages = await prisma.publicMessage.findMany({
        where: {
          isActive: true,
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
}
