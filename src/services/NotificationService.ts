import { EventEmitter } from 'events';
import { getPrisma } from '../prisma.js';

class AppEventEmitter extends EventEmitter {}
export const appEvents = new AppEventEmitter();

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface NotificationPayload {
  userId: number;
  type: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  cta?: string;
  linkTab?: string;
  targetUrl?: string;
  dedupKey?: string;
  metadata?: Record<string, any>;
}

export interface ParsedNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  priority: NotificationPriority;
  cta: string;
  linkTab: string;
  targetUrl?: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
  dedupKey?: string;
}

export interface OperationalReminder {
  id: string;
  title: string;
  description: string;
  priority: NotificationPriority;
  priorityScore: number;
  type: string;
  cta: string;
  linkTab: string;
  targetUrl?: string;
  badgeText?: string;
  entityId?: number | string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private static isInitialized = false;

  /**
   * Helper to parse attachmentUrl or fallback
   */
  public static parseNotification(item: any): ParsedNotification {
    let priority: NotificationPriority = 'MEDIUM';
    let cta = 'مشاهده جزییات';
    let linkTab = 'dashboard';
    let targetUrl: string | undefined = undefined;
    let dedupKey: string | undefined = undefined;
    let metadata: Record<string, any> = {};

    if (item.attachmentUrl) {
      try {
        const parsed = JSON.parse(item.attachmentUrl);
        if (parsed && typeof parsed === 'object') {
          priority = parsed.priority || priority;
          cta = parsed.cta || cta;
          linkTab = parsed.linkTab || linkTab;
          targetUrl = parsed.targetUrl;
          dedupKey = parsed.dedupKey;
          metadata = parsed.metadata || {};
        }
      } catch {
        // Not a JSON string
      }
    }

    // Infer priority from type if not explicitly set
    if (!priority || priority === 'MEDIUM') {
      const highTypes = [
        'SUPPLIER_NEW_ORDER',
        'SUPPLIER_ORDER_NEEDS_SHIPMENT',
        'SUPPLIER_SHIPMENT_DEADLINE_APPROACHING',
        'SUPPLIER_PRODUCT_REJECTED',
        'SUPPLIER_PRODUCT_REVISION_REQUESTED',
        'SUPPLIER_LOW_STOCK',
        'STORE_CUSTOMER_PAYMENT_SUCCESS',
        'STORE_SUPPLIER_SHIPPED',
        'STORE_ORDER_DELAYED',
        'STORE_LOW_INVENTORY_WARNING',
        'STORE_SUPPLIER_PRICE_CHANGED',
        'STORE_SUBSCRIPTION_EXPIRY_WARNING',
        'STORE_SUBSCRIPTION_FAILED'
      ];
      if (highTypes.includes(item.type)) {
        priority = 'HIGH';
      }
    }

    return {
      id: item.id,
      userId: item.userId,
      title: item.title,
      message: item.message,
      type: item.type || 'INFO',
      priority,
      cta,
      linkTab,
      targetUrl,
      isRead: Boolean(item.isRead),
      createdAt: item.createdAt || new Date(),
      metadata,
      dedupKey
    };
  }

  /**
   * Create a persistent notification with deduplication logic
   */
  public static async createNotification(
    payload: NotificationPayload,
    prismaClient?: any
  ): Promise<ParsedNotification | null> {
    const prisma = prismaClient || getPrisma();
    const {
      userId,
      type,
      title,
      message,
      priority = 'MEDIUM',
      cta = 'مشاهده',
      linkTab = 'dashboard',
      targetUrl,
      dedupKey,
      metadata = {}
    } = payload;

    if (!userId || isNaN(Number(userId))) {
      return null;
    }

    // 1. Deduplication check
    if (dedupKey) {
      try {
        const recentNotifications = await prisma.notification.findMany({
          where: {
            userId: Number(userId),
            type
          },
          take: 20
        });

        const isDuplicate = recentNotifications.some((n: any) => {
          if (!n.attachmentUrl) return false;
          try {
            const data = JSON.parse(n.attachmentUrl);
            return data.dedupKey === dedupKey;
          } catch {
            return false;
          }
        });

        if (isDuplicate) {
          // Notification already sent and active
          return null;
        }
      } catch (err) {
        console.warn('[NotificationService] Dedup check failed, proceeding:', err);
      }
    }

    // 2. Prepare payload
    const attachmentData = JSON.stringify({
      priority,
      cta,
      linkTab,
      targetUrl,
      dedupKey,
      metadata
    });

    try {
      const created = await prisma.notification.create({
        data: {
          userId: Number(userId),
          title,
          message,
          type,
          attachmentUrl: attachmentData,
          isRead: false
        }
      });

      // Also log to ActivityLog if available for security auditing
      try {
        if (prisma.activityLog && typeof prisma.activityLog.create === 'function') {
          await prisma.activityLog.create({
            data: {
              userId: Number(userId),
              action: `NOTIF_${type}`,
              details: JSON.stringify({
                title,
                priority,
                linkTab,
                dedupKey
              }),
              ipAddress: '127.0.0.1',
              userAgent: 'ZopitNotificationEngine'
            }
          }).catch(() => {});
        }
      } catch {}

      return this.parseNotification(created);
    } catch (err: any) {
      console.error('[NotificationService] Error creating notification:', err.message);
      return null;
    }
  }

