import React, { useState, useEffect } from "react";
import { useUrlQueryState } from "../../utils/routeSync";
import { User, Save, Bell, CheckCircle, Scale, Gift, ShieldCheck, Upload, AlertCircle, FileCheck, Copy } from "lucide-react";
import SupplierPerformancePanel from "./SupplierPerformancePanel";
import { SupplierReferralProgram } from "./SupplierReferralProgram";

export function SupplierProfile({ user, showNotification, onUpdateUser }: any) {
  const [activeSubTab, setActiveSubTab] = useUrlQueryState<"profile" | "kyc" | "performance" | "referral" | "notifications">("tab",
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
    nationalCode: user?.nationalCode || "",
    postalCode: user?.postalCode || "",
    autoApproveOrders: user?.autoApproveOrders ?? true,
  });

  const [kycDocs, setKycDocs] = useState({
    nationalCardImg: user?.nationalCardImg || "",
    businessLicenseImg: user?.businessLicenseImg || "",
    status: user?.isVerified ? "VERIFIED" : (user?.nationalCardImg ? "PENDING" : "UNVERIFIED")
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
    <div className={`${activeSubTab === 'performance' || activeSubTab === 'referral' ? 'max-w-4xl' : 'max-w-2xl'} mx-auto space-y-6 animate-fade-in`} dir="rtl">
      
      <div className="bg-card rounded-3xl shadow-sm border border-subtle p-6 lg:p-8">
        
        {/* Tab Headers */}
        <div className="flex border-b border-subtle mb-8 pb-1 gap-4 sm:gap-6 overflow-x-auto">
          
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`pb-4 text-sm sm:text-base font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 relative ${activeSubTab === "profile" ? "text-primary-default" : "text-muted hover:text-text-primary"}`}
          >
            <User className="w-5 h-5" /> ویرایش مشخصات
            {activeSubTab === "profile" && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full animate-fade-in"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("kyc")}
            className={`pb-4 text-sm sm:text-base font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 relative ${activeSubTab === "kyc" ? "text-primary-default" : "text-muted hover:text-text-primary"}`}
          >
            <ShieldCheck className="w-5 h-5 text-indigo-500" /> تکمیل مدارک و هویت
            {kycDocs.status === "VERIFIED" ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
            {activeSubTab === "kyc" && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full animate-fade-in"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("performance")}
            className={`pb-4 text-sm sm:text-base font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 relative ${activeSubTab === "performance" ? "text-primary-default" : "text-muted hover:text-text-primary"}`}
          >
            <Scale className="w-5 h-5" /> امتیاز عملکرد
            {activeSubTab === "performance" && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full animate-fade-in"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("referral")}
            className={`pb-4 text-sm sm:text-base font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 relative ${activeSubTab === "referral" ? "text-primary-default" : "text-muted hover:text-text-primary"}`}
          >
            <Gift className="w-5 h-5 text-emerald-500" /> دعوت از همکاران
            {activeSubTab === "referral" && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full animate-fade-in"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`pb-4 text-sm sm:text-base font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 relative ${activeSubTab === "notifications" ? "text-primary-default" : "text-muted hover:text-text-primary"}`}
          >
            <Bell className="w-5 h-5" /> تنظیمات نوتیفیکیشن
            {activeSubTab === "notifications" && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full animate-fade-in"></span>
            )}
          </button>
        </div>
        {activeSubTab === "performance" ? (
          <SupplierPerformancePanel />
        ) : activeSubTab === "referral" ? (
          <SupplierReferralProgram user={user} />
        ) : activeSubTab === "kyc" ? (
          <div className="space-y-6 animate-fade-in">
            {/* Status Banner */}
            {kycDocs.status === "VERIFIED" ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm">احراز هویت و مدارک شما تایید شده است</h4>
                  <p className="text-xs mt-0.5 opacity-90">تمامی امکانات پنل مانند ثبت کد رهگیری و تسویه‌حساب خودکار برای شما فعال می‌باشد.</p>
                </div>
              </div>
            ) : kycDocs.status === "PENDING" ? (
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl flex items-center gap-3 text-indigo-900 dark:text-indigo-200">
                <FileCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm">مدارک شما بارگذاری شده و در حال بررسی کارشناسان است</h4>
                  <p className="text-xs mt-0.5 opacity-90">بررسی مدارک معمولاً حداکثر ۲۴ ساعت کاری زمان می‌برد.</p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm">مدارک و احراز هویت شما تکمیل نشده است</h4>
                  <p className="text-xs mt-0.5 opacity-90">جهت فعال‌سازی قابلیت ثبت ارسال پستی و دریافت تسویه‌حساب‌ها، فرم و تصاویر مدارک زیر را تکمیل کنید.</p>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setTimeout(() => {
                  setIsSubmitting(false);
                  setKycDocs((prev) => ({ ...prev, status: "PENDING" }));
                  if (showNotification) {
                    showNotification("مدارک و احراز هویت شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.", "success");
                  }
                  if (onUpdateUser) {
                    onUpdateUser({
                      ...user,
                      nationalCode: formData.nationalCode,
                      postalCode: formData.postalCode,
                      kycVerified: true,
                    });
                  }
                }, 800);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">کد ملی صاحب حساب / مدیر مسئول</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.nationalCode}
                    onChange={(e) => setFormData({ ...formData, nationalCode: e.target.value })}
                    placeholder="مثال: 0012345678"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary-default outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">کد پستی ۱۰ رقمی انبار / دفتر</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="مثال: 1234567890"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary-default outline-none"
                  />
                </div>
              </div>

              {/* Upload Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dashed border-subtle rounded-2xl p-5 bg-surface text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">تصویر کارت ملی (روی کارت)</h5>
                    <p className="text-[11px] text-muted mt-1">فرمت‌های JPG، PNG (حداکثر ۵ مگابایت)</p>
                  </div>
                  <input
                    type="text"
                    value={kycDocs.nationalCardImg}
                    onChange={(e) => setKycDocs({ ...kycDocs, nationalCardImg: e.target.value })}
                    placeholder="لینک تصویر یا انتخاب فایل..."
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="border border-dashed border-subtle rounded-2xl p-5 bg-surface text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">تصویر جواز کسب / گواهی شرکت</h5>
                    <p className="text-[11px] text-muted mt-1">جواز اتحادیه یا روزنامه رسمی (اختیاری)</p>
                  </div>
                  <input
                    type="text"
                    value={kycDocs.businessLicenseImg}
                    onChange={(e) => setKycDocs({ ...kycDocs, businessLicenseImg: e.target.value })}
                    placeholder="لینک تصویر یا انتخاب فایل..."
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary-default text-inverse px-8 py-3 rounded-xl font-bold text-xs hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-primary-default/20 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "در حال ارسال مدارک..." : "ثبت و ارسال مدارک برای تایید"}
                </button>
              </div>
            </form>
          </div>
        ) : activeSubTab === "profile" ? (
          /* Profile Details Form */ <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            
            {/* Supplier Unique Code Field (ZP-XXXX) */}
            <div className="bg-[#F3F4F6] p-4 rounded-2xl border border-subtle mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-800">
                  کد شناسایی تأمین‌کننده (غیرقابل ویرایش)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">شناسه اختصاصی سیستم زوپیت</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={
                    user?.supplierCode ||
                    user?.code ||
                    (user?.id ? `ZP-${String(user.id).padStart(4, "0")}` : "ZP-8402")
                  }
                  disabled
                  readOnly
                  className="w-full px-4 py-2.5 bg-[#F3F4F6] border border-gray-300 rounded-xl font-mono font-bold text-slate-900 cursor-not-allowed outline-none text-left tracking-wider text-base"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => {
                    const codeToCopy =
                      user?.supplierCode ||
                      user?.code ||
                      (user?.id ? `ZP-${String(user.id).padStart(4, "0")}` : "ZP-8402");
                    navigator.clipboard.writeText(codeToCopy);
                    if (showNotification) {
                      showNotification("کد شناسایی تأمین‌کننده با موفقیت کپی شد", "success");
                    }
                  }}
                  className="px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
                >
                  <Copy className="w-4 h-4 text-indigo-600" />
                  <span>کپی کد</span>
                </button>
              </div>
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
          
            <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-indigo-900">تایید خودکار سفارشات</h4>
                <p className="text-xs text-indigo-700/70 mt-1">
                  در صورت فعال بودن، موجودی کالاها به محض ثبت سفارش کسر شده و مستقیماً وارد مرحله "در انتظار پرداخت" می‌شود.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoApproveOrders}
                  onChange={(e) => setFormData({ ...formData, autoApproveOrders: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
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
