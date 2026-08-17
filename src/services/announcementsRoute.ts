import { getPrisma } from '../prisma.js';
import { sendPattern } from './sms/SmsService.js';

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

  // Create announcement & dispatch role-based SMS notification
  app.post('/api/announcements', async (req: any, res: any) => {
    try {
      const { title, content, target, priority, isSticky, isLoginPopup, expiryDate, attachmentUrl, imageUrl, sendSms } = req.body;
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

      // Check if SMS dispatch is requested or enabled in settings
      const shouldSendSms = sendSms === true || sendSms === 'true';
      if (shouldSendSms) {
        // Asynchronously dispatch SMS notifications without delaying API response
        (async () => {
          try {
            const [patternConfig] = await Promise.all([
              prisma.systemConfig.findUnique({ where: { key: 'MELLIPAYAMAK_PATTERN_ANNOUNCEMENT' } }),
            ]);

            const patternCode = patternConfig?.value?.trim() || 'MELLIPAYAMAK_PATTERN_ANNOUNCEMENT';
            const targetRole = target || 'ALL';

            let targetUsers: any[] = [];
            if (targetRole === 'SUPPLIER') {
              targetUsers = await prisma.user.findMany({
                where: { role: 'SUPPLIER', status: 'ACTIVE', mobile: { not: null } },
                select: { mobile: true, firstName: true, lastName: true }
              });
            } else if (targetRole === 'STORE_MANAGER') {
              targetUsers = await prisma.user.findMany({
                where: { role: 'STORE_MANAGER', status: 'ACTIVE', mobile: { not: null } },
                select: { mobile: true, firstName: true, lastName: true }
              });
            } else {
              targetUsers = await prisma.user.findMany({
                where: { status: 'ACTIVE', mobile: { not: null } },
                select: { mobile: true, firstName: true, lastName: true }
              });
            }

            const uniqueMobiles = Array.from(
              new Set(
                targetUsers
                  .map((u) => u.mobile?.trim())
                  .filter((m): m is string => Boolean(m && m.length >= 10))
              )
            );

            console.log(`[Announcement SMS] Sending announcement pattern SMS to ${uniqueMobiles.length} users for target "${targetRole}"...`);

            const truncatedTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;

            for (const mobile of uniqueMobiles) {
              try {
                await sendPattern(mobile, patternCode, [truncatedTitle]);
              } catch (smsErr: any) {
                console.warn(`[Announcement SMS] Failed to send SMS to ${mobile}:`, smsErr.message);
              }
            }
          } catch (err: any) {
            console.error('[Announcement SMS Exception]', err.message);
          }
        })();
      }

      res.json({
        ...announcement,
        smsDispatched: shouldSendSms
      });
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
