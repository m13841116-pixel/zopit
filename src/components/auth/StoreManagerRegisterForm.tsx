import React, { useState } from "react";
import { 
  Store, 
  User, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  CreditCard 
} from "lucide-react";

interface StoreManagerRegisterFormProps {
  onSuccess: (user: any, token: string) => void;
  onBackToLogin: () => void;
  onBackToRoleSelect?: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const StoreManagerRegisterForm: React.FC<StoreManagerRegisterFormProps> = ({
  onSuccess,
  onBackToLogin,
  onBackToRoleSelect,
  showNotification
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    storeName: "",
    storeUrl: "",
    nationalCode: "",
    password: "",
    confirmPassword: "",
    termsAccepted: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (!cleanMobile || !/^09\d{9}$/.test(cleanMobile)) {
      setError("شماره موبایل باید ۱۱ رقم بوده و با 09 شروع شود.");
      return;
    }

    if (!formData.storeName.trim()) {
      setError("لطفاً نام فروشگاه اینترنتی یا حضوری خود را وارد کنید.");
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

    setLoading(true);

    try {
      const parts = formData.fullName.trim().split(" ");
      const firstName = parts[0] || "مدیر";
      const lastName = parts.slice(1).join(" ") || "فروشگاه";

      const payload = {
        firstName,
        lastName,
        username: cleanMobile,
        mobile: cleanMobile,
        storeName: formData.storeName.trim(),
        storeUrl: formData.storeUrl.trim(),
        nationalCode: formData.nationalCode.trim() || "0000000000",
        password: formData.password,
        termsAccepted: true,
        agreementAccepted: true
      };

      const res = await fetch("/api/auth/register/store-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت‌نام مدیر فروشگاه");
      }

      if (showNotification) {
        showNotification("ثبت‌نام مدیر فروشگاه با موفقیت انجام شد.", "success");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", "STORE_MANAGER");
      localStorage.setItem("zopit_terms_accepted_global", "true");

      // Save for auto-fill on next login
      localStorage.setItem("saved_username", formData.mobile);
      if (formData.password) localStorage.setItem("saved_password", formData.password);

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط با سرور");
      if (showNotification) {
        showNotification(err.message || "خطا در ثبت‌نام", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4 animate-fade-in" dir="rtl">
      <div className="bg-card border border-border-default/80 dark:border-border-subtle/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
        <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
                ثبت‌نام مدیر فروشگاه
                <span className="bg-emerald-500/20 text-emerald-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  خرده‌فروشی
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-1">
                دسترسی به هزاران کالای عمده و بدون نیاز به سرمایه اولیه
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToRoleSelect || onBackToLogin}
            className="p-2.5 bg-surface hover:bg-border-default text-text-muted hover:text-text-primary rounded-2xl transition-all cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">نام و نام خانوادگی *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="علی رضایی"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <User className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">نام فروشگاه *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="فروشگاه شیک‌پوش"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <Store className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">شماره موبایل *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold text-left"
                />
                <Smartphone className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">آدرس وب‌سایت یا اینستاگرام (اختیاری)</label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="instagram.com/mystore"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-left"
                />
                <Globe className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">کلمه عبور *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  dir="ltr"
                  placeholder="حداقل ۶ کاراکتر"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold"
                />
                <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-text-muted"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-secondary">تکرار کلمه عبور *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  dir="ltr"
                  placeholder="تکرار رمز عبور"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold"
                />
                <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? "در حال ثبت اطلاعات..." : "ثبت‌نام و ورود به پنل فروشگاه"}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-text-muted hover:text-emerald-600 font-bold"
            >
              قبلاً ثبت‌نام کرده‌اید؟ <span className="text-emerald-600 font-black underline">ورود به حساب</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
