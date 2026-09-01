import React, { useState, useMemo } from "react";
import { 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  ShieldCheck, 
  Building, 
  Phone, 
  Lock, 
  ArrowRight,
  HelpCircle,
  X,
  AlertCircle
} from "lucide-react";
import { PROVINCES } from "../../data/provinces";

interface SupplierOnboardingWidgetProps {
  user: any;
  onUpdateUser: (updatedUser: any) => void;
  showNotification: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onGoToSettings?: () => void;
}

export const SupplierOnboardingWidget: React.FC<SupplierOnboardingWidgetProps> = ({
  user,
  onUpdateUser,
  showNotification,
  onGoToSettings
}) => {
  // Determine completion statuses - If shaba is filled once, do not show onboarding
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (!user?.id) return false;
    return localStorage.getItem(`dismissed_onboarding_${user.id}`) === "true";
  });

  const hasBankInfo = Boolean(
    (user?.shaba && user.shaba.replace(/\D/g, '').length >= 16) ||
    (user?.shebaNumber && user.shebaNumber.replace(/\D/g, '').length >= 16) ||
    (user?.cardNumber && user.cardNumber.replace(/\D/g, '').length >= 16)
  );

  const hasAddressInfo = Boolean(
    user?.address && 
    user.address.trim().length >= 3
  );

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`dismissed_onboarding_${user.id}`, "true");
    }
    setIsDismissed(true);
  };

  // If bank info is already provided (or both fulfilled or dismissed), the widget is not displayed
  const isFullyCompleted = hasBankInfo || isDismissed;

  // Active step in the accordion: "bank" | "address" | null
  const [activeStep, setActiveStep] = useState<"bank" | "address" | null>(
    !hasBankInfo ? "bank" : !hasAddressInfo ? "address" : null
  );

  // Bank Form State
  const [bankData, setBankData] = useState({
    shaba: user?.shaba ? (user.shaba.startsWith("IR") ? user.shaba.substring(2) : user.shaba) : "",
    cardNumber: user?.cardNumber || "",
    accountHolderName: user?.accountHolderName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ""),
    bankName: user?.bankName || ""
  });

  // Address Form State
  const [addressData, setAddressData] = useState({
    province: user?.province || "تهران",
    city: user?.city || "تهران",
    address: user?.address || "",
    postalCode: user?.postalCode || "",
    telephone: user?.telephone || ""
  });

  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (user?.brandName || user?.fullName) score += 20;
    if (user?.mobile) score += 20;
    if (hasBankInfo) score += 35;
    if (hasAddressInfo) score += 25;
    return Math.min(score, 100);
  }, [user, hasBankInfo, hasAddressInfo]);

  // Cities for selected province
  const availableCities = useMemo(() => {
    const p = PROVINCES.find(item => item.name === addressData.province);
    return p ? p.cities : [];
  }, [addressData.province]);

  // Format Card Number (XXXX-XXXX-XXXX-XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    setBankData({ ...bankData, cardNumber: raw });
  };

  // Format Shaba (numbers only, up to 24 digits)
  const handleShabaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 24);
    setBankData({ ...bankData, shaba: raw });
  };

  // Submit Bank Information
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankData.shaba || bankData.shaba.length !== 24) {
      showNotification("شماره شبا باید دقیقاً ۲۴ رقم باشد (بدون IR).", "error");
      return;
    }
    if (!bankData.accountHolderName.trim()) {
      showNotification("لطفاً نام صاحب حساب را وارد کنید.", "error");
      return;
    }

    setIsSavingBank(true);
    const cleanShaba = "IR" + bankData.shaba.trim();

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shaba: cleanShaba,
          cardNumber: bankData.cardNumber.trim(),
          accountHolderName: bankData.accountHolderName.trim(),
          bankName: bankData.bankName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        showNotification("اطلاعات بانکی با موفقیت ذخیره و فعال گردید.", "success");
        onUpdateUser(data.user);
        // Switch to address step if not completed yet
        if (!hasAddressInfo) {
          setActiveStep("address");
        } else {
          setActiveStep(null);
        }
      } else {
        showNotification(data.error || "خطا در ذخیره اطلاعات بانکی", "error");
      }
    } catch (err) {
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setIsSavingBank(false);
    }
  };

  // Submit Address Information
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressData.address || addressData.address.trim().length < 5) {
      showNotification("لطفاً نشانی کامل انبار یا محل ارسال کالا را وارد کنید.", "error");
      return;
    }

    setIsSavingAddress(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          province: addressData.province,
          city: addressData.city,
          address: addressData.address.trim(),
          postalCode: addressData.postalCode.trim(),
          telephone: addressData.telephone.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        showNotification("اطلاعات نشانی و انبار با موفقیت ثبت شد.", "success");
        onUpdateUser(data.user);
        setActiveStep(null);
      } else {
        showNotification(data.error || "خطا در ذخیره نشانی", "error");
      }
    } catch (err) {
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // If fully completed, do not render this onboarding box (it automatically fades away!)
  if (isFullyCompleted) {
    return null;
  }

  return (
    <div 
      className="bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-5 md:p-7 shadow-xl shadow-indigo-500/5 relative overflow-hidden transition-all duration-300 mb-6"
      dir="rtl"
    >
      {/* Background soft ambient accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

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
                  مراحل فعال‌سازی و تکمیل حساب تأمین‌کننده
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {completionPercentage}٪ تکمیل شده
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
                برای تسویه حساب‌های واریزی و صدور برچسب پستی، اطلاعات زیر را ثبت نمایید (پس از ثبت، این کادر محو خواهد شد).
              </p>
            </div>
          </div>

          {/* Progress Bar Display and Close Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="w-full sm:w-40 bg-slate-100 dark:bg-slate-800 rounded-full h-3 p-0.5 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div 
                className="bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              title="بستن این کادر"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="mt-5 space-y-4">
          
          {/* STEP 1: Bank & Settlement Information (High Priority) */}
          <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${hasBankInfo ? "border-emerald-500/30 bg-emerald-500/[0.02]" : activeStep === "bank" ? "border-indigo-500 bg-indigo-500/[0.02] shadow-md ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"}`}>
            {/* Step Header Toggle */}
            <button
              type="button"
              onClick={() => setActiveStep(activeStep === "bank" ? null : "bank")}
              className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${hasBankInfo ? "bg-emerald-500 text-white" : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"}`}>
                  {hasBankInfo ? <CheckCircle2 className="w-5 h-5" /> : "۱"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      مرحله ۱: اطلاعات حساب بانکی و تسویه حساب مالی
                    </span>
                    {hasBankInfo ? (
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        تکمیل شده ✓
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        الزامی برای واریز وجه
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {hasBankInfo ? `شبا: ${user.shaba}` : "شماره شبا و شماره کارت جهت واریز سود فروش محصولات شما"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hidden sm:inline">
                  {activeStep === "bank" ? "بستن فرم" : hasBankInfo ? "مشاهده / ویرایش" : "ثبت اطلاعات"}
                </span>
                {activeStep === "bank" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Step Body (Form) */}
            {activeStep === "bank" && (
              <div className="p-5 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                <form onSubmit={handleSaveBank} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Account Holder Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        نام و نام خانوادگی صاحب حساب *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: علی رضایی"
                        value={bankData.accountHolderName}
                        onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    {/* Bank Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        نام بانک
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: بانک ملی، سامان، ملت، پاسارگاد"
                        value={bankData.bankName}
                        onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    {/* Shaba Number */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          شماره شبا (۲۴ رقم عددی بدون IR) *
                        </label>
                        <span className="text-[11px] font-mono text-slate-400">
                          {bankData.shaba.length} / 24 رقم
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          dir="ltr"
                          maxLength={24}
                          placeholder="010000000000000000000000"
                          value={bankData.shaba}
                          onChange={handleShabaChange}
                          className="w-full pl-4 pr-14 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-left"
                        />
                        <div className="absolute right-3 font-black font-mono text-xs px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/20">
                          IR -
                        </div>
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        شماره ۱۶ رقمی کارت بانکی (اختیاری جهت واریز سریع)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          dir="ltr"
                          maxLength={16}
                          placeholder="6037************"
                          value={bankData.cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-left"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>اطلاعات بانکی با امنیت کامل نگهداری می‌شود و صرفاً جهت واریز وجه استفاده می‌گردد.</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingBank}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingBank ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>ذخیره و تایید اطلاعات بانکی</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* STEP 2: Address & Logistics Details */}
          <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${hasAddressInfo ? "border-emerald-500/30 bg-emerald-500/[0.02]" : activeStep === "address" ? "border-indigo-500 bg-indigo-500/[0.02] shadow-md ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"}`}>
            {/* Step Header Toggle */}
            <button
              type="button"
              onClick={() => setActiveStep(activeStep === "address" ? null : "address")}
              className="w-full p-4 flex items-center justify-between gap-3 text-right cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${hasAddressInfo ? "bg-emerald-500 text-white" : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"}`}>
                  {hasAddressInfo ? <CheckCircle2 className="w-5 h-5" /> : "۲"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      مرحله ۲: نشانی دقیق انبار / کارگاه و کد پستی (لجستیک)
                    </span>
                    {hasAddressInfo ? (
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        تکمیل شده ✓
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        جهت صدور لیبل و بارنامه
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {hasAddressInfo ? `${user.province || ''}، ${user.city || ''} - ${user.address}` : "آدرس دقیق محل تحویل بار به مامور پست یا پیک زوپیت"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hidden sm:inline">
                  {activeStep === "address" ? "بستن فرم" : hasAddressInfo ? "مشاهده / ویرایش" : "ثبت آدرس انبار"}
                </span>
                {activeStep === "address" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Step Body (Form) */}
            {activeStep === "address" && (
              <div className="p-5 pt-1 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Province */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        استان محل انبار / تولیدی *
                      </label>
                      <select
                        value={addressData.province}
                        onChange={(e) => {
                          const newProv = e.target.value;
                          const found = PROVINCES.find(p => p.name === newProv);
                          setAddressData({
                            ...addressData,
                            province: newProv,
                            city: found && found.cities.length > 0 ? found.cities[0] : ""
                          });
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                      >
                        {PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        شهر / منطقه *
                      </label>
                      <select
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                      >
                        {availableCities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Full Address */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        نشانی کامل، خیابان، پلاک، طبقه، واحد انبار *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="مثال: خیابان ۱۵ خرداد، بازار بزرگ، سرای چیت‌ساز، طبقه اول، پلاک ۴۲"
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      ></textarea>
                    </div>

                    {/* Postal Code */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        کد پستی ۱۰ رقمی انبار
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={10}
                        placeholder="1234567890"
                        value={addressData.postalCode}
                        onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-left"
                      />
                    </div>

                    {/* Warehouse Telephone */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        تلفن ثابت انبار / هماهنگی
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="021-xxxxxxxx"
                        value={addressData.telephone}
                        onChange={(e) => setAddressData({ ...addressData, telephone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-left"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      در صورت تمایل، هر زمان از بخش تنظیمات حساب می‌توانید این اطلاعات را تغییر دهید.
                    </p>
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAddress ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>ذخیره نشانی و اتمام</span>
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
