import { getPrisma } from '../prisma.js';

const prisma = getPrisma();

export default function registerAnnouncements(app: any) {
  // Get active announcements
  app.get('/api/announcements', async (req: any, res: any) => {
    try {
      const { all } = req.query;
      
      const whereClause: any = {};
      if (all !== 'true') {
        whereClause.isActive = true;
        whereClause.OR = [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ];
      }

      const announcements = await prisma.announcement.findMany({
        where: whereClause,
        orderBy: [
          { isSticky: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Create announcement
  app.post('/api/announcements', async (req: any, res: any) => {
    try {
      const { title, content, target, priority, isSticky, isLoginPopup, expiryDate, attachmentUrl, imageUrl } = req.body;
      let announcement;
      try {
        announcement = await prisma.announcement.create({
          data: {
            title,
            content,
            target: target || 'ALL',
            priority: priority || 'MEDIUM',
            isSticky: !!isSticky,
            isLoginPopup: !!isLoginPopup,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            attachmentUrl: attachmentUrl || null,
            imageUrl: imageUrl || null,
            isActive: true
          }
        });
      } catch (err) {
        // Fallback without attachment fields if database driver doesn't support them
        announcement = await prisma.announcement.create({
          data: {
            title,
            content: attachmentUrl ? `${content}\n\n[پیوست: ${attachmentUrl}]` : content,
            target: target || 'ALL',
            priority: priority || 'MEDIUM',
            isSticky: !!isSticky,
            isLoginPopup: !!isLoginPopup,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            isActive: true
          }
        });
      }
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Update announcement
  app.put('/api/announcements/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { title, content, target, priority, isSticky, isLoginPopup, expiryDate, isActive, attachmentUrl, imageUrl } = req.body;
      
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (target !== undefined) updateData.target = target;
      if (priority !== undefined) updateData.priority = priority;
      if (isSticky !== undefined) updateData.isSticky = !!isSticky;
      if (isLoginPopup !== undefined) updateData.isLoginPopup = !!isLoginPopup;
      if (isActive !== undefined) updateData.isActive = !!isActive;
      if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (expiryDate !== undefined) {
        updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
      }

      const announcement = await prisma.announcement.update({
        where: { id },
        data: updateData
      });
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Delete announcement
  app.delete('/api/announcements/:id', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      await prisma.announcement.delete({
        where: { id }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
}
