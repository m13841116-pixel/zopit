const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Building2,
  Store,
  Phone,
  Globe,
  Tag
} from "lucide-react";

export const SupplierOnboardingWidget = ({ user, showNotification, onUpdateUser }: any) => {
  // Determine completion statuses
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (!user?.id) return false;
    return localStorage.getItem(\`dismissed_onboarding_\${user.id}\`) === "true";
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const hasBusinessInfo = Boolean(
    (user?.firstName && user?.lastName) &&
    user?.brandName &&
    user?.activityType &&
    user?.activityType.length > 2
  );

  const hasAddressInfo = Boolean(
    user?.province &&
    user?.city &&
    user?.originAddress && user.originAddress.trim().length >= 10 &&
    user?.postalCode && user.postalCode.trim().length >= 10
  );

  const hasBankInfo = Boolean(
    (user?.shaba && user.shaba.replace(/\\D/g, '').length >= 24) &&
    user?.accountHolderName &&
    user?.bankName
  );

  const isFullyCompleted = hasBusinessInfo && hasAddressInfo && hasBankInfo;

  // Active step in the accordion
  const [activeStep, setActiveStep] = useState<"business" | "address" | "bank" | null>(
    !hasBusinessInfo ? "business" : !hasAddressInfo ? "address" : !hasBankInfo ? "bank" : null
  );

  // Business Form State
  const [businessData, setBusinessData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    brandName: user?.brandName || "",
    activityType: (() => {
      try { return JSON.parse(user?.activityType || "[]"); } 
      catch { return []; }
    })() as number[],
    website: user?.website || ""
  });

  // Address Form State
  const [addressData, setAddressData] = useState({
    province: user?.province || "",
    city: user?.city || "",
    originAddress: user?.originAddress || "",
    postalCode: user?.postalCode || "",
    telephone: user?.telephone || ""
  });

  // Bank Form State
  const [bankData, setBankData] = useState({
    shaba: user?.shaba ? (user.shaba.startsWith("IR") ? user.shaba.substring(2) : user.shaba) : "",
    cardNumber: user?.cardNumber || "",
    accountHolderName: user?.accountHolderName || (user?.firstName && user?.lastName ? \`\${user.firstName} \${user.lastName}\` : ""),
    bankName: user?.bankName || ""
  });

  const [isSaving, setIsSaving] = useState(false);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    let score = 20; // 20% for registration/mobile
    if (hasBusinessInfo) score += 30;
    if (hasAddressInfo) score += 30;
    if (hasBankInfo) score += 20;
    return score;
  }, [hasBusinessInfo, hasAddressInfo, hasBankInfo]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (user?.id) {
      localStorage.setItem(\`dismissed_onboarding_\${user.id}\`, "true");
    }
  };

  const handleShabaChange = (e: any) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 24) val = val.substring(0, 24);
    setBankData({ ...bankData, shaba: val });
  };

  const handleCardNumberChange = (e: any) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    setBankData({ ...bankData, cardNumber: val });
  };

  const toggleCategory = (id: number) => {
    setBusinessData(prev => ({
      ...prev,
      activityType: prev.activityType.includes(id)
        ? prev.activityType.filter(c => c !== id)
        : [...prev.activityType, id]
    }));
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessData.firstName || !businessData.lastName || !businessData.brandName) {
      showNotification("لطفاً نام، نام خانوادگی و نام فروشگاه/برند را وارد کنید.", "error");
      return;
    }
    if (businessData.activityType.length === 0) {
      showNotification("لطفاً حداقل یک دسته فعالیت انتخاب کنید.", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify({
          firstName: businessData.firstName.trim(),
          lastName: businessData.lastName.trim(),
          brandName: businessData.brandName.trim(),
          activityType: JSON.stringify(businessData.activityType),
          website: businessData.website.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        showNotification("اطلاعات کسب‌وکار با موفقیت ثبت شد.", "success");
        onUpdateUser(data.user);
        if (!hasAddressInfo) setActiveStep("address");
        else if (!hasBankInfo) setActiveStep("bank");
        else setActiveStep(null);
      } else {
        showNotification(data.error || "خطا در ذخیره اطلاعات", "error");
      }
    } catch (err) {
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressData.province || !addressData.city || !addressData.originAddress || addressData.originAddress.trim().length < 10) {
      showNotification("لطفاً نشانی کامل مبدأ ارسال کالا را وارد کنید.", "error");
      return;
    }
    if (!addressData.postalCode || addressData.postalCode.length < 10) {
      showNotification("لطفاً کد پستی ۱۰ رقمی مبدأ را وارد کنید.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify({
          province: addressData.province.trim(),
          city: addressData.city.trim(),
          originAddress: addressData.originAddress.trim(),
          postalCode: addressData.postalCode.trim(),
          telephone: addressData.telephone.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        showNotification("اطلاعات نشانی و انبار با موفقیت ثبت شد.", "success");
        onUpdateUser(data.user);
        if (!hasBankInfo) setActiveStep("bank");
        else setActiveStep(null);
      } else {
        showNotification(data.error || "خطا در ذخیره نشانی", "error");
      }
    } catch (err) {
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bankData.shaba.length < 24) {
      showNotification("شماره شبا باید ۲۴ رقم باشد.", "error");
      return;
    }
    if (!bankData.accountHolderName || !bankData.bankName) {
      showNotification("لطفاً نام صاحب حساب و نام بانک را وارد کنید.", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify({
          shaba: bankData.shaba,
          cardNumber: bankData.cardNumber,
          accountHolderName: bankData.accountHolderName.trim(),
          bankName: bankData.bankName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        showNotification("اطلاعات بانکی با موفقیت ذخیره و فعال گردید.", "success");
        onUpdateUser(data.user);
        if (!hasBusinessInfo) setActiveStep("business");
        else if (!hasAddressInfo) setActiveStep("address");
        else setActiveStep(null);
      } else {
        showNotification(data.error || "خطا در ذخیره اطلاعات بانکی", "error");
      }
    } catch (err) {
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFullyCompleted) {
    if (!isDismissed) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600 w-6 h-6" />
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-400">تکمیل اطلاعات تأمین‌کننده: ۱۰۰٪</p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">حساب شما فعال است و می‌توانید محصولات خود را اضافه کنید.</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-emerald-600/50 hover:text-emerald-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }
    return null;
  }

  if (isDismissed) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between cursor-pointer" onClick={() => setIsDismissed(false)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">!</div>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-400">تکمیل اطلاعات تأمین‌کننده: {completionPercentage}٪</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">برای فعال شدن حساب، اطلاعات باقیمانده را تکمیل کنید.</p>
          </div>
        </div>
        <button className="text-amber-600 font-bold text-xs bg-amber-500/10 px-3 py-1.5 rounded-lg">تکمیل پروفایل</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-5 md:p-7 shadow-xl shadow-indigo-500/5 relative overflow-hidden transition-all duration-300 mb-6" dir="rtl">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      
      {/* Header & Progress Bar */}
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                  مراحل فعال‌سازی حساب تأمین‌کننده
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {completionPercentage}٪ تکمیل شده
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
                لطفاً تمامی مراحل زیر را به ترتیب تکمیل کنید تا حساب شما برای افزودن کالا آماده شود. شما می‌توانید این فرآیند را ذخیره و بعداً ادامه دهید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="w-full sm:w-40 bg-slate-100 dark:bg-slate-800 rounded-full h-3 p-0.5 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm" style={{ width: \`\${completionPercentage}%\` }}></div>
            </div>
            <button type="button" onClick={handleDismiss} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="mt-5 space-y-4">
          
          {/* LEVEL 1: Business Information */}
          <div className={\`rounded-2xl border transition-all duration-200 overflow-hidden \${hasBusinessInfo ? "border-emerald-500/30 bg-emerald-500/[0.02]" : activeStep === "business" ? "border-indigo-500 bg-indigo-500/[0.02] shadow-md ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"}\`}>
            <button type="button" onClick={() => setActiveStep(activeStep === "business" ? null : "business")} className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={\`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs \${hasBusinessInfo ? "bg-emerald-500 text-white" : "bg-amber-500/15 text-amber-600 border border-amber-500/30"}\`}>
                  {hasBusinessInfo ? <CheckCircle2 className="w-5 h-5" /> : "۱"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">اطلاعات کسب‌وکار و زمینه فعالیت</span>
                    {hasBusinessInfo && <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">تکمیل شده ✓</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">نام شرکت/برند، زمینه فعالیت، مشخصات نماینده</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 font-bold hidden sm:inline">{activeStep === "business" ? "بستن فرم" : hasBusinessInfo ? "ویرایش" : "ثبت اطلاعات"}</span>
                {activeStep === "business" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {activeStep === "business" && (
              <div className="p-5 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                <form onSubmit={handleSaveBusiness} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">نام <span className="text-red-500">*</span></label>
                      <input type="text" required value={businessData.firstName} onChange={(e) => setBusinessData({ ...businessData, firstName: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">نام خانوادگی <span className="text-red-500">*</span></label>
                      <input type="text" required value={businessData.lastName} onChange={(e) => setBusinessData({ ...businessData, lastName: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">نام فروشگاه / شرکت / برند <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="مثال: پخش عمده ایران کالا" value={businessData.brandName} onChange={(e) => setBusinessData({ ...businessData, brandName: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none" />
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">دسته‌بندی‌های فعالیت (حداقل یک مورد) <span className="text-red-500">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                          const isSelected = businessData.activityType.includes(cat.id);
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              className={\`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors \${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-300 hover:border-indigo-400'}\`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">وب‌سایت (اختیاری)</label>
                      <input type="url" dir="ltr" placeholder="https://..." value={businessData.website} onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none text-left" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end pt-2">
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                      {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                      <span>ذخیره و ادامه</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* LEVEL 2: Address & Logistics */}
          <div className={\`rounded-2xl border transition-all duration-200 overflow-hidden \${hasAddressInfo ? "border-emerald-500/30 bg-emerald-500/[0.02]" : activeStep === "address" ? "border-indigo-500 bg-indigo-500/[0.02] shadow-md ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"}\`}>
            <button type="button" onClick={() => setActiveStep(activeStep === "address" ? null : "address")} className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={\`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs \${hasAddressInfo ? "bg-emerald-500 text-white" : "bg-amber-500/15 text-amber-600 border border-amber-500/30"}\`}>
                  {hasAddressInfo ? <CheckCircle2 className="w-5 h-5" /> : "۲"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">آدرس مبدأ و ارسال (Origin Address)</span>
                    {hasAddressInfo && <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">تکمیل شده ✓</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">استان، شهر، آدرس دقیق، کد پستی (الزامی جهت ارسال کالا)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 font-bold hidden sm:inline">{activeStep === "address" ? "بستن فرم" : hasAddressInfo ? "ویرایش" : "ثبت اطلاعات"}</span>
                {activeStep === "address" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {activeStep === "address" && (
              <div className="p-5 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">استان مبدأ <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="مثال: تهران" value={addressData.province} onChange={(e) => setAddressData({ ...addressData, province: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">شهر مبدأ <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="مثال: تهران" value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">آدرس دقیق مبدأ (خیابان، کوچه، پلاک، واحد) <span className="text-red-500">*</span></label>
                      <textarea required minLength={10} placeholder="آدرس دقیق انبار یا مبدا ارسال کالا..." value={addressData.originAddress} onChange={(e) => setAddressData({ ...addressData, originAddress: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none h-20 resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">کد پستی ۱۰ رقمی <span className="text-red-500">*</span></label>
                      <input type="text" required minLength={10} maxLength={10} dir="ltr" placeholder="1234567890" value={addressData.postalCode} onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none text-left" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">تلفن ثابت (اختیاری)</label>
                      <input type="text" dir="ltr" placeholder="021XXXXXXXX" value={addressData.telephone} onChange={(e) => setAddressData({ ...addressData, telephone: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none text-left" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>این آدرس به عنوان مبدا در برچسب‌های پستی و محاسبه هزینه ارسال در نظر گرفته می‌شود.</span>
                    </div>
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                      {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                      <span>ذخیره و ادامه</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* LEVEL 3: Bank */}
          <div className={\`rounded-2xl border transition-all duration-200 overflow-hidden \${hasBankInfo ? "border-emerald-500/30 bg-emerald-500/[0.02]" : activeStep === "bank" ? "border-indigo-500 bg-indigo-500/[0.02] shadow-md ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"}\`}>
            <button type="button" onClick={() => setActiveStep(activeStep === "bank" ? null : "bank")} className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={\`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs \${hasBankInfo ? "bg-emerald-500 text-white" : "bg-amber-500/15 text-amber-600 border border-amber-500/30"}\`}>
                  {hasBankInfo ? <CheckCircle2 className="w-5 h-5" /> : "۳"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">اطلاعات حساب بانکی و تسویه مالی</span>
                    {hasBankInfo ? <span className="text-[11px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">تکمیل شده ✓</span> : <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">الزامی برای واریز وجه</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">شماره شبا و کارت جهت واریز سود فروش محصولات شما</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 font-bold hidden sm:inline">{activeStep === "bank" ? "بستن فرم" : hasBankInfo ? "ویرایش" : "ثبت اطلاعات"}</span>
                {activeStep === "bank" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {activeStep === "bank" && (
              <div className="p-5 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                <form onSubmit={handleSaveBank} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">نام و نام خانوادگی صاحب حساب <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="مثال: علی رضایی" value={bankData.accountHolderName} onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">نام بانک <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="مثال: بانک ملی" value={bankData.bankName} onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-semibold outline-none" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">شماره شبا (۲۴ رقم عددی بدون IR) <span className="text-red-500">*</span></label>
                        <span className="text-[11px] font-mono text-slate-400">{bankData.shaba.length} / 24 رقم</span>
                      </div>
                      <div className="relative flex items-center">
                        <input type="text" required dir="ltr" maxLength={24} minLength={24} placeholder="010000000000000000000000" value={bankData.shaba} onChange={handleShabaChange} className="w-full pl-4 pr-14 py-3 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-wider outline-none text-left" />
                        <div className="absolute right-3 font-black font-mono text-xs px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg border border-indigo-500/20">IR -</div>
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">شماره ۱۶ رقمی کارت بانکی (اختیاری جهت واریز سریع)</label>
                      <div className="relative">
                        <input type="text" dir="ltr" maxLength={16} placeholder="6037************" value={bankData.cardNumber} onChange={handleCardNumberChange} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest outline-none text-left" />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>اطلاعات بانکی با امنیت کامل نگهداری می‌شود.</span>
                    </div>
                    <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50">
                      {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                      <span>ذخیره و پایان ثبت نام</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
`
fs.writeFileSync('src/components/supplier/SupplierOnboardingWidget.tsx', code);
console.log('generated');