  /**
   * Get user notifications with filtering and pagination
   */
  public static async getUserNotifications(
    userId: number,
    options: {
      isRead?: boolean;
      priority?: string;
      type?: string;
      limit?: number;
      page?: number;
    } = {},
    prismaClient?: any
  ): Promise<{ items: ParsedNotification[]; total: number; unreadCount: number }> {
    const prisma = prismaClient || getPrisma();
    const limit = Math.min(100, Math.max(1, options.limit || 30));
    const page = Math.max(1, options.page || 1);
    const skip = (page - 1) * limit;

    const where: any = { userId: Number(userId) };

    if (options.isRead !== undefined) {
      where.isRead = options.isRead;
    }
    if (options.type) {
      where.type = options.type;
    }

    const [rawItems, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: limit,
        skip
      }),
      prisma.notification.count({
        where: { userId: Number(userId), isRead: false }
      }),
      prisma.notification.count({
        where
      })
    ]);

    // Sort by createdAt descending
    const parsedList = rawItems
      .map((item: any) => this.parseNotification(item))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let finalItems = parsedList;
    if (options.priority) {
      finalItems = finalItems.filter((i: any) => i.priority.toUpperCase() === options.priority?.toUpperCase());
    }

    return {
      items: finalItems,
      total: totalCount,
      unreadCount
    };
  }

  /**
   * Mark single notification as read (with strict ownership check)
   */
  public static async markAsRead(
    notificationId: number,
    userId: number,
    prismaClient?: any
  ): Promise<boolean> {
    const prisma = prismaClient || getPrisma();
    try {
      const notif = await prisma.notification.findUnique({
        where: { id: Number(notificationId) }
      });

      if (!notif || Number(notif.userId) !== Number(userId)) {
        return false;
      }

      await prisma.notification.update({
        where: { id: Number(notificationId) },
        data: { isRead: true }
      });

      return true;
    } catch (err: any) {
      console.error('[NotificationService] Error marking as read:', err.message);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  public static async markAllAsRead(userId: number, prismaClient?: any): Promise<number> {
    const prisma = prismaClient || getPrisma();
    try {
      const res = await prisma.notification.updateMany({
        where: { userId: Number(userId), isRead: false },
        data: { isRead: true }
      });
      return res.count || 0;
    } catch (err: any) {
      console.error('[NotificationService] Error marking all as read:', err.message);
      return 0;
    }
  }

  /**
   * Delete / dismiss notification (with strict ownership check)
   */
  public static async dismissNotification(
    notificationId: number,
    userId: number,
    prismaClient?: any
  ): Promise<boolean> {
    const prisma = prismaClient || getPrisma();
    try {
      const notif = await prisma.notification.findUnique({
        where: { id: Number(notificationId) }
      });

      if (!notif || Number(notif.userId) !== Number(userId)) {
        return false;
      }

      await prisma.notification.delete({
        where: { id: Number(notificationId) }
      });

      return true;
    } catch (err: any) {
      console.error('[NotificationService] Error dismissing notification:', err.message);
      return false;
    }
  }

  /**
   * Unified Operational Reminders Hub
   * Aggregates real-time pending actions, order SLAs, inventory risks, and growth opportunities.
   */
  public static async getOperationalReminders(
    user: { id: number; role?: string; userId?: number },
    prismaClient?: any
  ): Promise<OperationalReminder[]> {
    const prisma = prismaClient || getPrisma();
    const userId = Number(user.id || user.userId);
    const role = (user.role || '').toUpperCase();
    const reminders: OperationalReminder[] = [];

    if (!userId) return [];

    try {
      // ----------------------------------------------------
      // A. SUPPLIER OPERATIONAL REMINDERS
      // ----------------------------------------------------
      if (role === 'SUPPLIER') {
        // 1. Check Orders Needing Shipment
        const pendingItems = await prisma.orderItem.findMany({
          where: {
            supplierId: userId,
            status: { in: ['PENDING', 'REQUESTED', 'PREPARING', 'PROCESSING'] }
          },
          include: {
            order: { select: { id: true, createdAt: true, status: true } },
            product: { select: { name: true } }
          },
          take: 10
        });

        if (pendingItems.length > 0) {
          const now = Date.now();
          const overdueItems = pendingItems.filter((i: any) => {
            const created = new Date(i.order?.createdAt || now).getTime();
            return now - created > 24 * 60 * 60 * 1000; // >24h
          });

          if (overdueItems.length > 0) {
            reminders.push({
              id: 'supp_overdue_shipments',
              title: `${overdueItems.length} سفارش نیازمند ارسال فوری (نزدیک به پایان مهلت)`,
              description: 'برخی سفارشات بیش از ۲۴ ساعت است که ثبت شده و نیازمند صدور بارنامه و ثبت کد رهگیری هستند.',
              priority: 'HIGH',
              priorityScore: 95,
              type: 'SUPPLIER_SHIPMENT_DEADLINE_APPROACHING',
              cta: 'ثبت فوری کد رهگیری',
              linkTab: 'orders',
              badgeText: 'اقدام ضروری',
              metadata: { count: overdueItems.length }
            });
          } else {
            reminders.push({
              id: 'supp_pending_orders',
              title: `${pendingItems.length} سفارش جدید در صف ارسال`,
              description: 'سفارشات جدید در انتظار بسته‌بندی و تحویل به باجه پستی قرار دارند.',
              priority: 'HIGH',
              priorityScore: 85,
              type: 'SUPPLIER_ORDER_NEEDS_SHIPMENT',
              cta: 'مشاهده سفارشات',
              linkTab: 'orders',
              badgeText: 'سفارش جدید',
              metadata: { count: pendingItems.length }
            });
          }
        }

        // 2. Low Stock Alerts for Supplier
        const lowStockProducts = await prisma.product.findMany({
          where: {
            supplierId: userId,
            inventory: { lte: 5 },
            status: { not: 'DELETED' }
          },
          take: 5
        });

        if (lowStockProducts.length > 0) {
          reminders.push({
            id: 'supp_low_stock_risk',
            title: `${lowStockProducts.length} کالای شما موجودی رو به اتمام دارند`,
            description: `محصولاتی مانند «${lowStockProducts[0].name}» دارای موجودی کمتر از ۵ عدد هستند. جهت جلوگیری از عدم تامین سفارش، موجودی را افزایش دهید.`,
            priority: 'HIGH',
            priorityScore: 88,
            type: 'SUPPLIER_LOW_STOCK',
            cta: 'افزایش موجودی',
            linkTab: 'products',
            badgeText: 'اتمام موجودی',
            metadata: { productIds: lowStockProducts.map((p: any) => p.id) }
          });
        }

        // 3. Payout & Wallet Balance
        const supplierUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, shaba: true, accountHolderName: true }
        });

        if (!supplierUser?.shaba) {
          reminders.push({
            id: 'supp_missing_shaba',
            title: 'شماره شبای بانکی ثبت نشده است',
            description: 'جهت واریز خودکار مطالبات و تسویه حساب‌های مالی، شماره شبای حساب خود را تکمیل کنید.',
            priority: 'MEDIUM',
            priorityScore: 70,
            type: 'SUPPLIER_PAYOUT_REQUESTED',
            cta: 'ثبت اطلاعات بانکی',
            linkTab: 'wallet',
            badgeText: 'اطلاعات بانکی'
          });
        }
      }

      // ----------------------------------------------------
      // B. STORE MANAGER OPERATIONAL REMINDERS
      // ----------------------------------------------------
      if (role === 'STORE_MANAGER' || role === 'STORE') {
        // 1. Unpaid / Actionable Orders
        const unpaidOrders = await prisma.order.findMany({
          where: {
            storeId: userId,
            status: { in: ['PENDING', 'REQUESTED'] }
          },
          take: 5
        });

        if (unpaidOrders.length > 0) {
          reminders.push({
            id: 'store_unpaid_orders',
            title: `${unpaidOrders.length} سفارش جدید آماده پرداخت و ارسال به تامین‌کننده`,
            description: 'سفارشات ثبت شده در انتظار تایید فاکتور و ارسال به پنل تامین‌کننده هستند.',
            priority: 'HIGH',
            priorityScore: 92,
            type: 'STORE_CUSTOMER_PAYMENT_SUCCESS',
            cta: 'مشاهده و پرداخت فاکتور',
            linkTab: 'orders',
            badgeText: 'سفارش پرداخت‌نشده',
            metadata: { count: unpaidOrders.length }
          });
        }

        // 2. Shipped Orders ready for customer notification
        const shippedOrders = await prisma.order.findMany({
          where: {
            storeId: userId,
            status: 'SHIPPED',
            trackingCode: { not: null }
          },
          take: 5
        });

        if (shippedOrders.length > 0) {
          reminders.push({
            id: 'store_shipped_tracking',
            title: `${shippedOrders.length} مرسوله توسط تامین‌کننده ارسال شد`,
            description: 'کد رهگیری پستی مرسوله‌ها آماده اطلاع‌رسانی یا پیگیری از اداره پست است.',
            priority: 'MEDIUM',
            priorityScore: 75,
            type: 'STORE_SUPPLIER_SHIPPED',
            cta: 'مشاهده کدهای رهگیری',
            linkTab: 'orders',
            badgeText: 'ارسال شده',
            metadata: { count: shippedOrders.length }
          });
        }

        // 3. Catalog Opportunity & Expansion
        const importedCount = await prisma.importedProduct.count({
          where: { storeId: userId }
        }).catch(() => 0);

        if (importedCount < 5) {
          reminders.push({
            id: 'store_expand_catalog',
            title: 'ویترین فروشگاه شما آماده محصولات بیشتر است',
            description: 'افزودن محصولات پرفروش بازار زوپیت موجب افزایش تنوع و رشد فروش تا ۳ برابر خواهد شد.',
            priority: 'MEDIUM',
            priorityScore: 65,
            type: 'STORE_HIGH_CONVERTING_OPPORTUNITY',
            cta: 'مشاهده محصولات پرسود',
            linkTab: 'marketplace',
            badgeText: 'فرصت رشد'
          });
        }
      }

      // ----------------------------------------------------
      // C. ADMIN / SUPERADMIN OPERATIONAL REMINDERS
      // ----------------------------------------------------
      if (role === 'SUPERADMIN' || role === 'ADMIN') {
        const [pendingPayouts, pendingProducts] = await Promise.all([
          prisma.payoutRequest?.count({ where: { status: 'PENDING' } }).catch(() => 0),
          prisma.product?.count({ where: { status: 'PENDING_APPROVAL' } }).catch(() => 0)
        ]);

        if (pendingPayouts > 0) {
          reminders.push({
            id: 'admin_pending_payouts',
            title: `${pendingPayouts} درخواست تسویه حساب در انتظار تایید مالی`,
            description: 'تامین‌کنندگان درخواست تسویه موجودی کیف‌پول ثبت کرده‌اند.',
            priority: 'HIGH',
            priorityScore: 90,
            type: 'SUPPLIER_PAYOUT_REQUESTED',
            cta: 'بررسی تسویه‌ها',
            linkTab: 'payouts',
            badgeText: 'تسویه حساب'
          });
        }

        if (pendingProducts > 0) {
          reminders.push({
            id: 'admin_pending_products',
            title: `${pendingProducts} محصول جدید در انتظار بررسی و تایید انتشار`,
            description: 'محصولات ارسال شده توسط تامین‌کنندگان نیازمند تایید هویت و کیفیت کاتالوگ هستند.',
            priority: 'MEDIUM',
            priorityScore: 80,
            type: 'SUPPLIER_PRODUCT_APPROVED',
            cta: 'بررسی محصولات',
            linkTab: 'products',
            badgeText: 'تایید کالا'
          });
        }
      }
    } catch (err: any) {
      console.warn('[NotificationService] Operational reminders calculation error:', err.message);
    }

    // Sort by priorityScore descending
    return reminders.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Global Event Listeners Registration
   */
  public static init(prismaClient?: any) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const prisma = prismaClient || getPrisma();

    // 1. Wallet Credited Event
    appEvents.on('wallet.credited', async (data: { walletId: string; amount: string | number; supplierId: number }) => {
      console.log(`[Notification Engine] 📨 wallet.credited event for supplier #${data.supplierId}`);
      await NotificationService.createNotification(
        {
          userId: Number(data.supplierId),
          type: 'SUPPLIER_BALANCE_CREDITED',
          title: 'افزایش موجودی کیف‌پول',
          message: `مبلغ ${Number(data.amount).toLocaleString('fa-IR')} تومان بابت سفارشات تحویل‌شده به موجودی قابل تسویه شما افزوده شد.`,
          priority: 'MEDIUM',
          cta: 'مشاهده کیف‌پول',
          linkTab: 'wallet',
          dedupKey: `wallet_credited_${data.walletId}_${Date.now()}`
        },
        prisma
      );
    });

    // 2. Payout Success Event
    appEvents.on('payout.success', async (data: { walletId: string; amount: string | number; supplierId: number; shaba: string }) => {
      console.log(`[Notification Engine] 📨 payout.success event for supplier #${data.supplierId}`);
      await NotificationService.createNotification(
        {
          userId: Number(data.supplierId),
          type: 'SUPPLIER_PAYOUT_COMPLETED',
          title: 'تسویه حساب بانکی انجام شد',
          message: `مبلغ ${Number(data.amount).toLocaleString('fa-IR')} تومان با موفقیت به شماره شبای ${data.shaba} واریز شد.`,
          priority: 'MEDIUM',
          cta: 'مشاهده رسید تسویه',
          linkTab: 'wallet',
          dedupKey: `payout_success_${data.supplierId}_${Date.now()}`
        },
        prisma
      );
    });

    // 3. New Order Event
    appEvents.on('order.created', async (data: { orderId: number; storeId: number; supplierIds: number[] }) => {
      console.log(`[Notification Engine] 📨 order.created event #${data.orderId}`);
      // Notify Store Manager
      if (data.storeId) {
        await NotificationService.createNotification(
          {
            userId: Number(data.storeId),
            type: 'STORE_CUSTOMER_PAYMENT_SUCCESS',
            title: 'سفارش جدید ثبت شد',
            message: `سفارش شماره #${data.orderId} با موفقیت در سیستم ثبت گردید و برای تامین‌کنندگان ارسال شد.`,
            priority: 'HIGH',
            cta: 'مشاهده سفارش',
            linkTab: 'orders',
            dedupKey: `order_created_store_${data.orderId}`
          },
          prisma
        );
      }

      // Notify Each Supplier
      if (Array.isArray(data.supplierIds)) {
        for (const suppId of data.supplierIds) {
          if (suppId) {
            await NotificationService.createNotification(
              {
                userId: Number(suppId),
                type: 'SUPPLIER_NEW_ORDER',
                title: 'سفارش جدید برای تامین و ارسال',
                message: `سفارش جدید شماره #${data.orderId} نیازمند آماده‌سازی و ثبت بارنامه است.`,
                priority: 'HIGH',
                cta: 'مشاهده سفارش',
                linkTab: 'orders',
                dedupKey: `order_created_supp_${suppId}_${data.orderId}`
              },
              prisma
            );
          }
        }
      }
    });

    // 4. Order Shipped Event
    appEvents.on('order.shipped', async (data: { orderId: number; storeId: number; supplierId: number; trackingCode?: string }) => {
      console.log(`[Notification Engine] 📨 order.shipped event #${data.orderId}`);
      if (data.storeId) {
        await NotificationService.createNotification(
          {
            userId: Number(data.storeId),
            type: 'STORE_SUPPLIER_SHIPPED',
            title: 'مرسوله سفارش ارسال شد',
            message: `سفارش شماره #${data.orderId} توسط تامین‌کننده ارسال گردید. ${data.trackingCode ? `کد رهگیری: ${data.trackingCode}` : ''}`,
            priority: 'HIGH',
            cta: 'مشاهده کد رهگیری',
            linkTab: 'orders',
            dedupKey: `order_shipped_store_${data.orderId}_${data.trackingCode || ''}`
          },
          prisma
        );
      }

      if (data.supplierId) {
        await NotificationService.createNotification(
          {
            userId: Number(data.supplierId),
            type: 'SUPPLIER_SHIPMENT_RECORDED',
            title: 'ارسال با موفقیت ثبت شد',
            message: `کد رهگیری مرسوله برای سفارش #${data.orderId} ثبت گردید و تحویل اداره پست شد.`,
            priority: 'MEDIUM',
            cta: 'پیگیری مرسوله',
            linkTab: 'orders',
            dedupKey: `order_shipped_supp_${data.supplierId}_${data.orderId}`
          },
          prisma
        );
      }
    });

    // 5. Product Status Event
    appEvents.on('product.status_changed', async (data: { productId: number; supplierId: number; status: 'APPROVED' | 'REJECTED' | 'REVISION'; reason?: string }) => {
      console.log(`[Notification Engine] 📨 product.status_changed: ${data.status} for product #${data.productId}`);
      if (data.status === 'APPROVED') {
        await NotificationService.createNotification(
          {
            userId: Number(data.supplierId),
            type: 'SUPPLIER_PRODUCT_APPROVED',
            title: 'محصول شما تایید شد',
            message: `محصول شماره #${data.productId} با موفقیت تایید گردید و در ویترین سراسری فروشگاه‌های زوپیت قرار گرفت.`,
            priority: 'MEDIUM',
            cta: 'مشاهده کالا در ویترین',
            linkTab: 'products',
            dedupKey: `prod_approved_${data.productId}`
          },
          prisma
        );
      } else if (data.status === 'REJECTED') {
        await NotificationService.createNotification(
          {
            userId: Number(data.supplierId),
            type: 'SUPPLIER_PRODUCT_REJECTED',
            title: 'محصول رد شد',
            message: `محصول شماره #${data.productId} تایید نشد. ${data.reason ? `علت: ${data.reason}` : 'جهت اطلاعات بیشتر وارد بخش ویرایش کالا شوید.'}`,
            priority: 'HIGH',
            cta: 'ویرایش و رفع نقص',
            linkTab: 'products',
            dedupKey: `prod_rejected_${data.productId}`
          },
          prisma
        );
      } else if (data.status === 'REVISION') {
        await NotificationService.createNotification(
          {
            userId: Number(data.supplierId),
            type: 'SUPPLIER_PRODUCT_REVISION_REQUESTED',
            title: 'درخواست بازبینی مشخصات کالا',
            message: `محصول #${data.productId} نیازمند اصلاح توضیحات، مشخصات یا تصاویر است.`,
            priority: 'HIGH',
            cta: 'اصلاح مشخصات',
            linkTab: 'products',
            dedupKey: `prod_revision_${data.productId}`
          },
          prisma
        );
      }
    });

    // 6. Low Stock Event
    appEvents.on('product.low_stock', async (data: { productId: number; supplierId: number; productName: string; inventory: number }) => {
      console.log(`[Notification Engine] 📨 product.low_stock for product #${data.productId}`);
      await NotificationService.createNotification(
        {
          userId: Number(data.supplierId),
          type: 'SUPPLIER_LOW_STOCK',
          title: 'هشدار اتمام موجودی کالا',
          message: `موجودی محصول «${data.productName}» به ${data.inventory} عدد رسیده است. جهت استمرار فروش، انبار را شارژ فرمایید.`,
          priority: 'HIGH',
          cta: 'افزایش موجودی',
          linkTab: 'products',
          dedupKey: `supp_low_stock_${data.productId}_${Math.floor(Date.now() / (12 * 60 * 60 * 1000))}`
        },
        prisma
      );
    });

    // 7. Subscription Event
    appEvents.on('subscription.event', async (data: { userId: number; type: 'EXPIRING' | 'RENEWED' | 'FAILED'; planName?: string; daysLeft?: number }) => {
      console.log(`[Notification Engine] 📨 subscription.event: ${data.type} for user #${data.userId}`);
      if (data.type === 'EXPIRING') {
        await NotificationService.createNotification(
          {
            userId: Number(data.userId),
            type: 'STORE_SUBSCRIPTION_EXPIRY_WARNING',
            title: 'مهلت اشتراک رو به پایان است',
            message: `اشتراک شما (${data.planName || 'پلن فعال'}) تا ${data.daysLeft || 3} روز دیگر منقضی می‌شود. جهت جلوگیری از قطع همگام‌سازی تمدید فرمایید.`,
            priority: 'HIGH',
            cta: 'تمدید اشتراک',
            linkTab: 'subscription',
            dedupKey: `sub_expiring_${data.userId}_${data.daysLeft}`
          },
          prisma
        );
      } else if (data.type === 'RENEWED') {
        await NotificationService.createNotification(
          {
            userId: Number(data.userId),
            type: 'STORE_SUBSCRIPTION_RENEWED',
            title: 'اشتراک با موفقیت تمدید شد',
            message: `پلن ${data.planName || ''} با موفقیت تمدید شد و تمام امکانات فعال هستند.`,
            priority: 'LOW',
            cta: 'مشاهده پلن',
            linkTab: 'subscription',
            dedupKey: `sub_renewed_${data.userId}_${Date.now()}`
          },
          prisma
        );
      } else if (data.type === 'FAILED') {
        await NotificationService.createNotification(
          {
            userId: Number(data.userId),
            type: 'STORE_SUBSCRIPTION_FAILED',
            title: 'خطا در تمدید اشتراک',
            message: 'تراکنش تمدید اشتراک با موفقیت انجام نشد. لطفاً اطلاعات کارت و پرداخت را بررسی فرمایید.',
            priority: 'HIGH',
            cta: 'پرداخت مجدد',
            linkTab: 'subscription',
            dedupKey: `sub_failed_${data.userId}_${Date.now()}`
          },
          prisma
        );
      }
    });

    // 8. Target Progress & Achievement Events (Store Growth)
    appEvents.on('target.event', async (data: { storeId: number; type: 'PROGRESS' | 'ACHIEVED' | 'FREE_MONTH_REWARD'; targetName?: string; current?: number; goal?: number }) => {
      console.log(`[Notification Engine] 📨 target.event: ${data.type} for store #${data.storeId}`);
      if (data.type === 'ACHIEVED') {
        await NotificationService.createNotification(
          {
            userId: Number(data.storeId),
            type: 'STORE_TARGET_ACHIEVED',
            title: '🎯 هدف فروش محقق شد!',
            message: `تبریک! هدف «${data.targetName || 'تارگت ماه جاری'}» با موفقیت تکمیل شد.`,
            priority: 'HIGH',
            cta: 'مشاهده دستاوردها',
            linkTab: 'growth',
            dedupKey: `target_achieved_${data.storeId}_${data.targetName || 'monthly'}`
          },
          prisma
        );
      } else if (data.type === 'FREE_MONTH_REWARD') {
        await NotificationService.createNotification(
          {
            userId: Number(data.storeId),
            type: 'STORE_FREE_MONTH_REWARD',
            title: '🎁 پاداش یک ماه اشتراک رایگان فعال شد',
            message: 'به پاس دستیابی به رکورد فروش، ۱ ماه اشتراک رایگان زوپیت به حساب شما افزوده شد.',
            priority: 'HIGH',
            cta: 'مشاهده جزییات پاداش',
            linkTab: 'subscription',
            dedupKey: `target_free_month_${data.storeId}_${Date.now()}`
          },
          prisma
        );
      } else if (data.type === 'PROGRESS') {
        await NotificationService.createNotification(
          {
            userId: Number(data.storeId),
            type: 'STORE_TARGET_PROGRESS',
            title: 'پیشرفت در مسیر هدف فروش',
            message: `شما به ${data.current || 0} از ${data.goal || 100} مرحله از هدف فروش خود رسیده‌اید.`,
            priority: 'MEDIUM',
            cta: 'مشاهده پلن رشد',
            linkTab: 'growth',
            dedupKey: `target_progress_${data.storeId}_${data.current}`
          },
          prisma
        );
      }
    });

    // 9. Growth & Opportunity Events (Supplier & Store)
    appEvents.on('opportunity.event', async (data: {
      userId: number;
      targetType: 'SUPPLIER' | 'STORE';
      category: 'HIGH_OPPORTUNITY' | 'RISING_DEMAND' | 'STORE_MATCH' | 'HIGH_CONVERTING';
      title?: string;
      message?: string;
      productId?: number;
    }) => {
      console.log(`[Notification Engine] 📨 opportunity.event: ${data.category} for user #${data.userId}`);
      if (data.targetType === 'SUPPLIER') {
        if (data.category === 'HIGH_OPPORTUNITY') {
          await NotificationService.createNotification(
            {
              userId: Number(data.userId),
              type: 'SUPPLIER_HIGH_PRODUCT_OPPORTUNITY',
              title: data.title || 'فرصت فروش طلایی کالا شناسایی شد',
              message: data.message || 'تقاضای بالایی برای دسته محصولات شما در شبکه فروشگاه‌ها ثبت شده است.',
              priority: 'MEDIUM',
              cta: 'مشاهده فرصت فروش',
              linkTab: 'growth',
              dedupKey: `supp_opp_${data.userId}_${data.productId || 'cat'}`
            },
            prisma
          );
        } else if (data.category === 'RISING_DEMAND') {
          await NotificationService.createNotification(
            {
              userId: Number(data.userId),
              type: 'SUPPLIER_RISING_DEMAND',
              title: data.title || 'رشد تقاضای سفارشات در بازار',
              message: data.message || 'سفارشات محصولات مشابه شما طی ۴۸ ساعت گذشته ۵۰٪ افزایش یافته است.',
              priority: 'MEDIUM',
              cta: 'بررسی تقاضا',
              linkTab: 'growth',
              dedupKey: `supp_demand_${data.userId}_${Date.now()}`
            },
            prisma
          );
        } else if (data.category === 'STORE_MATCH') {
          await NotificationService.createNotification(
            {
              userId: Number(data.userId),
              type: 'SUPPLIER_STRONG_STORE_MATCH',
              title: data.title || 'فروشگاه‌های همکار جدید آماده اتصال',
              message: data.message || 'فروشگاه‌های برتر مایل به افزودن کاتالوگ کالای شما به ویترین خود هستند.',
              priority: 'MEDIUM',
              cta: 'مشاهده فروشگاه‌ها',
              linkTab: 'growth',
              dedupKey: `supp_match_${data.userId}_${Date.now()}`
            },
            prisma
          );
        }
      } else {
        await NotificationService.createNotification(
          {
            userId: Number(data.userId),
            type: 'STORE_HIGH_CONVERTING_OPPORTUNITY',
            title: data.title || 'فرصت افزایش درآمد فروشگاه',
            message: data.message || 'محصولات جدید با حاشیه سود بالا و ارسال سریع در دسترس قرار گرفت.',
            priority: 'MEDIUM',
            cta: 'مشاهده فرصت',
            linkTab: 'marketplace',
            dedupKey: `store_opp_${data.userId}_${data.productId || 'cat'}`
          },
          prisma
        );
      }
    });

    // 10. Shipment Deadline Warning
    appEvents.on('shipment.deadline_approaching', async (data: { supplierId: number; orderId: number; hoursLeft?: number }) => {
      console.log(`[Notification Engine] 📨 shipment.deadline_approaching for supplier #${data.supplierId}`);
      await NotificationService.createNotification(
        {
          userId: Number(data.supplierId),
          type: 'SUPPLIER_SHIPMENT_DEADLINE_APPROACHING',
          title: 'هشدار مهلت ارسال سفارش',
          message: `تنها ${data.hoursLeft || 6} ساعت تا پایان مهلت ارسال سفارش #${data.orderId} و ثبت کد رهگیری باقی مانده است.`,
          priority: 'HIGH',
          cta: 'ثبت کد رهگیری',
          linkTab: 'orders',
          dedupKey: `supp_deadline_${data.supplierId}_${data.orderId}`
        },
        prisma
      );
    });

    // 11. Payout Requested
    appEvents.on('payout.requested', async (data: { supplierId: number; amount: number | string; requestId?: number }) => {
      console.log(`[Notification Engine] 📨 payout.requested for supplier #${data.supplierId}`);
      await NotificationService.createNotification(
        {
          userId: Number(data.supplierId),
          type: 'SUPPLIER_PAYOUT_REQUESTED',
          title: 'درخواست تسویه حساب ثبت شد',
          message: `درخواست تسویه مبلغ ${Number(data.amount).toLocaleString('fa-IR')} تومان ثبت گردید و در صف واریز پایا قرار گرفت.`,
          priority: 'LOW',
          cta: 'مشاهده وضعیت تسویه',
          linkTab: 'wallet',
          dedupKey: `payout_req_${data.supplierId}_${data.requestId || Date.now()}`
        },
        prisma
      );
    });

    // 12. Order Status Changed (Store)
    appEvents.on('order.status_changed', async (data: { storeId: number; orderId: number; oldStatus: string; newStatus: string; trackingCode?: string }) => {
      console.log(`[Notification Engine] 📨 order.status_changed for store #${data.storeId}`);
      await NotificationService.createNotification(
        {
          userId: Number(data.storeId),
          type: 'STORE_ORDER_STATUS_CHANGED',
          title: `تغییر وضعیت سفارش #${data.orderId}`,
          message: `وضعیت سفارش از ${data.oldStatus} به ${data.newStatus} تغییر یافت.${data.trackingCode ? ` کد رهگیری: ${data.trackingCode}` : ''}`,
          priority: 'MEDIUM',
          cta: 'مشاهده وضعیت سفارش',
          linkTab: 'orders',
          dedupKey: `order_status_${data.storeId}_${data.orderId}_${data.newStatus}`
        },
        prisma
      );
    });

    console.log('[Notification Engine] Unified Notification & Operational Service initialized successfully.');
  }
}
