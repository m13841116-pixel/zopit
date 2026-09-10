import React, { useState, useEffect, useMemo } from "react";
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
  Users,
  Package,
  KeyRound,
  RefreshCw,
  Clock,
  Check,
  AlertCircle,
  Globe,
  Instagram,
  ChevronDown
} from "lucide-react";
import { ZopitLogo } from "../ZopitLogo";
import { EnamadBadge } from "../EnamadBadge";
import { PROVINCES } from "../../data/provinces";

// Convert Persian and Arabic digits to English digits
export function toEnglishDigits(str: string): string {
  if (!str) return "";
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicNumbers  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
  }
  return result;
}

export type AuthMode = "register" | "login" | "forgot_password";
export type AuthRole = "supplier" | "store" | "ambassador";
export type LoginMethod = "password" | "otp";

interface AuthPageProps {
  initialMode?: AuthMode;
  initialRole?: AuthRole;
  onSuccess: (user: any, token: string) => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onShowTerms?: (type: "supplier" | "store" | "general") => void;
  onNavigateToExplore?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "register",
  initialRole = "supplier",
  onSuccess,
  showNotification,
  onShowTerms,
  onNavigateToExplore
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [activeRole, setActiveRole] = useState<AuthRole>(initialRole);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");

  // Sync props when initial state changes
  useEffect(() => {
    setMode(initialMode);
    setActiveRole(initialRole);
  }, [initialMode, initialRole]);

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    fullName: "",
    brandName: "",
    activityType: "عمده‌فروشی",
    mobile: "",
    province: "تهران",
    city: "تهران",
    password: "",
    agreementAccepted: true
  });

  // Store Manager Form State
  const [storeForm, setStoreForm] = useState({
    fullName: "",
    storeName: "",
    mobile: "",
    websiteOrInstagram: "",
    password: "",
    agreementAccepted: true
  });

  // Ambassador Form State
  const [ambassadorForm, setAmbassadorForm] = useState({
    fullName: "",
    mobile: "",
    password: "",
    agreementAccepted: true
  });

  // Password Login Form State
  const [loginForm, setLoginForm] = useState({
    usernameOrMobile: "",
    password: ""
  });

  const [rememberMe, setRememberMe] = useState(true);

  // Auto-fill saved credentials on mount if user had remembered or registered
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("zopit_saved_username") || localStorage.getItem("saved_username") || "";
      const savedPass = localStorage.getItem("zopit_saved_password") || "";
      const isRemember = localStorage.getItem("zopit_remember_me") !== "false";
      if (savedUser) {
        setLoginForm(prev => ({
          usernameOrMobile: savedUser,
          password: isRemember && savedPass ? savedPass : prev.password
        }));
        setOtpMobile(savedUser);
        setRememberMe(isRemember);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // OTP Login Form State
  const [otpMobile, setOtpMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Available cities for selected province
  const availableCities = useMemo(() => {
    const prov = PROVINCES.find(p => p.name === supplierForm.province);
    return prov ? prov.cities : ["تهران"];
  }, [supplierForm.province]);

  // Timer countdown for OTP
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Color Palette per role
  const roleTheme = useMemo(() => {
    switch (activeRole) {
      case "supplier":
        return {
          primaryHex: "#6366F1",
          hoverHex: "#4F46E5",
          btnClass: "bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/25",
          tabClass: "bg-[#6366F1] text-white shadow-md shadow-indigo-500/20",
          borderClass: "border-[#6366F1]",
          ringClass: "focus:ring-[#6366F1]/20 focus:border-[#6366F1]",
          badgeBg: "bg-indigo-500/10 text-[#6366F1]",
          guideBg: "bg-slate-900 border border-slate-800 text-white",
          guideIconBg: "bg-[#6366F1]/20 text-[#6366F1]",
          roleName: "تامین‌کننده",
          roleDesc: "عمده‌فروش / تولیدکننده / واردکننده"
        };
      case "store":
        return {
          primaryHex: "#10B981",
          hoverHex: "#059669",
          btnClass: "bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/25",
          tabClass: "bg-[#10B981] text-white shadow-md shadow-emerald-500/20",
          borderClass: "border-[#10B981]",
          ringClass: "focus:ring-[#10B981]/20 focus:border-[#10B981]",
          badgeBg: "bg-emerald-500/10 text-[#10B981]",
          guideBg: "bg-slate-900 border border-slate-800 text-white",
          guideIconBg: "bg-[#10B981]/20 text-[#10B981]",
          roleName: "مدیر فروشگاه",
          roleDesc: "خرده‌فروش آنلاین / اینستاگرامی / حضوری"
        };
      case "ambassador":
        return {
          primaryHex: "#3B82F6",
          hoverHex: "#2563EB",
          btnClass: "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-500/25",
          tabClass: "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20",
          borderClass: "border-[#3B82F6]",
          ringClass: "focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]",
          badgeBg: "bg-blue-500/10 text-[#3B82F6]",
          guideBg: "bg-slate-900 border border-slate-800 text-white",
          guideIconBg: "bg-[#3B82F6]/20 text-[#3B82F6]",
          roleName: "تأمین‌یاب",
          roleDesc: "معرف تامین‌کنندگان و دریافت کارمزد"
        };
    }
  }, [activeRole]);

  // Handle Supplier Registration
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierForm.fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی مدیر/رابط را وارد کنید.");
      return;
    }
    if (!supplierForm.brandName.trim()) {
      setError("لطفاً نام برند تجاری یا کارگاه تولیدی را وارد کنید.");
      return;
    }

    const cleanMobile = toEnglishDigits(supplierForm.mobile).replace(/\D/g, "");
    if (!cleanMobile || !/^09\d{9}$/.test(cleanMobile)) {
      setError("شماره موبایل معتبر نیست. لطفاً یک شماره ۱۱ رقمی وارد کنید (مثال: 09121234567).");
      return;
    }

    if (!supplierForm.password || supplierForm.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setLoading(true);

    try {
      const parts = supplierForm.fullName.trim().split(" ");
      const firstName = parts[0] || "تامین‌کننده";
      const lastName = parts.slice(1).join(" ") || "محترم";

      const payload = {
        firstName,
        lastName,
        fullName: supplierForm.fullName.trim(),
        username: cleanMobile,
        mobile: cleanMobile,
        brandName: supplierForm.brandName.trim(),
        activityType: supplierForm.activityType,
        province: supplierForm.province,
        city: supplierForm.city,
        password: supplierForm.password,
        agreementAccepted: true
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

      showNotification?.("ثبت‌نام تامین‌کننده با موفقیت انجام شد! خوش آمدید.", "success");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", "SUPPLIER");
      localStorage.setItem("saved_username", cleanMobile);
      localStorage.setItem("zopit_remember_me", "true");
      localStorage.setItem("zopit_saved_username", cleanMobile);
      localStorage.setItem("zopit_saved_password", supplierForm.password);

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Handle Store Manager Registration
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeForm.fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }
    if (!storeForm.storeName.trim()) {
      setError("لطفاً نام فروشگاه خود را وارد کنید.");
      return;
    }

    const cleanMobile = toEnglishDigits(storeForm.mobile).replace(/\D/g, "");
    if (!cleanMobile || !/^09\d{9}$/.test(cleanMobile)) {
      setError("شماره موبایل معتبر نیست. لطفاً یک شماره ۱۱ رقمی وارد کنید.");
      return;
    }

    if (!storeForm.password || storeForm.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setLoading(true);

    try {
      const parts = storeForm.fullName.trim().split(" ");
      const firstName = parts[0] || "مدیر";
      const lastName = parts.slice(1).join(" ") || "فروشگاه";

      const payload = {
        firstName,
        lastName,
        fullName: storeForm.fullName.trim(),
        username: cleanMobile,
        mobile: cleanMobile,
        storeName: storeForm.storeName.trim(),
        websiteOrInstagram: storeForm.websiteOrInstagram.trim(),
        password: storeForm.password,
        role: "STORE"
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

      showNotification?.("ثبت‌نام فروشگاه با موفقیت انجام شد! خوش آمدید.", "success");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", "STORE");
      localStorage.setItem("saved_username", cleanMobile);
      localStorage.setItem("zopit_remember_me", "true");
      localStorage.setItem("zopit_saved_username", cleanMobile);
      localStorage.setItem("zopit_saved_password", storeForm.password);

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Handle Ambassador Registration
  const handleAmbassadorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ambassadorForm.fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }

    const cleanMobile = toEnglishDigits(ambassadorForm.mobile).replace(/\D/g, "");
    if (!cleanMobile || !/^09\d{9}$/.test(cleanMobile)) {
      setError("شماره موبایل معتبر نیست. لطفاً یک شماره ۱۱ رقمی وارد کنید.");
      return;
    }

    if (!ambassadorForm.password || ambassadorForm.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setLoading(true);

    try {
      const parts = ambassadorForm.fullName.trim().split(" ");
      const firstName = parts[0] || "تأمین‌یاب";
      const lastName = parts.slice(1).join(" ") || "محترم";

      const payload = {
        firstName,
        lastName,
        fullName: ambassadorForm.fullName.trim(),
        username: cleanMobile,
        mobile: cleanMobile,
        password: ambassadorForm.password
      };

      const res = await fetch("/api/auth/register-referrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت‌نام تأمین‌یاب");
      }

      showNotification?.("ثبت‌نام تأمین‌یاب با موفقیت انجام شد! خوش آمدید.", "success");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", "AMBASSADOR");
      localStorage.setItem("saved_username", cleanMobile);
      localStorage.setItem("zopit_remember_me", "true");
      localStorage.setItem("zopit_saved_username", cleanMobile);
      localStorage.setItem("zopit_saved_password", ambassadorForm.password);

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = toEnglishDigits(loginForm.usernameOrMobile).trim();
    if (!cleanUsername) {
      setError("لطفاً شماره موبایل یا نام کاربری را وارد کنید.");
      return;
    }
    if (!loginForm.password) {
      setError("لطفاً رمز عبور را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          password: loginForm.password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "نام کاربری یا رمز عبور اشتباه است.");
      }

      showNotification?.("ورود موفقیت‌آمیز بود! در حال انتقال...", "success");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("saved_username", cleanUsername);

      if (rememberMe) {
        localStorage.setItem("zopit_remember_me", "true");
        localStorage.setItem("zopit_saved_username", cleanUsername);
        localStorage.setItem("zopit_saved_password", loginForm.password);
      } else {
        localStorage.removeItem("zopit_remember_me");
        localStorage.removeItem("zopit_saved_password");
      }

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "خطا در ورود به حساب");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = toEnglishDigits(otpMobile).replace(/\D/g, "");
    if (!cleanMobile || !/^09\d{9}$/.test(cleanMobile)) {
      setError("شماره موبایل معتبر نیست. لطفاً شماره ۱۱ رقمی وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ارسال کد پیامکی");
      }

      setOtpSent(true);
      setOtpTimer(120);
      if (data.code) {
        setSimulatedCode(data.code);
      }
      showNotification?.(`کد پیامکی برای ${cleanMobile} ارسال شد.`, "info");
    } catch (err: any) {
      setError(err.message || "خطا در ارسال کد پیامکی");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = toEnglishDigits(otpMobile).replace(/\D/g, "");
    const cleanCode = toEnglishDigits(otpCode).trim();

    if (!cleanCode || cleanCode.length < 4) {
      setError("لطفاً کد ۴ رقمی پیامک‌شده را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile, code: cleanCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "کد وارد شده صحیح نیست یا منقضی شده است.");
      }

      showNotification?.("ورود موفقیت‌آمیز بود!", "success");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("saved_username", cleanMobile);

      if (rememberMe) {
        localStorage.setItem("zopit_remember_me", "true");
        localStorage.setItem("zopit_saved_username", cleanMobile);
      }

      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "کد تایید معتبر نیست");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex flex-col justify-between items-center py-4 sm:py-6 px-3 sm:px-4 relative font-sans text-right" dir="rtl">
      {/* 5% Opacity Dot Grid Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: `radial-gradient(#111827 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px',
          opacity: 0.05
        }}
      />

      {/* Top Navbar / Explore Shortcut */}
      <div className="w-full max-w-[460px] flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-2">
          {onNavigateToExplore && (
            <button
              onClick={onNavigateToExplore}
              className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              <span>بازگشت به اکسپلور کالا</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Authentication Card */}
      <div 
        className="w-full max-w-[460px] bg-white rounded-[22px] border border-gray-100 p-5 sm:p-6 z-10 transition-all duration-300 relative shadow-xl shadow-slate-200/50"
      >
        {/* Official ZopiT Logo at Top */}
        <div className="flex flex-col items-center justify-center mb-3.5">
          <ZopitLogo size="lg" variant="full" />
          <p className="text-[11px] text-gray-500 font-bold mt-1 text-center">
            پلتفرم هوشمند B2B و خدمات جامع تامین کالا
          </p>
        </div>

        {/* Primary Auth Mode Toggle: [ورود به حساب] vs [ثبت‌نام جدید] */}
        <div className="bg-gray-100/90 p-1 rounded-xl flex items-center gap-1 mb-4 border border-gray-200/60">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-[13px] font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-white text-gray-900 shadow-sm scale-[1.01]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${mode === "login" ? "text-[#552370]" : "text-gray-400"}`} />
            <span>ورود به حساب کاربری</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-[13px] font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-white text-gray-900 shadow-sm scale-[1.01]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${mode === "register" ? "text-amber-500" : "text-gray-400"}`} />
            <span>ثبت‌نام حساب جدید</span>
          </button>
        </div>

        {/* 3-Role Switcher Tabs - ONLY DISPLAYED IN REGISTRATION MODE */}
        {mode === "register" && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-800">
                نوع حساب کاربری خود را انتخاب کنید:
              </label>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${roleTheme.badgeBg}`}>
                {roleTheme.roleName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveRole("supplier");
                  if (window.history.pushState) window.history.pushState({}, "", "/register/supplier");
                }}
                className={`p-2 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${
                  activeRole === "supplier"
                    ? "bg-indigo-50/70 border-indigo-500 text-indigo-950 shadow-xs ring-2 ring-indigo-500/20"
                    : "bg-gray-50/60 border-gray-200 text-gray-600 hover:bg-gray-100/70"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeRole === "supplier" ? "bg-[#6366F1] text-white" : "bg-gray-200 text-gray-600"}`}>
                  <Package className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black">تامین‌کننده</span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">تولیدی و عمده</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole("store");
                  if (window.history.pushState) window.history.pushState({}, "", "/register/store");
                }}
                className={`p-2 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${
                  activeRole === "store"
                    ? "bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20"
                    : "bg-gray-50/60 border-gray-200 text-gray-600 hover:bg-gray-100/70"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeRole === "store" ? "bg-[#10B981] text-white" : "bg-gray-200 text-gray-600"}`}>
                  <Store className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black">مدیر فروشگاه</span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">سایت و پیج</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole("ambassador");
                  if (window.history.pushState) window.history.pushState({}, "", "/register/ambassador");
                }}
                className={`p-2 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${
                  activeRole === "ambassador"
                    ? "bg-blue-50/70 border-blue-500 text-blue-950 shadow-xs ring-2 ring-blue-500/20"
                    : "bg-gray-50/60 border-gray-200 text-gray-600 hover:bg-gray-100/70"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeRole === "ambassador" ? "bg-[#3B82F6] text-white" : "bg-gray-200 text-gray-600"}`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black">تأمین‌یاب</span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">معرف و بازاریاب</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: REGISTRATION FORMS FOR ALL 3 ROLES               */}
        {/* ======================================================== */}
        {mode === "register" && (
          <div>
            {/* 1. SUPPLIER FORM */}
            {activeRole === "supplier" && (
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                {/* Guide Box (Purple/Dark tint) */}
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="font-black text-xs sm:text-sm text-white">
                      شروع فروش سریع در ۳ مرحله ساده
                    </p>
                  </div>
                  <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">
                    اطلاعات بانکی جهت تسویه‌حساب در این مرحله نیاز نیست
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    نام و نام خانوادگی مدیر / رابط <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={supplierForm.fullName}
                      onChange={(e) => setSupplierForm({ ...supplierForm, fullName: e.target.value })}
                      placeholder="مثال: علی محمدی"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Brand Name */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    نام برند تجاری / تولیدی / بازرگانی <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={supplierForm.brandName}
                      onChange={(e) => setSupplierForm({ ...supplierForm, brandName: e.target.value })}
                      placeholder="مثال: بازرگانی چرم آرا / تولیدی پوشاک آریا"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Activity Type Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    نوع فعالیت <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={supplierForm.activityType}
                      onChange={(e) => setSupplierForm({ ...supplierForm, activityType: e.target.value })}
                      className={`w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all cursor-pointer appearance-none ${roleTheme.ringClass}`}
                    >
                      <option value="عمده‌فروشی">عمده‌فروشی</option>
                      <option value="تولیدکننده">تولیدکننده</option>
                      <option value="واردکننده">واردکننده</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Mobile Number with Auto Persian to English Convert */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    شماره موبایل (جهت ورود و دریافت پیامک) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      value={supplierForm.mobile}
                      onChange={(e) => {
                        const converted = toEnglishDigits(e.target.value);
                        setSupplierForm({ ...supplierForm, mobile: converted });
                      }}
                      placeholder="09123456789"
                      dir="ltr"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                  <p className="text-[10px] text-[#6B7280] mt-1">اعداد فارسی خودکار به انگلیسی تبدیل می‌شوند</p>
                </div>

                {/* Province & City Connected Dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">استان</label>
                    <div className="relative">
                      <select
                        value={supplierForm.province}
                        onChange={(e) => {
                          const newProv = e.target.value;
                          const provData = PROVINCES.find(p => p.name === newProv);
                          const firstCity = provData ? provData.cities[0] : newProv;
                          setSupplierForm({ ...supplierForm, province: newProv, city: firstCity });
                        }}
                        className={`w-full px-2.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all cursor-pointer appearance-none ${roleTheme.ringClass}`}
                      >
                        {PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">شهر</label>
                    <div className="relative">
                      <select
                        value={supplierForm.city}
                        onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                        className={`w-full px-2.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all cursor-pointer appearance-none ${roleTheme.ringClass}`}
                      >
                        {availableCities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Single Password Field with Eye Icon */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    کلمه عبور <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={supplierForm.password}
                      onChange={(e) => setSupplierForm({ ...supplierForm, password: e.target.value })}
                      placeholder="حداقل ۶ کاراکتر"
                      dir="ltr"
                      className={`w-full pr-10 pl-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${roleTheme.btnClass}`}
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ثبت‌نام و ورود مستقیم به پنل تامین‌کننده"}
                </button>

                {/* Acceptance of Terms Disclaimer */}
                <p className="text-[11px] text-gray-500 text-center mt-2.5 leading-relaxed">
                  ثبت‌نام شما به منزله پذیرش کلیه{" "}
                  <button
                    type="button"
                    onClick={() => onShowTerms?.("supplier")}
                    className="text-[#552370] font-black underline hover:text-purple-950 cursor-pointer"
                  >
                    قوانین و مقررات
                  </button>{" "}
                  و شرایط استفاده از زوپیت است.
                </p>
              </form>
            )}

            {/* 2. STORE MANAGER FORM */}
            {activeRole === "store" && (
              <form onSubmit={handleStoreSubmit} className="space-y-4">
                {/* Guide Box (Green/Dark tint) */}
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="font-black text-xs sm:text-sm text-white">
                      ثبت‌نام مدیر فروشگاه
                    </p>
                  </div>
                  <p className="text-[11px] text-emerald-300 font-medium leading-relaxed">
                    دسترسی به هزاران کالای عمده بدون نیاز به سرمایه اولیه
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    نام و نام خانوادگی <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={storeForm.fullName}
                      onChange={(e) => setStoreForm({ ...storeForm, fullName: e.target.value })}
                      placeholder="مثال: رضا کریمی"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Store Name */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    نام فروشگاه <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={storeForm.storeName}
                      onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                      placeholder="مثال: فروشگاه آنلاین استایل / گالری شیک"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    شماره موبایل <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      value={storeForm.mobile}
                      onChange={(e) => {
                        const converted = toEnglishDigits(e.target.value);
                        setStoreForm({ ...storeForm, mobile: converted });
                      }}
                      placeholder="09123456789"
                      dir="ltr"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Website or Instagram Address (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    آدرس وب‌سایت یا اینستاگرام <span className="text-gray-400 font-normal">(اختیاری)</span>
                  </label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={storeForm.websiteOrInstagram}
                      onChange={(e) => setStoreForm({ ...storeForm, websiteOrInstagram: e.target.value })}
                      placeholder="@my_shop یا myshop.com"
                      dir="ltr"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Single Password Field */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    کلمه عبور <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={storeForm.password}
                      onChange={(e) => setStoreForm({ ...storeForm, password: e.target.value })}
                      placeholder="حداقل ۶ کاراکتر"
                      dir="ltr"
                      className={`w-full pr-10 pl-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${roleTheme.btnClass}`}
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ثبت‌نام و ورود به پنل فروشگاه"}
                </button>

                {/* Acceptance of Terms Disclaimer */}
                <p className="text-[11px] text-gray-500 text-center mt-2.5 leading-relaxed">
                  ثبت‌نام شما به منزله پذیرش کلیه{" "}
                  <button
                    type="button"
                    onClick={() => onShowTerms?.("store")}
                    className="text-[#059669] font-black underline hover:text-emerald-950 cursor-pointer"
                  >
                    قوانین و مقررات
                  </button>{" "}
                  و شرایط استفاده از زوپیت است.
                </p>
              </form>
            )}

            {/* 3. AMBASSADOR FORM */}
            {activeRole === "ambassador" && (
              <form onSubmit={handleAmbassadorSubmit} className="space-y-4">
                {/* Guide Box (Blue/Dark tint) */}
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="font-black text-xs sm:text-sm text-white">
                      عضویت سریع به عنوان تأمین‌یاب
                    </p>
                  </div>
                  <p className="text-[11px] text-blue-300 font-medium leading-relaxed">
                    معرفی تامین‌کننده به پلتفرم زوپیت و کسب درآمد کارمزدی
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    نام و نام خانوادگی <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={ambassadorForm.fullName}
                      onChange={(e) => setAmbassadorForm({ ...ambassadorForm, fullName: e.target.value })}
                      placeholder="مثال: مریم قاسمی"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    شماره موبایل <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      value={ambassadorForm.mobile}
                      onChange={(e) => {
                        const converted = toEnglishDigits(e.target.value);
                        setAmbassadorForm({ ...ambassadorForm, mobile: converted });
                      }}
                      placeholder="09123456789"
                      dir="ltr"
                      className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                    />
                  </div>
                </div>

                {/* Single Password Field */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">
                    کلمه عبور <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={ambassadorForm.password}
                      onChange={(e) => setAmbassadorForm({ ...ambassadorForm, password: e.target.value })}
                      placeholder="حداقل ۶ کاراکتر"
                      dir="ltr"
                      className={`w-full pr-10 pl-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${roleTheme.btnClass}`}
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ثبت‌نام و شروع همکاری"}
                </button>

                {/* Acceptance of Terms Disclaimer */}
                <p className="text-[11px] text-gray-500 text-center mt-2.5 leading-relaxed">
                  ثبت‌نام شما به منزله پذیرش کلیه{" "}
                  <button
                    type="button"
                    onClick={() => onShowTerms?.("general")}
                    className="text-[#2563EB] font-black underline hover:text-blue-950 cursor-pointer"
                  >
                    قوانین و مقررات
                  </button>{" "}
                  و شرایط استفاده از زوپیت است.
                </p>
              </form>
            )}

            {/* Prominent Under-button Login Link */}
            <div className="mt-6 text-center border-t border-gray-100 pt-4">
              <p className="text-xs text-[#6B7280] font-bold">
                قبلاً ثبت‌نام کرده‌اید؟{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`font-black underline cursor-pointer hover:opacity-80`}
                  style={{ color: roleTheme.primaryHex }}
                >
                  ورود به حساب کاربری
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: LOGIN FORM (PASSWORD OR SMS OTP)                 */}
        {/* ======================================================== */}
        {mode === "login" && (
          <div className="space-y-5">
            {/* Login Method Toggle Pills */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200/60">
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMethod === "password"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ورود با رمز عبور</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod("otp")}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginMethod === "otp"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>ورود سریع با کد پیامکی (OTP)</span>
              </button>
            </div>

            {/* 1. PASSWORD LOGIN METHOD */}
            {loginMethod === "password" && (
              <form onSubmit={handlePasswordLogin} autoComplete="on" className="space-y-4">
                <div>
                  <label htmlFor="login_username" className="block text-xs font-bold text-[#374151] mb-1.5">
                    شماره موبایل یا نام کاربری <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login_username"
                      name="username"
                      autoComplete="username"
                      type="text"
                      required
                      value={loginForm.usernameOrMobile}
                      onChange={(e) => {
                        const converted = toEnglishDigits(e.target.value);
                        setLoginForm({ ...loginForm, usernameOrMobile: converted });
                      }}
                      placeholder="09121234567"
                      dir="ltr"
                      className="w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all focus:border-[#552370] focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login_password" className="block text-xs font-bold text-[#374151]">
                      کلمه عبور <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode("forgot_password")}
                      className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline cursor-pointer"
                    >
                      رمز عبور را فراموش کرده‌اید؟
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login_password"
                      name="password"
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full pr-10 pl-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all focus:border-[#552370] focus:ring-2 focus:ring-purple-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 text-white bg-[#552370] hover:bg-[#431959] shadow-md shadow-purple-950/20 active:scale-[0.99]"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ورود به حساب کاربری"}
                </button>

                <p className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#552370]" />
                  <span>تشخیص هوشمند و هدایت خودکار به پنل کاربری شما</span>
                </p>
              </form>
            )}

            {/* 2. SMS OTP LOGIN METHOD */}
            {loginMethod === "otp" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1.5">
                        شماره موبایل <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          inputMode="numeric"
                          required
                          value={otpMobile}
                          onChange={(e) => {
                            const converted = toEnglishDigits(e.target.value);
                            setOtpMobile(converted);
                          }}
                          placeholder="09123456789"
                          dir="ltr"
                          className="w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all focus:border-[#552370] focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1.5 leading-relaxed">
                        کد تایید ۴ رقمی از طریق پیامک به این شماره ارسال خواهد شد.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !otpMobile.trim()}
                      className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 text-white bg-[#552370] hover:bg-[#431959] shadow-md shadow-purple-950/20 active:scale-[0.99]"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ارسال کد یکبارمصرف پیامکی"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-bold flex items-center justify-between">
                      <span>کد پیامک‌شده به <strong className="font-mono dir-ltr inline-block">{otpMobile}</strong> را وارد کنید:</span>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(""); }}
                        className="text-[11px] text-blue-700 underline font-black hover:text-blue-900 cursor-pointer"
                      >
                        ویرایش شماره
                      </button>
                    </div>

                    {/* Simulated Code Hint for Testing */}
                    {simulatedCode && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between">
                        <span>کد شبیه‌سازی‌شده آزمایشی: <strong className="font-mono text-sm text-indigo-600">{simulatedCode}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(simulatedCode)}
                          className="px-2 py-1 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black cursor-pointer hover:bg-amber-300"
                        >
                          درج خودکار
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-1.5">
                        کد ۴ رقمی تایید
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={otpCode}
                        onChange={(e) => {
                          const converted = toEnglishDigits(e.target.value).replace(/\D/g, "");
                          setOtpCode(converted);
                        }}
                        placeholder="••••"
                        dir="ltr"
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono font-black text-lg tracking-[0.5em] text-gray-900 outline-none transition-all focus:border-[#552370] focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* Countdown Timer or Resend Button */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                      {otpTimer > 0 ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>ارسال مجدد تا {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[#552370] font-black hover:underline cursor-pointer"
                        >
                          ارسال مجدد کد پیامکی
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 4}
                      className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 text-white bg-[#552370] hover:bg-[#431959] shadow-md shadow-purple-950/20 active:scale-[0.99]"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ورود مستقیم به پنل"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Switch to Register */}
            <div className="mt-6 text-center border-t border-gray-100 pt-4">
              <p className="text-xs text-[#6B7280] font-bold">
                هنوز حساب کاربری ندارید؟{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="font-black text-[#552370] underline cursor-pointer hover:text-purple-950"
                >
                  ثبت‌نام سریع و رایگان در زوپیت
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 3: FORGOT PASSWORD                                  */}
        {/* ======================================================== */}
        {mode === "forgot_password" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-base font-black text-gray-900 mb-1">بازیابی کلمه عبور</h3>
              <p className="text-xs text-gray-500 font-medium">شماره موبایل خود را جهت بازیابی رمز عبور وارد کنید</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">شماره موبایل ثبت‌شده</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={otpMobile}
                    onChange={(e) => setOtpMobile(toEnglishDigits(e.target.value))}
                    placeholder="09123456789"
                    dir="ltr"
                    className={`w-full pr-10 pl-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 text-left outline-none transition-all ${roleTheme.ringClass}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !otpMobile.trim()}
                className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${roleTheme.btnClass}`}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ارسال کد تایید بازیابی"}
              </button>
            </form>

            <div className="text-center pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs font-black text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                بازگشت به صفحه ورود
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer of Auth Pages (Enamad Badge & Copyright) */}
      <footer className="w-full max-w-[460px] mt-4 text-center space-y-2 z-10">
        <div className="flex items-center justify-center gap-3">
          {/* Enamad Badge */}
          <EnamadBadge variant="compact" />
        </div>
        <p className="text-[10px] text-[#6B7280] font-medium">
          © ۲۰۲۶ پلتفرم یکپارچه تامین و فروش کالا زوپیت • کلیه حقوق محفوظ است.
        </p>
      </footer>
    </div>
  );
};
