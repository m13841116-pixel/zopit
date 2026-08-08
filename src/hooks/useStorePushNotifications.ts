// Custom Hook for Store Manager Browser Push Notifications & Real-Time Order Alerts

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  playOrderChimeSound,
  loadNotificationSettings,
  saveNotificationSettings,
  getLastNotifiedOrderId,
  setLastNotifiedOrderId,
  NotificationSettings,
  SoundType
} from '../utils/browserNotifications';
import { toast } from '../components/GlobalToast';

interface UseStorePushNotificationsProps {
  userRole?: string;
  onNavigateToOrder?: (orderId: number | string) => void;
  onNewOrderDetected?: (order: any) => void;
}

export function useStorePushNotifications({
  userRole = 'STORE_MANAGER',
  onNavigateToOrder,
  onNewOrderDetected
}: UseStorePushNotificationsProps = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotificationSettings>(loadNotificationSettings());
  const [unreadNewOrdersCount, setUnreadNewOrdersCount] = useState<number>(0);
  const [latestOrder, setLatestOrder] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const initialCheckDoneRef = useRef(false);
  const titleIntervalRef = useRef<any>(null);

  // Initialize permission and support
  useEffect(() => {
    const supported = isBrowserNotificationSupported();
    setIsSupported(supported);
    if (supported) {
      setPermission(getNotificationPermission());
    } else {
      setPermission('unsupported');
    }
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async () => {
    if (!isBrowserNotificationSupported()) {
      toast('مرورگر شما از اعلان‌های سیستمی پشتیبانی نمی‌کند.', 'error');
      return 'unsupported';
    }

    const perm = await requestBrowserNotificationPermission();
    setPermission(perm);

    if (perm === 'granted') {
      const updated = saveNotificationSettings({ enabled: true });
      setSettings(updated);
      toast('اعلان‌های مرورگر با موفقیت فعال شدند. هنگام ثبت سفارش جدید مطلع خواهید شد.', 'success');

      // Send a welcoming test notification
      showBrowserNotification({
        title: 'اعلان‌های زوپیت فعال شد! 🎉',
        body: 'سیستم اطلاع‌رسانی سفارشات جدید آماده به کار است.',
        sound: true,
        soundType: updated.soundType,
      });
    } else if (perm === 'denied') {
      toast('دسترسی به اعلان‌ها توسط مرورگر رد شد. لطفاً از تنظیمات مرورگر دسترسی را آزاد کنید.', 'error');
    }
    return perm;
  }, []);

  // Toggle push notifications on/off
  const toggleNotifications = useCallback(async () => {
    if (!settings.enabled) {
      if (permission !== 'granted') {
        const perm = await requestPermission();
        return perm === 'granted';
      } else {
        const updated = saveNotificationSettings({ enabled: true });
        setSettings(updated);
        toast('اعلان‌های مرورگر فعال شدند.', 'success');
        return true;
      }
    } else {
      const updated = saveNotificationSettings({ enabled: false });
      setSettings(updated);
      toast('اعلان‌های مرورگر غیرفعال شدند.', 'info');
      return false;
    }
  }, [settings.enabled, permission, requestPermission]);

  // Update specific settings (e.g. sound type, sound toggle)
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updated = saveNotificationSettings(newSettings);
    setSettings(updated);
    return updated;
  }, []);

  // Test notification function
  const testNotification = useCallback(async (customSoundType?: SoundType) => {
    const sound = customSoundType || settings.soundType;
    playOrderChimeSound(sound);

    if (permission === 'granted') {
      await showBrowserNotification({
        title: 'سفارش جدید دریافتی (تستی) 🛍️',
        body: 'یک سفارش تستی به مبلغ ۳۵۰,۰۰۰ تومان در فروشگاه شما ثبت شد.',
        orderId: 9999,
        sound: false, // already played above
        onClick: () => {
          if (onNavigateToOrder) {
            onNavigateToOrder(9999);
          }
        }
      });
      toast('اعلان تستی با موفقیت به مرورگر ارسال شد.', 'success');
    } else {
      toast('صدای زنگ پخش شد. برای دریافت اعلان روی دکمه «فعال‌سازی اعلان مرورگر» کلیک کنید.', 'info');
    }
  }, [permission, settings.soundType, onNavigateToOrder]);

  // Play audio sound preview
  const playTestChime = useCallback((type?: SoundType) => {
    playOrderChimeSound(type || settings.soundType);
  }, [settings.soundType]);

  // Listen for Service Worker message events
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'STORE_MANAGER_NEW_ORDER_CLICK') {
        if (onNavigateToOrder && event.data.orderId) {
          onNavigateToOrder(event.data.orderId);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [onNavigateToOrder]);

  // Polling / Checking for new orders for this store manager
  const checkNewOrders = useCallback(async () => {
    if (userRole !== 'STORE_MANAGER' && userRole !== 'STORE_OWNER' && userRole !== 'STORE') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsChecking(true);
      const lastKnownId = getLastNotifiedOrderId();
      const res = await fetch(`/api/store-manager/notifications/check-new-orders?lastOrderId=${lastKnownId}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const { newOrders = [], latestOrderId = 0 } = data;

        if (Array.isArray(newOrders) && newOrders.length > 0) {
          // If this is the initial load, just record the latest order ID without spamming
          if (!initialCheckDoneRef.current && lastKnownId === 0) {
            setLastNotifiedOrderId(latestOrderId);
            initialCheckDoneRef.current = true;
            return;
          }

          initialCheckDoneRef.current = true;

          // We received actual new orders!
          const order = newOrders[0];
          setLatestOrder(order);
          setUnreadNewOrdersCount((prev) => prev + newOrders.length);
          setLastNotifiedOrderId(latestOrderId);

          const orderAmountText = order.totalAmount
            ? `${Number(order.totalAmount).toLocaleString('fa-IR')} تومان`
            : '';
          const customerText = order.customerName ? `توسط ${order.customerName}` : '';
          const bodyText = `سفارش #${order.id} ${orderAmountText} ${customerText} ثبت شد. برای مدیریت کلیک کنید.`;

          // Fire Browser Push Notification
          if (settings.enabled) {
            showBrowserNotification({
              title: `سفارش جدید دریافت شد! #${order.id} 🛍️`,
              body: bodyText,
              orderId: order.id,
              sound: settings.soundEnabled,
              soundType: settings.soundType,
              vibrate: settings.vibrateEnabled,
              onClick: () => {
                if (onNavigateToOrder) {
                  onNavigateToOrder(order.id);
                }
              }
            });
          }

          // In-app Toast alert
          toast(`🔔 سفارش جدید #${order.id} ثبت گردید! (${orderAmountText})`, 'success');

          // Trigger blinking document title
          if (typeof document !== 'undefined') {
            const originalTitle = document.title;
            let blink = true;
            if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
            titleIntervalRef.current = setInterval(() => {
              document.title = blink ? `(۱) 🛍️ سفارش جدید! - زوپیت` : originalTitle;
              blink = !blink;
            }, 1000);

            // Restore on click
            const stopBlink = () => {
              if (titleIntervalRef.current) {
                clearInterval(titleIntervalRef.current);
                titleIntervalRef.current = null;
              }
              document.title = originalTitle;
              window.removeEventListener('focus', stopBlink);
              window.removeEventListener('click', stopBlink);
            };
            window.addEventListener('focus', stopBlink);
            window.addEventListener('click', stopBlink);
          }

          // Callback
          if (onNewOrderDetected) {
            onNewOrderDetected(order);
          }
        } else {
          initialCheckDoneRef.current = true;
          if (latestOrderId > 0 && lastKnownId === 0) {
            setLastNotifiedOrderId(latestOrderId);
          }
        }
      }
    } catch (err) {
      console.warn('Check new orders error:', err);
    } finally {
      setIsChecking(false);
    }
  }, [userRole, settings, onNavigateToOrder, onNewOrderDetected]);

  // Set up recurring check interval (every 12 seconds)
  useEffect(() => {
    if (userRole !== 'STORE_MANAGER' && userRole !== 'STORE_OWNER' && userRole !== 'STORE') return;

    // Initial check
    checkNewOrders();

    const interval = setInterval(() => {
      checkNewOrders();
    }, 12000);

    return () => {
      clearInterval(interval);
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
    };
  }, [userRole, checkNewOrders]);

  const clearUnreadCount = useCallback(() => {
    setUnreadNewOrdersCount(0);
  }, []);

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    settings,
    unreadNewOrdersCount,
    latestOrder,
    isChecking,
    requestPermission,
    toggleNotifications,
    updateSettings,
    testNotification,
    playTestChime,
    checkNewOrders,
    clearUnreadCount
  };
}
