// Browser Push & Web Notifications Utility for Zopit Store Managers

export type SoundType = 'chime' | 'cash' | 'bell' | 'subtle';

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  soundType: SoundType;
  notifyOnNewOrder: boolean;
  notifyOnStatusChange: boolean;
  vibrateEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  soundType: 'chime',
  notifyOnNewOrder: true,
  notifyOnStatusChange: true,
  vibrateEnabled: true,
};

const STORAGE_KEY = 'zopit_store_notification_settings';
const LAST_NOTIFIED_KEY = 'zopit_store_last_notified_order_id';

// Check if browser notifications are supported in current environment
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission for browser push notifications
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Also register Service Worker for rich background notifications if available
      registerServiceWorkerForPush();
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

// Load notification settings from localStorage
export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load notification settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// Save notification settings to localStorage
export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const current = loadNotificationSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save notification settings:', e);
  }
  return updated;
}

// Get and set last notified order ID
export function getLastNotifiedOrderId(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(LAST_NOTIFIED_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setLastNotifiedOrderId(orderId: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_NOTIFIED_KEY, String(orderId));
  } catch (e) {
    console.warn('Failed to set last notified order id:', e);
  }
}

// Web Audio API Synthesizer for high quality harmonic chimes without network delays
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported or blocked:', e);
    return null;
  }
}

export function playOrderChimeSound(type: SoundType = 'chime'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    if (type === 'chime') {
      // 3-tone ascending pleasant chord (D5 -> A5 -> D6)
      const frequencies = [587.33, 880.0, 1174.66];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    } else if (type === 'cash') {
      // Cash register dual "cha-ching" sound
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.12); // G6
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.12 + 0.75);
    } else if (type === 'bell') {
      // Classic shop door bell (E5 & B5 harmonics)
      [659.25, 987.77].forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);
      });
    } else {
      // Subtle pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.warn('Error playing audio chime:', err);
  }
}

// Service worker helper
let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorkerForPush(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    swRegistration = reg;
    return reg;
  } catch (err) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRegistration = reg;
      return reg;
    } catch (e) {
      console.warn('Service worker registration failed:', e);
      return null;
    }
  }
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  orderId?: number | string;
  tag?: string;
  url?: string;
  sound?: boolean;
  soundType?: SoundType;
  vibrate?: boolean;
  onClick?: () => void;
}

// Display a Browser Push / System Notification
export async function showBrowserNotification(options: ShowNotificationOptions): Promise<boolean> {
  const settings = loadNotificationSettings();
  if (!settings.enabled) return false;

  // Play sound if enabled
  if (options.sound !== false && settings.soundEnabled) {
    playOrderChimeSound(options.soundType || settings.soundType);
  }

  // Vibrate mobile device if supported
  if (options.vibrate !== false && settings.vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {
      // Ignore vibration error
    }
  }

  if (!isBrowserNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const title = options.title || 'سفارش جدید در زوپیت 🛍️';
  const tag = options.tag || (options.orderId ? `order-${options.orderId}` : `zopit-${Date.now()}`);
  const notifOptions: any = {
    body: options.body,
    icon: '/icon.jpg',
    badge: '/icon.jpg',
    tag,
    renotify: true,
    data: {
      orderId: options.orderId,
      url: options.url || '/?tab=orders',
      timestamp: Date.now(),
    },
  };

  // Try Service Worker registration first for rich persistent notifications
  try {
    const reg = swRegistration || (await registerServiceWorkerForPush());
    if (reg && reg.showNotification) {
      await reg.showNotification(title, notifOptions);
      return true;
    }
  } catch (swErr) {
    console.warn('SW notification fallback to window.Notification:', swErr);
  }

  // Fallback to standard window.Notification
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notif.close();
    };
    return true;
  } catch (err) {
    console.error('Error dispatching browser notification:', err);
    return false;
  }
}
