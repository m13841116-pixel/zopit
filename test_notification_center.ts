import { NotificationService, appEvents } from './src/services/NotificationService.js';
import { getPrisma } from './src/prisma.js';

async function runNotificationCenterTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING ZOPIT UNIFIED NOTIFICATION CENTER TESTS');
  console.log('====================================================\n');

  const prisma = getPrisma();
  NotificationService.init(prisma);

  const supplierId = 8801;
  const storeId = 9901;
  const otherUserId = 7701;

  // ----------------------------------------------------
  // TEST 1: Notification Creation with Actions & Priorities
  // ----------------------------------------------------
  console.log('[1/10] Testing Notification Creation with Priority & Action CTAs...');
  
  const notif1 = await NotificationService.createNotification({
    userId: supplierId,
    type: 'SUPPLIER_NEW_ORDER',
    title: 'سفارش جدید دریافت شد',
    message: 'سفارش شماره #5001 نیازمند صدور فاکتور و ارسال است.',
    priority: 'HIGH',
    cta: 'مشاهده سفارش',
    linkTab: 'orders',
    dedupKey: 'order_5001_supp'
  }, prisma);

  if (!notif1 || notif1.priority !== 'HIGH' || notif1.linkTab !== 'orders' || notif1.cta !== 'مشاهده سفارش') {
    throw new Error('Test 1 Failed: Supplier notification creation failed');
  }
  console.log('  ✅ Notification creation with HIGH priority and action links verified.');

  // ----------------------------------------------------
  // TEST 2: Ownership & Security Isolation
  // ----------------------------------------------------
  console.log('[2/10] Testing Ownership & Security Isolation...');

  const notif2 = await NotificationService.createNotification({
    userId: storeId,
    type: 'STORE_CUSTOMER_PAYMENT_SUCCESS',
    title: 'پرداخت مشتری با موفقیت انجام شد',
    message: 'سفارش #6001 پرداخت شد.',
    priority: 'HIGH',
    cta: 'مشاهده فاکتور',
    linkTab: 'orders',
    dedupKey: 'order_6001_store'
  }, prisma);

  const supplierNotifs = await NotificationService.getUserNotifications(supplierId, {}, prisma);
  const storeNotifs = await NotificationService.getUserNotifications(storeId, {}, prisma);

  if (supplierNotifs.items.some(n => n.userId !== supplierId) || supplierNotifs.items.some(n => n.id === notif2?.id)) {
    throw new Error('Security Breach: Supplier can see Store notifications!');
  }
  if (storeNotifs.items.some(n => n.userId !== storeId) || storeNotifs.items.some(n => n.id === notif1?.id)) {
    throw new Error('Security Breach: Store can see Supplier notifications!');
  }

  // Unauthorized read attempt
  const unauthRead = await NotificationService.markAsRead(notif1.id, otherUserId, prisma);
  if (unauthRead !== false) {
    throw new Error('Security Breach: Unauthorized user was able to mark notification as read!');
  }

  // Unauthorized delete attempt
  const unauthDelete = await NotificationService.dismissNotification(notif1.id, otherUserId, prisma);
  if (unauthDelete !== false) {
    throw new Error('Security Breach: Unauthorized user was able to dismiss notification!');
  }
  console.log('  ✅ Strict cross-tenant security and ownership isolation verified.');

  // ----------------------------------------------------
  // TEST 3: Unread State & Mark-as-read Operations
  // ----------------------------------------------------
  console.log('[3/10] Testing Unread State & Read Operations...');

  const initialUnread = (await NotificationService.getUserNotifications(supplierId, {}, prisma)).unreadCount;
  if (initialUnread < 1) {
    throw new Error('Test 3 Failed: Expected unread count >= 1');
  }

  const markSuccess = await NotificationService.markAsRead(notif1.id, supplierId, prisma);
  if (!markSuccess) {
    throw new Error('Test 3 Failed: Legitimate markAsRead failed');
  }

  const afterRead = await NotificationService.getUserNotifications(supplierId, {}, prisma);
  const updatedItem = afterRead.items.find(i => i.id === notif1.id);
  if (!updatedItem?.isRead) {
    throw new Error('Test 3 Failed: Item isRead is not true after markAsRead');
  }
  console.log('  ✅ Unread counting and read state transitions verified.');

  // ----------------------------------------------------
  // TEST 4: Action Links & Metadata
  // ----------------------------------------------------
  console.log('[4/10] Testing Action Links & Deep Navigation...');

  const actionNotif = await NotificationService.createNotification({
    userId: supplierId,
    type: 'SUPPLIER_LOW_STOCK',
    title: 'موجودی رو به اتمام',
    message: 'محصول شما رو به اتمام است',
    priority: 'HIGH',
    cta: 'افزایش موجودی',
    linkTab: 'products',
    targetUrl: '/supplier/products?filter=low_stock',
    dedupKey: 'low_stock_test_1'
  }, prisma);

  if (!actionNotif || actionNotif.cta !== 'افزایش موجودی' || actionNotif.linkTab !== 'products') {
    throw new Error('Test 4 Failed: Action links or CTA missing');
  }
  console.log('  ✅ Actionable CTA and routing metadata verified.');

  // ----------------------------------------------------
  // TEST 5: Duplicate Prevention (Deduplication)
  // ----------------------------------------------------
  console.log('[5/10] Testing Duplicate Prevention...');

  const duplicateNotif = await NotificationService.createNotification({
    userId: supplierId,
    type: 'SUPPLIER_LOW_STOCK',
    title: 'موجودی رو به اتمام (تکراری)',
    message: 'پیام تکراری نباید ثبت شود',
    priority: 'HIGH',
    dedupKey: 'low_stock_test_1' // Same dedupKey
  }, prisma);

  if (duplicateNotif !== null) {
    throw new Error('Test 5 Failed: Deduplication failed, duplicate was created!');
  }
  console.log('  ✅ Duplicate prevention successfully blocked duplicate notification.');

  // ----------------------------------------------------
  // TEST 6: Order Lifecycle Notifications
  // ----------------------------------------------------
  console.log('[6/10] Testing Order Lifecycle Notification Events...');

  appEvents.emit('order.created', {
    orderId: 7701,
    storeId: storeId,
    supplierIds: [supplierId]
  });

  await new Promise(r => setTimeout(r, 100));

  const storeAfterOrder = await NotificationService.getUserNotifications(storeId, {}, prisma);
  const suppAfterOrder = await NotificationService.getUserNotifications(supplierId, {}, prisma);

  const storeHasOrder = storeAfterOrder.items.some(i => i.type === 'STORE_CUSTOMER_PAYMENT_SUCCESS' && i.dedupKey === 'order_created_store_7701');
  const suppHasOrder = suppAfterOrder.items.some(i => i.type === 'SUPPLIER_NEW_ORDER' && i.dedupKey === `order_created_supp_${supplierId}_7701`);

  if (!storeHasOrder || !suppHasOrder) {
    throw new Error('Test 6 Failed: Order event failed to notify store or supplier');
  }
  console.log('  ✅ Order lifecycle notifications dispatched to Store and Supplier.');

  // ----------------------------------------------------
  // TEST 7: Shipped & Tracking Notifications
  // ----------------------------------------------------
  console.log('[7/10] Testing Shipped & Tracking Notification Events...');

  appEvents.emit('order.shipped', {
    orderId: 7701,
    storeId: storeId,
    supplierId: supplierId,
    trackingCode: 'POST-TRK-998877'
  });

  await new Promise(r => setTimeout(r, 100));

  const storeAfterShipped = await NotificationService.getUserNotifications(storeId, {}, prisma);
  const suppAfterShipped = await NotificationService.getUserNotifications(supplierId, {}, prisma);

  const storeShippedNotif = storeAfterShipped.items.find(i => i.type === 'STORE_SUPPLIER_SHIPPED' && i.message.includes('POST-TRK-998877'));
  const suppShippedNotif = suppAfterShipped.items.find(i => i.type === 'SUPPLIER_SHIPMENT_RECORDED');

  if (!storeShippedNotif || !suppShippedNotif) {
    throw new Error('Test 7 Failed: Shipped event failed to deliver tracking notification');
  }
  console.log('  ✅ Shipped & postal tracking notifications verified.');

  // ----------------------------------------------------
  // TEST 8: Supplier Balance & Payout Notifications
  // ----------------------------------------------------
  console.log('[8/10] Testing Supplier Balance & Payout Notifications...');

  appEvents.emit('wallet.credited', {
    walletId: 'w_test_8801',
    amount: 3200000,
    supplierId: supplierId
  });

  appEvents.emit('payout.success', {
    walletId: 'w_test_8801',
    amount: 3200000,
    supplierId: supplierId,
    shaba: 'IR880120000000000000000001'
  });

  await new Promise(r => setTimeout(r, 100));

  const suppAfterWallet = await NotificationService.getUserNotifications(supplierId, {}, prisma);
  const creditedNotif = suppAfterWallet.items.find(i => i.type === 'SUPPLIER_BALANCE_CREDITED');
  const payoutNotif = suppAfterWallet.items.find(i => i.type === 'SUPPLIER_PAYOUT_COMPLETED');

  if (!creditedNotif || !payoutNotif) {
    throw new Error('Test 8 Failed: Balance credit or payout notification missing');
  }
  console.log('  ✅ Supplier balance credit and payout completion notifications verified.');

  // ----------------------------------------------------
  // TEST 9: Target Progress, Achievement & Free Month Reward
  // ----------------------------------------------------
  console.log('[9/10] Testing Target Progress & Reward Notifications...');

  appEvents.emit('target.event', {
    storeId: storeId,
    type: 'ACHIEVED',
    targetName: 'رکورد فروش پاییزه'
  });

  appEvents.emit('target.event', {
    storeId: storeId,
    type: 'FREE_MONTH_REWARD'
  });

  await new Promise(r => setTimeout(r, 100));

  const storeAfterTargets = await NotificationService.getUserNotifications(storeId, {}, prisma);
  const achievedNotif = storeAfterTargets.items.find(i => i.type === 'STORE_TARGET_ACHIEVED');
  const freeMonthNotif = storeAfterTargets.items.find(i => i.type === 'STORE_FREE_MONTH_REWARD');

  if (!achievedNotif || !freeMonthNotif) {
    throw new Error('Test 9 Failed: Target reward notifications failed to dispatch');
  }
  console.log('  ✅ Target achievement and free month subscription reward notifications verified.');

  // ----------------------------------------------------
  // TEST 10: Operational Reminders Aggregation
  // ----------------------------------------------------
  console.log('[10/10] Testing Operational Reminders Aggregation...');

  const suppReminders = await NotificationService.getOperationalReminders({ id: supplierId, role: 'SUPPLIER' }, prisma);
  const storeReminders = await NotificationService.getOperationalReminders({ id: storeId, role: 'STORE_MANAGER' }, prisma);

  if (!Array.isArray(suppReminders) || !Array.isArray(storeReminders)) {
    throw new Error('Test 10 Failed: Operational reminders returned invalid structure');
  }
  console.log(`  ✅ Operational reminders synthesized (${suppReminders.length} supplier, ${storeReminders.length} store).`);

  console.log('\n====================================================');
  console.log('🎉 ALL 10 NOTIFICATION & REMINDER TESTS PASSED (100% GREEN)');
  console.log('====================================================');
}

runNotificationCenterTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
