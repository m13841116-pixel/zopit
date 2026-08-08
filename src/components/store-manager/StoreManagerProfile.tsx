import React, { useState, useEffect } from "react";
import { User, Save, Bell, CheckCircle, Volume2, Play, BellRing, Smartphone } from "lucide-react";
import {
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  playOrderChimeSound,
  loadNotificationSettings,
  saveNotificationSettings,
  SoundType
} from "../../utils/browserNotifications";

export function StoreManagerProfile({ user, showNotification, onUpdateUser }: any) {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "notifications">(
    "profile",
  );
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    shaba: user?.shaba || "",
    cardNumber: user?.cardNumber || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
    storeLink: user?.storeLink || "",
    avatarUrl: user?.avatarUrl || "",
  });

  const [pushSettings, setPushSettings] = useState(loadNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        shaba: user.shaba || "",
        cardNumber: user.cardNumber || "",
        mobile: user.mobile || "",
        address: user.address || "",
        storeLink: user.storeLink || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  /* Notification states persisted in localStorage */
  const [notifSettings, setNotifSettings] = useState({ newOrders: true, payments: true, announcements: false });
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`notif-settings-${user.id}`);
      if (saved) {
        try {
          setNotifSettings(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user?.id]);

  const handleRequestPush = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      const updated = saveNotificationSettings({ enabled: true });
      setPushSettings(updated);
      showNotification("اعلان‌های مرورگر با موفقیت فعال شدند", "success");
      showBrowserNotification({
        title: 'اعلان‌های زوپیت فعال شد! 🎉',
        body: 'سیستم اطلاع‌رسانی سفارشات جدید آماده به کار است.',
        sound: true,
        soundType: updated.soundType,
      });
    } else {
      showNotification("دسترسی به اعلان‌ها توسط مرورگر تایید نشد", "error");
    }
  };

  const handleUpdatePush = (partial: any) => {
    const updated = saveNotificationSettings(partial);
    setPushSettings(updated);
    // sync to backend
    fetch('/api/store-manager/notifications/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  const handleTestSound = (type?: SoundType) => {
    const sound = type || pushSettings.soundType;
    playOrderChimeSound(sound);
    showBrowserNotification({
      title: 'تست اعلان مرورگر و صدای زنگ 🛍️',
      body: 'این یک اعلان تستی از سیستم اطلاع‌رسانی سفارشات زوپیت است.',
      sound: false,
      soundType: sound,
    });
    showNotification("صدای زنگ و اعلان آزمایشی ارسال شد", "success");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/profile", { credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
        showNotification("ویرایش مشخصات با موفقیت انجام شد", "success");
      } else {
        showNotification("خطا در ویرایش مشخصات", "error");
      }
    } catch (err) {
      showNotification("خطای شبکه", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      localStorage.setItem(
        `notif-settings-${user?.id || "guest"}`,
        JSON.stringify(notifSettings),
      );
      showNotification("تنظیمات اطلاع‌رسانی با موفقیت ذخیره شد", "success");
    } catch (err) {
      showNotification("خطا در ذخیره تنظیمات", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      <div className="bg-card rounded-3xl p-6 lg:p-8 border border-subtle shadow-sm max-w-2xl mx-auto">
        
        {/* Tab Headers */}
        <div className="flex border-b border-subtle mb-8 pb-1 gap-6">
          
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`pb-4 text-base font-extrabold flex items-center gap-2 transition-all cursor-pointer relative ${activeSubTab === "profile" ? "text-primary-default" : "text-muted hover:text-muted"}`}
          >
            
            <User className="w-5 h-5" /> ویرایش مشخصات کاربری
            {activeSubTab === "profile" && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full animate-fade-in"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`pb-4 text-base font-extrabold flex items-center gap-2 transition-all cursor-pointer relative ${activeSubTab === "notifications" ? "text-primary-default" : "text-muted hover:text-muted"}`}
          >
            
            <Bell className="w-5 h-5" /> تنظیمات نوتیفیکیشن
            {activeSubTab === "notifications" && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full animate-fade-in"></span>
            )}
          </button>
        </div>
        {activeSubTab === "profile" ? (
          /* Profile Details Form */ <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-secondary mb-2">
                  نام کاربری (غیرقابل ویرایش)
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-100 border border-subtle rounded-xl px-4 py-3 text-sm font-mono text-left outline-none text-slate-500 cursor-not-allowed"
                  value={user?.username || ""}
                  disabled
                  readOnly
                  dir="ltr"
                />
              </div>

              <div>
                
                <label className="block text-xs font-bold text-secondary mb-2">
                  نام
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                
                <label className="block text-xs font-bold text-secondary mb-2">
                  نام خانوادگی
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
              <div>
                
                <label className="block text-xs font-bold text-secondary mb-2">
                  موبایل
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none font-mono text-left"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  dir="ltr"
                />
              </div>
              <div>
                
                <label className="block text-xs font-bold text-secondary mb-2">
                  شماره کارت بانک
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none font-mono text-left"
                  value={formData.cardNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, cardNumber: e.target.value })
                  }
                  dir="ltr"
                  placeholder="6037990000000000"
                />
              </div>
              <div>
                
                <label className="block text-xs font-bold text-secondary mb-2">
                  شماره شبا (بدون IR)
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none font-mono text-left"
                  value={formData.shaba}
                  onChange={(e) =>
                    setFormData({ ...formData, shaba: e.target.value })
                  }
                  dir="ltr"
                  placeholder="000000000000000000000000"
                />
              </div>
              <div className="md:col-span-2">
                
                <label className="block text-xs font-bold text-secondary mb-2">
                  آدرس فروشگاه
                </label>
                <textarea
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none h-20 resize-none"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="آدرس دقیق و کامل فروشگاه خود را وارد کنید..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-secondary mb-2">
                  لینک فروشگاه (سایت، اینستاگرام یا کانال)
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none text-left font-mono"
                  value={formData.storeLink}
                  onChange={(e) =>
                    setFormData({ ...formData, storeLink: e.target.value })
                  }
                  placeholder="instagram.com/my_store"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-secondary mb-2">
                  عکس پروفایل / لوگو
                </label>
                <div className="flex items-center gap-6 bg-background border border-subtle rounded-2xl p-4">
                  <div className="relative w-16 h-16 rounded-full border-2 border-primary-default/25 bg-surface flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xs text-muted font-bold">فاقد عکس</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({
                                ...formData,
                                avatarUrl: reader.result as string,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="profile-avatar-file-upload"
                      />
                      <label
                        htmlFor="profile-avatar-file-upload"
                        className="px-4 py-2 bg-primary-default hover:bg-primary-hover text-inverse font-bold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        تغییر عکس
                      </label>
                      {formData.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: "" })}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl cursor-pointer transition-colors border border-red-200"
                        >
                          حذف عکس
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-muted">پسوند‌های مجاز: JPG, PNG. حجم حداکثر ۱ مگابایت.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-subtle flex justify-end">
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-bold text-inverse bg-primary-default hover:bg-primary-hover transition-all shadow-lg shadow-primary-default/15 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                
                <Save className="w-5 h-5" />
                {isSubmitting ? "در حال ثبت..." : "ذخیره تغییرات"}
              </button>
            </div>
          </form>
        ) : (
          /* Notification Settings Form */
          <form onSubmit={handleSaveNotifications} className="space-y-6">
            {/* Browser Push Notifications Section */}
            <div className="p-5 rounded-2xl border bg-gradient-to-br from-emerald-500/5 via-card to-background border-emerald-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                      اعلان‌های مرورگر (Browser Push) برای سفارشات جدید
                      {permission === 'granted' && pushSettings.enabled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">فعال</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">غیرفعال</span>
                      )}
                    </h4>
                    <p className="text-xs text-secondary mt-0.5">
                      دریافت آنی هشدار سیستمی به همراه صدای زنگ به محض ثبت هر سفارش در فروشگاه
                    </p>
                  </div>
                </div>

                {permission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestPush}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    فعال‌سازی در مرورگر
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestSound()}
                      className="px-3 py-2 bg-surface hover:bg-subtle text-primary border border-subtle font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                      تست زنگ و اعلان
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={pushSettings.enabled}
                        onChange={(e) => handleUpdatePush({ enabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                )}
              </div>

              {/* Sound Ringtone Selector */}
              {pushSettings.enabled && (
                <div className="pt-3 border-t border-emerald-500/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-primary">صدای زنگ هشدار هنگام سفارش</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={pushSettings.soundEnabled}
                        onChange={(e) => handleUpdatePush({ soundEnabled: e.target.checked })}
                      />
                      <div className="w-9 h-5 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {pushSettings.soundEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {[
                        { id: 'chime', name: 'ملودی هارمونیک', desc: 'آکورد صعودی ۳ گانه' },
                        { id: 'cash', name: 'صندوق فروشگاه', desc: 'صدای چاچینگ صندوق' },
                        { id: 'bell', name: 'زنگ درب مغازه', desc: 'هارمونیک ملایم ورود' },
                        { id: 'subtle', name: 'تک بوق ملایم', desc: 'پالس آرام و بی‌صدا' },
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleUpdatePush({ soundType: item.id })}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            pushSettings.soundType === item.id
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold'
                              : 'bg-card hover:bg-surface border-subtle text-secondary'
                          }`}
                        >
                          <div>
                            <div>{item.name}</div>
                            <div className="text-[10px] text-muted font-normal">{item.desc}</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestSound(item.id as SoundType);
                            }}
                            className="p-1.5 rounded-lg bg-surface hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                            title="پیش‌شنوایی"
                          >
                            <Play className="w-3 h-3 fill-emerald-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-muted leading-relaxed mb-6">
                نوع و کانال‌های اطلاع‌رسانی پیامکی و ایمیلی خود را مشخص کنید:
              </p>
              <div className="space-y-4">
                {/* Switch 1: New Orders */}
                <div className="flex items-center justify-between p-4 bg-background/70 rounded-2xl border border-subtle">
                  <div>
                    <h4 className="text-sm font-bold text-primary">
                      اطلاع‌رسانی فاکتورها و سفارشات جدید
                    </h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      دریافت پیامک و ایمیل هنگام ایجاد یا تغییر وضعیت سفارشات
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifSettings.newOrders}
                      onChange={(e) =>
                        setNotifSettings({
                          ...notifSettings,
                          newOrders: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-default"></div>
                  </label>
                </div>
                {/* Switch 2: Successful Payments */}
                <div className="flex items-center justify-between p-4 bg-background/70 rounded-2xl border border-subtle">
                  <div>
                    <h4 className="text-sm font-bold text-primary">
                      تایید پرداخت‌ها و تسویه‌حساب‌ها
                    </h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      ارسال پیامک تاییدیه بلافاصله پس از پرداخت صورت‌حساب‌ها یا فیش‌های بانکی
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifSettings.payments}
                      onChange={(e) =>
                        setNotifSettings({
                          ...notifSettings,
                          payments: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-default"></div>
                  </label>
                </div>
                {/* Switch 3: System Announcements */}
                <div className="flex items-center justify-between p-4 bg-background/70 rounded-2xl border border-subtle">
                  <div>
                    <h4 className="text-sm font-bold text-primary">
                      اطلاعیه‌های سیستمی و عمومی پلتفرم
                    </h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      اخبار، ارتقای ویژگی‌ها و اطلاعیه‌های دوره‌ای مدیریت کل
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifSettings.announcements}
                      onChange={(e) =>
                        setNotifSettings({
                          ...notifSettings,
                          announcements: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-default"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-subtle flex justify-end">
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl font-bold text-inverse bg-primary-default hover:bg-primary-hover transition-all shadow-lg shadow-primary-default/15 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                
                <Save className="w-5 h-5" />
                {isSubmitting
                  ? "در حال ثبت..."
                  : "ذخیره تنظیمات نوتیفیکیشن"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
