import { Router } from 'express';
import { NotificationService, appEvents } from './NotificationService.js';
import { getPrisma } from '../prisma.js';

const router = Router();
const prisma = getPrisma();

// Helper to extract authenticated user
function getAuthUser(req: any) {
  if (!req.user) return null;
  const userId = req.user.id || req.user.userId;
  const role = req.user.role || '';
  return { id: Number(userId), role, userId: Number(userId) };
}

/**
 * GET /api/notifications
 * Fetch authenticated user's notifications with pagination and filtering
 */
router.get('/', async (req: any, res: any) => {
  try {
    const user = getAuthUser(req);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'احراز هویت الزامی است' });
    }

    const { isRead, priority, type, limit, page } = req.query;

    const result = await NotificationService.getUserNotifications(
      user.id,
      {
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        priority: priority as string,
        type: type as string,
        limit: limit ? parseInt(limit as string) : 30,
        page: page ? parseInt(page as string) : 1
      },
      prisma
    );

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications:', err);
    res.status(500).json({ error: err.message || 'خطا در دریافت اعلانات' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for bell badge
 */
router.get('/unread-count', async (req: any, res: any) => {
  try {
    const user = getAuthUser(req);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'احراز هویت الزامی است' });
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications/unread-count:', err);
    res.status(500).json({ error: 'خطا در دریافت تعداد اعلانات خوانده‌نشده' });
  }
});

/**
 * GET /api/notifications/operational-reminders
 * Aggregates high-priority actionable operational reminders for current user
 */
router.get('/operational-reminders', async (req: any, res: any) => {
  try {
    const user = getAuthUser(req);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'احراز هویت الزامی است' });
    }

    const reminders = await NotificationService.getOperationalReminders(user, prisma);

    res.json({
      success: true,
      reminders
    });
  } catch (err: any) {
    console.error('Error in GET /api/notifications/operational-reminders:', err);
    res.status(500).json({ error: 'خطا در دریافت هشدارهای عملیاتی' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
router.post('/:id/read', async (req: any, res: any) => {
  try {
    const user = getAuthUser(req);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'احراز هویت الزامی است' });
    }

    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'شناسه اعلان نامعتبر است' });
    }

    const success = await NotificationService.markAsRead(notificationId, user.id, prisma);
    if (!success) {
      return res.status(404).json({ error: 'اعلان یافت نشد یا دسترسی غیرمجاز است' });
    }

    res.json({ success: true, message: 'اعلان به عنوان خوانده شده ثبت شد' });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/:id/read:', err);
    res.status(500).json({ error: 'خطا در ثبت وضعیت اعلان' });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.post('/read-all', async (req: any, res: any) => {
  try {
    const user = getAuthUser(req);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'احراز هویت الزامی است' });
    }

    const count = await NotificationService.markAllAsRead(user.id, prisma);

    res.json({
      success: true,
      count,
      message: `${count} اعلان به عنوان خوانده شده علامت‌گذاری شدند`
    });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/read-all:', err);
    res.status(500).json({ error: 'خطا در علامت‌گذاری همه اعلانات' });
  }
});

/**
 * POST /api/notifications/:id/dismiss
 * Delete/dismiss a notification
 */
router.post('/:id/dismiss', async (req: any, res: any) => {
  try {
    const user = getAuthUser(req);
    if (!user || !user.id) {
      return res.status(401).json({ error: 'احراز هویت الزامی است' });
    }

    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'شناسه اعلان نامعتبر است' });
    }

    const success = await NotificationService.dismissNotification(notificationId, user.id, prisma);
    if (!success) {
      return res.status(404).json({ error: 'اعلان یافت نشد یا دسترسی غیرمجاز است' });
    }

    res.json({ success: true, message: 'اعلان با موفقیت حذف شد' });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/:id/dismiss:', err);
    res.status(500).json({ error: 'خطا در حذف اعلان' });
  }
});

/**
 * POST /api/notifications/dispatch-event
 * Dispatch an operational/notification event internally or from tests
 */
router.post('/dispatch-event', async (req: any, res: any) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'احراز هویت الزامی است' });
    }

    const { eventName, payload } = req.body;
    if (!eventName || !payload) {
      return res.status(400).json({ error: 'پارامترهای رویداد ناقص است' });
    }

    appEvents.emit(eventName, payload);

    res.json({
      success: true,
      message: `رویداد ${eventName} با موفقیت ارسال شد`
    });
  } catch (err: any) {
    console.error('Error in POST /api/notifications/dispatch-event:', err);
    res.status(500).json({ error: 'خطا در ارسال رویداد' });
  }
});

export default router;
