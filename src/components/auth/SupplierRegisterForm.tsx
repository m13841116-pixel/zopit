import React, { useState, useMemo } from "react";
import { 
  Building2, 
  User, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft,
  Store,
  FileCheck
} from "lucide-react";
import { ZopitLogo } from "../ZopitLogo";
import { PROVINCES } from "../../data/provinces";

interface SupplierRegisterFormProps {
  onSuccess: (user: any, token: string) => void;
  onBackToLogin: () => void;
  onBackToRoleSelect?: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onShowTerms?: () => void;
}

export const SupplierRegisterForm: React.FC<SupplierRegisterFormProps> = ({
  onSuccess,
  onBackToLogin,
  onBackToRoleSelect,
  showNotification,
  onShowTerms
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    brandName: "",
    province: "تهران",
    city: "تهران",
    activityType: "عمده‌فروش / تولیدکننده",
    password: "",
    confirmPassword: "",
    agreementAccepted: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCities = useMemo(() => {
    const prov = PROVINCES.find(p => p.name === formData.province);
    return prov ? prov.cities : [];
  }, [formData.province]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (!cleanMobile || !/^09\d{9}$/.test(cleanMobile)) {
      setError("شماره موبایل باید ۱۱ رقم بوده و با 09 شروع شود.");
      return;
    }

    if (!formData.brandName.trim()) {
      setError("لطفاً نام برند تجاری، فروشگاه یا کارگاه تولیدی را وارد کنید.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("تکرار رمز عبور با رمز عبور اصلی مطابقت ندارد.");
      return;
    }

    if (!formData.agreementAccepted) {
      setError("پذیرش قوانین و مقررات زوپیت الزامی است.");
      return;
    }

    setLoading(true);

    try {
      const parts = formData.fullName.trim().split(" ");
      const firstName = parts[0] || "تامین‌کننده";
      const lastName = parts.slice(1).join(" ") || "محترم";

      const payload = {
        firstName,
        lastName,
        fullName: formData.fullName.trim(),
        username: cleanMobile, // Default username to mobile for ease of access
        mobile: cleanMobile,
        brandName: formData.brandName.trim(),
        province: formData.province,
        city: formData.city.trim() || formData.province,
        activityType: formData.activityType,
        password: formData.password,
        agreementAccepted: true,
        agreementVersion: "1.0",
        agreementAcceptedAt: new Date().toISOString()
      };

      const res = await fetch("/api/auth/register/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت‌نام تامین‌کننده");
      }

      if (showNotification) {
        showNotification("ثبت‌نام شما با موفقیت انجام شد! به جمع تامین‌کنندگان زوپیت خوش آمدید.", "success");
      }

      // Save credentials
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", "SUPPLIER");
      localStorage.setItem("zopit_terms_accepted_global", "true");
      
      // Auto-open Add Product on first login
      sessionStorage.setItem("supplier_initial_tab", "add-product");

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "خطای ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
      if (showNotification) {
        showNotification(err.message || "خطا در ثبت‌نام", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4 animate-fade-in" dir="rtl">
      {/* Header card with quick back */}
      <div className="bg-card border border-border-default/80 dark:border-border-subtle/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
                ثبت‌نام سریع تأمین‌کننده
                <span className="bg-amber-400/20 text-amber-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  فروش عمده
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-1">
                اتصال مستقیم به شبکه فروشگاه‌های اینترنتی و حضوری زوپیت
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToRoleSelect || onBackToLogin}
            className="p-2.5 bg-surface hover:bg-border-default text-text-muted hover:text-text-primary rounded-2xl transition-all cursor-pointer"
            title="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Value Proposition Micro Banner - Ultra high contrast and crisp */}
        <div className="bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700 p-4 sm:p-5 rounded-2xl mb-6 shadow-md shadow-slate-950/10">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="text-xs space-y-1.5">
              <p className="font-black text-white text-sm">
                شروع فروش سریع در ۳ مرحله ساده:
              </p>
              <p className="text-slate-200 text-xs leading-relaxed font-semibold">
                ۱. تکمیل فرم کوتاه زیر (کمتر از ۱ دقیقه) ← ۲. ثبت اولین محصول ← ۳. شروع دریافت سفارشات عمده
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold p-4 rounded-2xl mb-6 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name & Brand Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                نام و نام خانوادگی مدیر / رابط *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: علی احمدی"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                <User className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                نام برند تجاری / تولیدی / بازرگانی *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: پخش نگین، کارگاه آریا"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                <Store className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Mobile & Activity Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                شماره موبایل (جهت ورود و پیامک) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={formData.mobile}
                  onChange={(e) => {
                    const clean = e.target.value
                      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
                      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
                      .replace(/\D/g, "");
                    setFormData({ ...formData, mobile: clean });
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-left font-bold"
                />
                <Smartphone className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                نوع فعالیت
              </label>
              <select
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              >
                <option value="عمده‌فروش / پخش">عمده‌فروش و پخش کالا</option>
                <option value="تولیدکننده / کارگاه">تولیدکننده و کارگاه صنعتی</option>
                <option value="واردکننده">واردکننده مستقیم</option>
                <option value="نمایندگی رسمی">نمایندگی رسمی برند</option>
              </select>
            </div>
          </div>

          {/* Location (Province & City) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                استان فعالیت
              </label>
              <div className="relative">
                <select
                  value={formData.province}
                  onChange={(e) => {
                    const newProvince = e.target.value;
                    const prov = PROVINCES.find(p => p.name === newProvince);
                    setFormData({ 
                      ...formData, 
                      province: newProvince, 
                      city: prov && prov.cities.length > 0 ? prov.cities[0] : "" 
                    });
                  }}
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium cursor-pointer"
                >
                  {PROVINCES.map((prov) => (
                    <option key={prov.name} value={prov.name}>
                      {prov.name}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                شهر / منطقه
              </label>
              <div className="relative">
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium cursor-pointer"
                  disabled={availableCities.length === 0}
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                کلمه عبور *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  dir="ltr"
                  placeholder="حداقل ۶ کاراکتر"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
                />
                <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">
                تکرار کلمه عبور *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  dir="ltr"
                  placeholder="تکرار رمز عبور"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border-default/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
                />
                <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Postponed Settlement Info Note - Ultra Clean High-Contrast */}
          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-bold mt-1">
              اطلاعات بانکی (شماره شبا و کارت) جهت واریز تسویه‌حساب‌ها در این مرحله نیاز نیست و پس از ثبت‌نام به راحتی در پیشخوان یا هنگام واریز وجه قابل ثبت است.
            </p>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={formData.agreementAccepted}
              onChange={(e) => setFormData({ ...formData, agreementAccepted: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="terms-checkbox" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none">
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  if (onShowTerms) onShowTerms();
                }} 
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-black cursor-pointer inline-block ml-1"
              >
                قوانین، مقررات و تعهدات تامین‌کنندگان زوپیت
              </button>
              را مطالعه نموده و می‌پذیرم.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال ایجاد حساب کاربری...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  <span>ثبت‌نام و ورود مستقیم به پنل تامین‌کننده</span>
                </div>
              )}
            </button>
          </div>

          {/* Existing Account Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-text-muted hover:text-indigo-600 font-bold transition-colors cursor-pointer"
            >
              قبلاً در زوپیت ثبت‌نام کرده‌اید؟ <span className="text-indigo-600 font-black underline">ورود به حساب</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
