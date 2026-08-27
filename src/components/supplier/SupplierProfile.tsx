import React, { useState, useEffect } from "react";
import { useUrlQueryState } from "../../utils/routeSync";
import { User, Save, Bell, CheckCircle } from "lucide-react";
export function SupplierProfile({ user, showNotification, onUpdateUser }: any) {
  const [activeSubTab, setActiveSubTab] = useUrlQueryState<"profile" | "notifications">("tab",
    "profile",
  );
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    brandName: user?.brandName || "",
    shaba: user?.shaba
      ? user.shaba.startsWith("IR")
        ? user.shaba.substring(2)
        : user.shaba
      : "",
    mobile: user?.mobile || "",
    bankName: user?.bankName || "",
    accountHolderName: user?.accountHolderName || "",
    address: user?.address || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* Notification states persisted in localStorage */ const [
    notifSettings,
    setNotifSettings,
  ] = useState({ newOrders: true, payments: true, announcements: false });
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    /* Format & Validate Shaba */ let cleanShaba = formData.shaba
      .toUpperCase()
      .replace(/[\s-]/g, "");
    if (cleanShaba) {
      if (!cleanShaba.startsWith("IR")) {
        cleanShaba = "IR" + cleanShaba;
      }
      const numericPart = cleanShaba.substring(2);
      if (numericPart.length !== 24 || !/^\d{24}$/.test(numericPart)) {
        showNotification(
          "شماره شبا باید دقیقاً شامل ۲۴ رقم عددی باشد.",
          "error",
        );
        setIsSubmitting(false);
        return;
      }
    }
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/profile", { credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, shaba: cleanShaba }),
      });
      const result = await res.json();
      if (res.ok) {
        showNotification("پروفایل با موفقیت بروزرسانی شد", "success");
        if (onUpdateUser && result.user) {
          onUpdateUser(result.user);
        }
      } else {
        showNotification(result.error || "خطا در بروزرسانی پروفایل", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      
      <div className="bg-card rounded-3xl shadow-sm border border-subtle p-6 lg:p-8">
        
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
            className="space-y-4"
          >
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-subtle mb-4">
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                نام کاربری (غیرقابل ویرایش)
              </label>
              <input
                type="text"
                value={user?.username || ""}
                disabled
                readOnly
                className="w-full px-4 py-2.5 bg-slate-100 border border-subtle rounded-xl font-mono text-left text-slate-500 cursor-not-allowed outline-none"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  نام
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                />
              </div>
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  نام خانوادگی
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                />
              </div>
            </div>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                نام برند / فروشگاه
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) =>
                  setFormData({ ...formData, brandName: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
              />
            </div>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                شماره موبایل
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left"
                dir="ltr"
              />
            </div>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                آدرس انبار / تامین‌کننده
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none h-20 resize-none"
                placeholder="آدرس دقیق انبار یا دفتر خود را جهت هماهنگی ارسال‌ها وارد کنید..."
              />
            </div>
            <div className="border-t border-subtle pt-4 mt-4">
              
              <h3 className="font-bold text-primary text-base mb-3">
                اطلاعات حساب بانکی (جهت تسویه)
              </h3>
              <div className="space-y-4">
                
                <div>
                  
                  <label className="block text-sm font-semibold text-secondary mb-1.5">
                    شماره شبا
                  </label>
                  <div className="relative">
                    
                    <span className="absolute left-4 top-3 font-semibold text-muted">
                      IR
                    </span>
                    <input
                      type="text"
                      value={formData.shaba}
                      onChange={(e) =>
                        setFormData({ ...formData, shaba: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left font-mono"
                      dir="ltr"
                      placeholder="000000000000000000000000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    
                    <label className="block text-sm font-semibold text-secondary mb-1.5">
                      نام بانک
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="مثلا: ملی، ملت، سامان"
                      className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                    />
                  </div>
                  <div>
                    
                    <label className="block text-sm font-semibold text-secondary mb-1.5">
                      نام صاحب حساب
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accountHolderName: e.target.value,
                        })
                      }
                      placeholder="نام و نام خانوادگی صاحب حساب"
                      className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-default text-inverse px-8 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                
                <Save className="w-5 h-5" />
                {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </form>
        ) : (
          /* Notification Settings Form */ <form
            onSubmit={handleSaveNotifications}
            className="space-y-6"
          >
            
            <div>
              
              <p className="text-sm text-muted leading-relaxed mb-6">
                
                نوع و کانال‌های اطلاع‌رسانی مورد علاقه خود را مشخص کنید.
                هشدارهای مربوط به سفارشات و فاکتورها جهت بهبود کارایی برای شما
                ارسال خواهند شد.
              </p>
              <div className="space-y-4">
                
                {/* Switch 1: New Orders */}
                <div className="flex items-center justify-between p-4 bg-background/70 rounded-2xl border border-subtle">
                  
                  <div>
                    
                    <h4 className="text-sm font-bold text-primary">
                      اطلاع‌رسانی سفارشات و فروش جدید
                    </h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      دریافت ایمیل و نوتیفیکیشن بلافاصله پس از ثبت سفارش جدید
                      توسط فروشگاه‌ها
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
                      تایید پرداخت‌ها و تسویه‌حساب‌های مالی
                    </h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      ارسال ایمیل تاییدیه پس از تسویه فاکتورها یا انتقال وجوه به
                      حساب بانکی شما
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
                      اطلاعیه‌های سیستمی و تغییر قوانین پلتفرم
                    </h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      اخبار، هشدارهای زمانبندی سرویس‌ها و قوانین جدید کمیسیون از
                      طرف مدیریت کل
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
