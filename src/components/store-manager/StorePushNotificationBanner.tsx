import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings2,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Info,
  X
} from 'lucide-react';
import { SoundType } from '../../utils/browserNotifications';

interface StorePushNotificationBannerProps {
  permission: NotificationPermission | 'unsupported';
  isGranted: boolean;
  isDenied: boolean;
  settings: {
    enabled: boolean;
    soundEnabled: boolean;
    soundType: SoundType;
    notifyOnNewOrder: boolean;
    notifyOnStatusChange: boolean;
    vibrateEnabled: boolean;
  };
  onRequestPermission: () => Promise<any>;
  onToggleNotifications: () => Promise<boolean>;
  onUpdateSettings: (partial: any) => any;
  onTestNotification: (soundType?: SoundType) => Promise<void>;
  onPlayChime: (soundType?: SoundType) => void;
  compact?: boolean;
  className?: string;
}

export function StorePushNotificationBanner({
  permission,
  isGranted,
  isDenied,
  settings,
  onRequestPermission,
  onToggleNotifications,
  onUpdateSettings,
  onTestNotification,
  onPlayChime,
  compact = false,
  className = ''
}: StorePushNotificationBannerProps): React.ReactElement {
  const [showSettings, setShowSettings] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return <></>;

  const soundOptions: { id: SoundType; name: string; desc: string }[] = [
    { id: 'chime', name: 'ملودی هارمونیک (پیش‌فرض)', desc: 'آکورد صعودی دلنشین سه‌گانه' },
    { id: 'cash', name: 'صندوق فروشگاه (Cash)', desc: 'صدای دینگ کلاسیک صندوق فروش' },
    { id: 'bell', name: 'زنگ درب مغازه (Bell)', desc: 'آهنگ لطیف زنگ ورود مشتری' },
    { id: 'subtle', name: 'تک بوق ملایم (Subtle)', desc: 'صدای ملایم و آرام' },
  ];

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isGranted && settings.enabled
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100'
          : isDenied
          ? 'bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100'
          : 'bg-gradient-to-r from-primary-default/10 via-primary-default/5 to-surface border-primary-default/20'
      } ${className}`}
      dir="rtl"
    >
      <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left/Main Description */}
        <div className="flex items-start gap-3.5 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isGranted && settings.enabled
                ? 'bg-emerald-500 text-white shadow-emerald-500/20 animate-pulse'
                : isDenied
                ? 'bg-amber-500 text-white'
                : 'bg-primary-default text-white shadow-primary-default/20'
            }`}
          >
            {isGranted && settings.enabled ? (
              <BellRing className="w-5 h-5" />
            ) : isDenied ? (
              <BellOff className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-primary flex items-center gap-1.5">
                اعلان‌های مرورگر (Push Notifications) برای سفارشات جدید
              </h4>
              {isGranted && settings.enabled ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> فعال
                </span>
              ) : isDenied ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" /> مسدود در مرورگر
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-default/15 text-primary-default border border-primary-default/30">
                  <Sparkles className="w-3 h-3" /> پیشنهاد ویژه
                </span>
              )}
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              {isGranted && settings.enabled
                ? 'سیستم فعال است؛ به محض ثبت هر سفارش جدید در فروشگاه شما، اعلان فوری به همراه صدای زنگ در مرورگر و ویندوز/موبایل نمایش داده می‌شود.'
                : isDenied
                ? 'دسترسی اعلان‌ها در مرورگر مسدود شده است. برای دریافت زنگ سفارش، لطفاً روی آیکون قفل در کنار آدرس سایت کلیک کرده و Notifications را روی Allow بگذارید.'
                : 'با فعال‌سازی این قابلیت، حتی هنگام بستن پنجره یا باز بودن سایر تب‌ها، لحظه ثبت سفارش جدید توسط مشتری یا بازارچه فوراً با صدای زنگ و اعلان مطلع می‌شوید.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {!isGranted ? (
            <button
              onClick={onRequestPermission}
              className="px-4 py-2.5 rounded-xl bg-primary-default hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-md shadow-primary-default/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <BellRing className="w-4 h-4" />
              فعال‌سازی اعلان مرورگر
            </button>
          ) : (
            <>
              <button
                onClick={() => onTestNotification()}
                className="px-3 py-2 rounded-xl bg-surface hover:bg-subtle text-primary border border-subtle font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:border-primary-default/40"
                title="تست ارسال اعلان و پخش صدای زنگ"
              >
                <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                تست زنگ و اعلان
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showSettings
                    ? 'bg-primary-default/10 border-primary-default text-primary-default'
                    : 'bg-surface hover:bg-subtle text-secondary border-subtle'
                }`}
                title="تنظیمات صدا و اعلان"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleNotifications}
                className={`px-3 py-2 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  settings.enabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-muted/10 text-muted border-subtle hover:bg-subtle'
                }`}
              >
                {settings.enabled ? 'روشن' : 'خاموش'}
              </button>
            </>
          )}

          {compact && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 text-muted hover:text-primary rounded-xl transition-colors"
              title="بستن بنر"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Settings Panel */}
      {showSettings && (
        <div className="border-t border-subtle/60 p-4 sm:p-5 bg-surface/50 backdrop-blur-sm space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sound & Ringtone Settings */}
            <div className="bg-card p-4 rounded-xl border border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted" />
                  )}
                  <span className="font-bold text-xs sm:text-sm text-primary">صدای زنگ هشدار سفارش</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {settings.soundEnabled && (
                <div className="space-y-2 pt-2 border-t border-subtle">
                  <span className="text-[11px] text-muted block">نوع آهنگ زنگ:</span>
                  <div className="space-y-1.5">
                    {soundOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => onUpdateSettings({ soundType: opt.id })}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          settings.soundType === opt.id
                            ? 'bg-primary-default/10 border-primary-default text-primary font-bold shadow-xs'
                            : 'bg-surface hover:bg-subtle border-subtle text-secondary'
                        }`}
                      >
                        <div>
                          <div>{opt.name}</div>
                          <div className="text-[10px] text-muted font-normal">{opt.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayChime(opt.id);
                          }}
                          className="p-1.5 rounded-lg bg-surface hover:bg-primary-default/20 text-primary border border-subtle transition-colors"
                          title="پیش‌شنوایی صدا"
                        >
                          <Play className="w-3 h-3 text-primary-default fill-primary-default" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Behavior & Options */}
            <div className="bg-card p-4 rounded-xl border border-subtle space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-xs sm:text-sm text-primary">گزینه‌های اعلان هوشمند</span>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-subtle">
                <label className="flex items-center justify-between text-xs text-secondary cursor-pointer">
                  <span>اطلاع‌رسانی هنگام ثبت سفارش جدید توسط مشتری یا بازارچه</span>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnNewOrder}
                    onChange={(e) => onUpdateSettings({ notifyOnNewOrder: e.target.checked })}
                    className="rounded text-primary-default focus:ring-primary-default/40"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-secondary cursor-pointer">
                  <span>اطلاع‌رسانی تغییر وضعیت و ارسال سفارش توسط تامین‌کننده</span>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnStatusChange}
                    onChange={(e) => onUpdateSettings({ notifyOnStatusChange: e.target.checked })}
                    className="rounded text-primary-default focus:ring-primary-default/40"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-secondary cursor-pointer">
                  <span>لرزش دستگاه در گوشی‌های هوشمند (Vibration)</span>
                  <input
                    type="checkbox"
                    checked={settings.vibrateEnabled}
                    onChange={(e) => onUpdateSettings({ vibrateEnabled: e.target.checked })}
                    className="rounded text-primary-default focus:ring-primary-default/40"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-subtle flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <Info className="w-3.5 h-3.5 text-primary-default" />
                  <span>پشتیبانی کامل از Chrome، Firefox، Edge و Safari</span>
                </div>

                <button
                  type="button"
                  onClick={() => onTestNotification()}
                  className="text-xs font-bold text-primary-default hover:underline flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> تست زنده
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
