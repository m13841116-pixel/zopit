import { EnamadBadge } from "./components/EnamadBadge";
import heroImage from "./assets/images/zopit_b2b_hero_1785266004043.jpg";
import { CartProvider } from "./components/CartContext";
import { ToastProvider, useToast } from "./components/ToastContext";
import Explore from "./components/Explore";
import { ZopitLogo } from "./components/ZopitLogo";
import { Compass, LayoutDashboard, ShoppingBag, Megaphone, Volume2 } from "lucide-react";
import Announcements from "./components/Announcements";
import StoreManagerDashboard from "./components/store-manager/StoreManagerDashboard";
import SuperAdminDashboard from "./components/superadmin/SuperAdminDashboard";
import { ZopitEcosystemBanner } from "./components/ZopitEcosystemBanner";
import { PublicAnnouncementsModal } from "./components/PublicAnnouncementsModal";
import { UrgentNotificationPopup } from "./components/UrgentNotificationPopup";
import { UserTicketing } from "./components/UserTicketing";
import React, { useState, useEffect } from "react";
import { useTheme } from "./components/ThemeProvider";
import { ThemeToggleFloating } from "./components/ThemeToggleFloating";
import { GlobalToast } from "./components/GlobalToast";
import { GlobalModals } from "./components/GlobalModals";

import {
  User,
  Lock,
  ArrowLeft,
  ArrowRight,
  Check,
  Store,
  Truck,
  AlertCircle,
  Info,
  CheckCircle,
  CheckCircle2,
  Users,
  Package,
  LogOut,
  ShieldCheck,
  Building2,
  CreditCard,
  FileText,
  Database,
  Globe,
  Layers,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Scale,
  Sparkles,
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  ExternalLink,
  X,
  KeyRound,
  Key,
  Send,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { CustomCodeInjector } from "./components/CustomCodeInjector";
import { SupplierDashboard } from "./components/supplier/SupplierDashboard";
import ReferrerDashboard from "./components/referrer/ReferrerDashboard";
import { CustomerDashboard } from "./components/CustomerDashboard";
import { PROVINCES } from "./data/provinces";

// Shaba validation function

function formatAndValidateShaba(input: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  let clean = input.toUpperCase().replace(/[\s-]/g, "");
  if (!clean.startsWith("IR")) {
    clean = "IR" + clean;
  }
  const numericPart = clean.substring(2);
  if (numericPart.length !== 24 || !/^\d{24}$/.test(numericPart)) {
    return {
      isValid: false,
      error: "شماره شبا باید دقیقاً شامل ۲۴ رقم عددی باشد.",
    };
  }
  return {
    isValid: true,
    formatted: clean,
  };
}
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  width: string;
  hasMinLength: boolean;
  hasUpperLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}
function getPasswordStrength(pwd: string): PasswordStrength {
  const hasMinLength = pwd.length >= 8;
  const hasUpperLower = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
  let score = 0;
  if (pwd) {
    if (hasMinLength) score++;
    if (hasUpperLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
  }
  let label = "خیلی ضعیف";
  let color = "bg-danger";
  let width = "w-[15%]";
  if (score === 1) {
    label = "ضعیف";
    color = "bg-danger";
    width = "w-[30%]";
  } else if (score === 2) {
    label = "متوسط";
    color = "bg-warning";
    width = "w-[55%]";
  } else if (score === 3) {
    label = "خوب";
    color = "bg-success";
    width = "w-[75%]";
  } else if (score === 4) {
    label = "عالی";
    color = "bg-success";
    width = "w-[100%]";
  } else if (!pwd) {
    label = "بدون رمز";
    color = "bg-surface";
    width = "w-0";
  }
  return {
    score,
    label,
    color,
    width,
    hasMinLength,
    hasUpperLower,
    hasNumber,
    hasSpecial,
  };
}
interface SearchableSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}
function SearchableSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="relative" ref={containerRef}>
      {" "}
      <label className="block text-xs font-black text-secondary mb-1.5">
        {label}
      </label>{" "}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-background/50 border rounded-xl text-sm text-right flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary-default disabled:opacity-50 text-primary placeholder:text-muted dark:placeholder:text-muted font-medium cursor-pointer"
      >
        {" "}
        <span className={value ? "text-primary font-medium" : "text-muted"}>
          {" "}
          {value || placeholder}{" "}
        </span>{" "}
        <svg
          className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {" "}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />{" "}
        </svg>{" "}
      </button>{" "}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-card border rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
          {" "}
          <div className="p-2 border-b border-subtle bg-background">
            {" "}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو کنید..."
              className="w-full px-3 py-1.5 text-xs bg-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-default text-right text-primary"
              autoFocus
            />{" "}
          </div>{" "}
          <div className="overflow-y-auto flex-1 bg-card">
            {" "}
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-muted text-center">
                موردی یافت نشد
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-right px-4 py-2 text-xs transition-colors hover:bg-primary-default/10 cursor-pointer ${value === opt ? "bg-primary-default/10/75 font-bold text-primary-default" : "text-secondary"}`}
                >
                  {" "}
                  {opt}{" "}
                </button>
              ))
            )}{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
function MyPanel({ currentUser, setCurrentUser }: { currentUser: any; setCurrentUser: (u: any) => void }) {
  // Navigation states
  //'login' |'role_select' |'supplier_form' |'store_manager_form' |'dashboard'
  const [view, setView] = useState<
    | "login"
    | "role_select"
    | "supplier_form"
    | "store_manager_form"
    | "customer_form"
    | "referrer_form"
    | "forgot_password"
    | "dashboard"
    | "explore"
  >("explore");
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token") || "";
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginPublicAnnouncementsOpen, setLoginPublicAnnouncementsOpen] = useState(false);



  // Captcha state
  const [captchaVal, setCaptchaVal] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  
  // Forgot Password state & Tabs
  const [forgotTab, setForgotTab] = useState<"sms_login" | "sms_reset" | "national_code">("sms_login");
  const [forgotOtpMobile, setForgotOtpMobile] = useState("");
  const [forgotOtpCode, setForgotOtpCode] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(0);
  const [forgotSimulatedCode, setForgotSimulatedCode] = useState<string | null>(null);
  const [forgotIdentity, setForgotIdentity] = useState("");
  const [forgotNationalCode, setForgotNationalCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotShowPassword, setForgotShowPassword] = useState(false);

  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaVal(code);
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, [view]);

  // Login Mode & SMS OTP state (Defaults to OTP for fastest, smoothest experience)
  const [loginMode, setLoginMode] = useState<"otp" | "password">("otp");
  const [loginOtpMobile, setLoginOtpMobile] = useState("");
  const [loginOtpCode, setLoginOtpCode] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpTimer, setLoginOtpTimer] = useState(0);
  const [loginSimulatedCode, setLoginSimulatedCode] = useState<string | null>(null);

  // Countdown timers for OTP
  useEffect(() => {
    let interval: any = null;
    if (loginOtpTimer > 0) {
      interval = setInterval(() => {
        setLoginOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loginOtpTimer]);

  useEffect(() => {
    let interval: any = null;
    if (forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotOtpTimer]);

  const [registerError, setRegisterError] = useState<string | null>(null);
  const [refForm, setRefForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
  });
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  // System config state for Custom Code Injector
  const [sysConfigState, setSysConfigState] = useState<Record<string, any>>(() => {
    try {
      const cached = localStorage.getItem("system_config");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showIosPwaModal, setShowIosPwaModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallPwa = async () => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      setShowIosPwaModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsAppInstalled(true);
        showNotification("وب‌اپلیکیشن با موفقیت روی دستگاه شما نصب شد.", "success");
      }
      setDeferredPrompt(null);
    } else {
      setShowIosPwaModal(true);
    }
  };

  // Auto-login if token exists
  useEffect(() => {
    if (token) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.role) {
            setCurrentUser(parsed);
            setView("dashboard");
          } else {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setToken(null);
            setCurrentUser(null);
            setView("explore");
          }
        } else {
          localStorage.removeItem("token");
          setToken(null);
          setCurrentUser(null);
          setView("explore");
        }
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setToken(null);
        setCurrentUser(null);
        setView("explore");
      }
    } else {
      setView("explore");
    }
  }, [token]);

  const handleExitImpersonation = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const res = await fetch("/api/admin/impersonate-exit", {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
        setView("dashboard");
        showNotification("با موفقیت به حساب مدیر ارشد بازگشتید.", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(err.error || "خطا در خروج از شبیه‌سازی", "error");
      }
    } catch {
      showNotification("خطا در خروج از شبیه‌سازی", "error");
    }
  };

  // Fetch and cache system configuration rules
  useEffect(() => {
    fetch("/api/config")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) {
          localStorage.setItem("system_config", JSON.stringify(data));
          setSysConfigState(data);
        }
      })
      .catch((err) => console.error("Error caching system config:", err));
  }, []);
  // Check for payment callback redirect parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const trackId = params.get("trackId");
    const invoiceId = params.get("invoiceId");
    const reason = params.get("reason");
    const refParam = params.get("ref");
    if (refParam) {
      sessionStorage.setItem("referralCode", refParam);
      setSupplierData((prev: any) => ({ ...prev, referralCode: refParam }));
      showNotification(`کد معرف ${refParam} شناسایی و ذخیره شد.`, "success");
    }
    if (paymentStatus) {
      if (paymentStatus === "success") {
        showNotification(
          `تسویه حساب فاکتور رسمی شماره INV-${invoiceId} با کد رهگیری ${trackId} با موفقیت انجام شد و مبالغ تامین‌کنندگان شارژ گردید.`,
          "success",
        );
      } else if (paymentStatus === "failed") {
        const errorMsg =
          reason === "verification_failed"
            ? "تایید صحت تراکنش درگاه با خطا مواجه شد."
            : "عملیات پرداخت لغو شد یا ناموفق بود.";
        showNotification(
          `پرداخت فاکتور شماره INV-${invoiceId} ناموفق بود. ${errorMsg}`,
          "error",
        );
      }
      // Clean up URL query parameters so they don't keep showing on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({
      message,
      type,
    });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginShake, setLoginShake] = useState(false);
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [loginUsernameFocused, setLoginUsernameFocused] = useState(false);
  const [loginPasswordFocused, setLoginPasswordFocused] = useState(false);
  const [activeBanner, setActiveBanner] = useState<any>(null);
  useEffect(() => {
    if (view === "login") {
      fetch("/api/banners")
        .then((res) => {
          if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            const active = data.find((b: any) => b.isActive);
            if (active) setActiveBanner(active);
          }
        })
        .catch(() => {});
    }
  }, [view]);
  useEffect(() => {
    if (view === "login") {
      fetch("/api/public-messages")
        .then((res) => {
          if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
          return res.json();
        })
        .then((data) => setPublicMessages(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Error fetching public messages:", err));
    }
  }, [view]);

  // Supplier form state (2 steps)
  const [supplierStep, setSupplierStep] = useState(() => {
    const saved = sessionStorage.getItem("supplierStep");
    const parsed = saved ? parseInt(saved, 10) : 1;
    return parsed > 2 || isNaN(parsed) ? 1 : parsed;
  });
  const [supplierErrors, setSupplierErrors] = useState<Record<string, string>>(
    {},
  );
  const [supplierData, setSupplierData] = useState(() => {
    const saved = sessionStorage.getItem("supplierData");
    if (saved) return JSON.parse(saved);
    return {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      brandName: "",
      activityType: "PRODUCER",
      address: "",
      province: "",
      city: "",
      postalCode: "",
      telephone: "",
      website: "",
      nationalCode: "",
      accountHolderName: "",
      shaba: "IR",
      bankName: "",
      termsAccepted: false,
      agreementVersion: "",
      agreementAcceptedAt: "",
      username: "",
      password: "",
      confirmPassword: "",
      referralCode: sessionStorage.getItem("referralCode") || "",
    };
  });
  useEffect(() => {
    sessionStorage.setItem("supplierData", JSON.stringify(supplierData));
  }, [supplierData]);
  useEffect(() => {
    sessionStorage.setItem("supplierStep", supplierStep.toString());
  }, [supplierStep]);

  // Store Manager form state (4 steps)
  const [storeStep, setStoreStep] = useState(() => {
    const saved = sessionStorage.getItem("storeStep");
    return saved ? parseInt(saved) : 1;
  });
  
  // Customer form state
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});
  const [customerData, setCustomerData] = useState(() => {
    const saved = sessionStorage.getItem("customerData");
    if (saved) return JSON.parse(saved);
    return {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    };
  });
  useEffect(() => {
    sessionStorage.setItem("customerData", JSON.stringify(customerData));
  }, [customerData]);

  const [storeErrors, setStoreErrors] = useState<Record<string, string>>({});
  const [storeData, setStoreData] = useState(() => {
    const saved = sessionStorage.getItem("storeData");
    if (saved) return JSON.parse(saved);
    return {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      nationalCode: "",
      storeName: "",
      storeUrl: "",
      storeLink: "",
      avatarUrl: "",
      platformType: "WOOCOMMERCE",
      fieldOfActivity: "",
      productCount: "",
      storeAddress: "",
      username: "",
      password: "",
      confirmPassword: "",
    };
  });
  useEffect(() => {
    sessionStorage.setItem("storeData", JSON.stringify(storeData));
  }, [storeData]);
  useEffect(() => {
    sessionStorage.setItem("storeStep", storeStep.toString());
  }, [storeStep]);
  const [showTermsModal, setShowTermsModal] = useState<string | null>(null);
  const [supplierTermsText, setSupplierTermsText] = useState("");
  const [storeTermsText, setStoreTermsText] = useState("");
  useEffect(() => {
    fetch("/api/config")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data && (data.SUPPLIER_RULES || data.TERMS_AND_CONDITIONS)) {
          setSupplierTermsText(data.SUPPLIER_RULES || data.TERMS_AND_CONDITIONS);
        }
        if (data && data.STORE_RULES) {
          setStoreTermsText(data.STORE_RULES);
        }
      })
      .catch(() => {});
  }, []);

  const [termsReadProgress, setTermsReadProgress] = useState(false);

  // Draft save functions
  const saveSupplierDraft = () => {
    localStorage.setItem("supplierDataDraft", JSON.stringify(supplierData));
    localStorage.setItem("supplierStepDraft", supplierStep.toString());
    showNotification(
      "پیش‌نویس ثبت‌نام تامین‌کننده با موفقیت در مرورگر ذخیره شد. هر زمان بازگردید، می‌توانید آن را بازیابی کنید.",
      "success",
    );
  };
  const saveStoreDraft = () => {
    localStorage.setItem("storeDataDraft", JSON.stringify(storeData));
    localStorage.setItem("storeStepDraft", storeStep.toString());
    showNotification(
      "پیش‌نویس ثبت‌نام مدیر فروشگاه با موفقیت در مرورگر ذخیره شد. هر زمان بازگردید، می‌توانید آن را بازیابی کنید.",
      "success",
    );
  };
  const handleSupplierStepChange = (targetStep: number) => {
    let errors: Record<string, string> = {};
    if (supplierStep === 1) {
      if (!supplierData.firstName) errors.firstName = "نام الزامی است";
      if (!supplierData.lastName) errors.lastName = "نام خانوادگی الزامی است";
      if (!supplierData.mobile || !/^09\d{9}$/.test(supplierData.mobile))
        errors.mobile = "شماره موبایل نامعتبر است. فرمت: 09123456789";
      if (!supplierData.nationalCode || supplierData.nationalCode.length !== 10)
        errors.nationalCode = "کد ملی باید ۱۰ رقم باشد";
    } else if (supplierStep === 2) {
      if (!supplierData.brandName) errors.brandName = "نام تجاری الزامی است";
      if (!supplierData.province) errors.province = "استان الزامی است";
      if (!supplierData.city) errors.city = "شهر الزامی است";
      if (!supplierData.address) errors.address = "آدرس الزامی است";
      if (!supplierData.accountHolderName)
        errors.accountHolderName = "نام صاحب حساب الزامی است";
      if (!supplierData.bankName) errors.bankName = "نام بانک الزامی است";
      if (!supplierData.shaba) errors.shaba = "شماره شبا الزامی است";
    } else if (supplierStep === 3) {
      if (!supplierData.username) errors.username = "نام کاربری الزامی است";
      if (!supplierData.password) {
        errors.password = "کلمه عبور الزامی است";
      } else {
        const strength = getPasswordStrength(supplierData.password);
        if (strength.score < 2) {
          errors.password =
            "رمز عبور بسیار ضعیف است. لطفاً رمزی با امنیت متوسط یا بالاتر انتخاب کنید.";
        }
      }
      if (supplierData.password !== supplierData.confirmPassword) {
        errors.confirmPassword = "تکرار کلمه عبور با کلمه عبور مطابقت ندارد";
      }
    }
    if (Object.keys(errors).length > 0) {
      setSupplierErrors(errors);
      return;
    }
    setSupplierErrors({});
    if (targetStep <= 3) {
      setSupplierStep(targetStep);
    }
  };
  const handleStoreStepChange = (targetStep: number) => {
    let errors: Record<string, string> = {};
    if (storeStep === 1) {
      if (!storeData.firstName) errors.firstName = "نام الزامی است";
      if (!storeData.lastName) errors.lastName = "نام خانوادگی الزامی است";
      if (!storeData.mobile || !/^09\d{9}$/.test(storeData.mobile))
        errors.mobile = "شماره موبایل نامعتبر است. فرمت: 09123456789";
      if (!storeData.nationalCode || !/^\d{10}$/.test(storeData.nationalCode))
        errors.nationalCode = "کد ملی الزامی است و باید دقیقاً ۱۰ رقم باشد";
    } else if (storeStep === 2) {
      if (!storeData.storeName) errors.storeName = "نام فروشگاه الزامی است";
    } else if (storeStep === 3) {
      if (!storeData.username) errors.username = "نام کاربری الزامی است";
      if (!storeData.password) {
        errors.password = "کلمه عبور الزامی است";
      } else {
        const strength = getPasswordStrength(storeData.password);
        if (strength.score < 2) {
          errors.password =
            "رمز عبور بسیار ضعیف است. لطفاً رمزی با امنیت متوسط یا بالاتر انتخاب کنید.";
        }
      }
      if (storeData.password !== storeData.confirmPassword) {
        errors.confirmPassword = "تکرار کلمه عبور با کلمه عبور مطابقت ندارد";
      }
    }
    if (Object.keys(errors).length > 0) {
      setStoreErrors(errors);
      return;
    }
    setStoreErrors({});
    if (targetStep <= 3) {
      setStoreStep(targetStep);
    }
  };
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput !== captchaVal) {
      showNotification("کد امنیتی (کپچا) وارد شده نادرست است.", "error");
      generateCaptcha();
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      showNotification("تکرار رمز عبور جدید مطابقت ندارد.", "error");
      return;
    }
    const strength = getPasswordStrength(forgotNewPassword);
    if (strength.score < 2) {
      showNotification("رمز عبور جدید بسیار ضعیف است. لطفاً رمزی با امنیت متوسط یا بالاتر انتخاب کنید.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: forgotIdentity,
          nationalCode: forgotNationalCode,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await parseJsonResponse(response, "خطا در تغییر رمز عبور");
      if (!response.ok) {
        throw new Error(data.error || "خطا در تغییر رمز عبور");
      }
      showNotification("رمز عبور شما با موفقیت تغییر کرد. اکنون با رمز جدید وارد شوید.", "success");
      setForgotIdentity("");
      setForgotNationalCode("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setView("login");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for Quick Login
  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginOtpMobile || loginOtpMobile.trim().length < 8) {
      showNotification("لطفاً شماره همراه یا نام کاربری حساب خود را وارد نمایید.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: loginOtpMobile.trim() }),
      });
      const data = await parseJsonResponse(res, "خطا در ارسال کد پیامکی");
      if (!res.ok) {
        throw new Error(data.error || "خطا در ارسال کد تایید");
      }
      setLoginOtpSent(true);
      setLoginOtpTimer(120);
      if (data.simulated && data.code) {
        setLoginSimulatedCode(data.code);
        showNotification(`کد تایید پیامکی: ${data.code}`, "success");
      } else {
        showNotification("کد تایید ۵ رقمی پیامک شد. لطفاً آن را وارد نمایید.", "success");
      }
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Log In
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtpCode || loginOtpCode.trim().length < 4) {
      showNotification("لطفاً کد تایید ۵ رقمی را به طور کامل وارد نمایید.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: loginOtpMobile.trim(), code: loginOtpCode.trim() }),
      });
      const data = await parseJsonResponse(res, "خطا در تایید کد و ورود");
      if (!res.ok) {
        setLoginShake(true);
        setTimeout(() => setLoginShake(false), 500);
        throw new Error(data.error || "کد تایید نامعتبر است یا منقضی شده");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showNotification("ورود سریع با پیامک با موفقیت انجام شد.", "success");

      const userRole = data.user?.role;
      if (userRole !== "SUPERADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        const userId = data.user?.id || data.user?.username || "default";
        if (!localStorage.getItem(`terms_accepted_${userId}`)) {
          setShowTermsModal(userRole || "GENERAL");
        }
      }
      setView("dashboard");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for Forgot Password
  const handleSendForgotOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotOtpMobile || forgotOtpMobile.trim().length < 8) {
      showNotification("لطفاً شماره همراه یا نام کاربری حساب خود را وارد نمایید.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: forgotOtpMobile.trim() }),
      });
      const data = await parseJsonResponse(res, "خطا در ارسال پیامک");
      if (!res.ok) {
        throw new Error(data.error || "خطا در ارسال کد پیامکی");
      }
      setForgotOtpSent(true);
      setForgotOtpTimer(120);
      if (data.simulated && data.code) {
        setForgotSimulatedCode(data.code);
        showNotification(`کد تایید پیامکی: ${data.code}`, "success");
      } else {
        showNotification("کد تایید پیامکی ارسال شد.", "success");
      }
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Direct SMS Login (Option 1)
  const handleForgotOtpDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtpCode || forgotOtpCode.trim().length < 4) {
      showNotification("لطفاً کد ۵ رقمی دریافتی از پیامک را وارد کنید.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: forgotOtpMobile.trim(), code: forgotOtpCode.trim() }),
      });
      const data = await parseJsonResponse(res, "خطا در ورود با پیامک");
      if (!res.ok) {
        throw new Error(data.error || "کد تایید پیامکی نامعتبر است");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showNotification("ورود مستقیم به حساب با پیامک با موفقیت انجام شد.", "success");

      const userRole = data.user?.role;
      if (userRole !== "SUPERADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        const userId = data.user?.id || data.user?.username || "default";
        if (!localStorage.getItem(`terms_accepted_${userId}`)) {
          setShowTermsModal(userRole || "GENERAL");
        }
      }
      setView("dashboard");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Reset Password via SMS (Option 2)
  const handleForgotOtpResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtpCode || forgotOtpCode.trim().length < 4) {
      showNotification("لطفاً کد تایید پیامک شده را وارد کنید.", "error");
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      showNotification("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.", "error");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      showNotification("تکرار رمز عبور با رمز وارد شده مطابقت ندارد.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: forgotOtpMobile.trim(),
          code: forgotOtpCode.trim(),
          newPassword: forgotNewPassword,
        }),
      });
      const data = await parseJsonResponse(res, "خطا در بازنشانی رمز");
      if (!res.ok) {
        throw new Error(data.error || "خطا در تغییر رمز عبور");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showNotification("رمز عبور جدید با موفقیت تنظیم شد و وارد حساب شدید.", "success");
      setView("dashboard");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "خطای ورود با گوگل.");
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showNotification("ورود با موفقیت انجام شد.", "success");
      setView("dashboard");
    } catch (err: any) {
      showNotification(err.message || "مشکل در ارتباط با سرور برای ورود گوگل.", "error");
    }
  };

  useEffect(() => {
    // Check for login popup announcements
    fetch("/api/announcements")
      .then(res => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const hasPopup = data.some(a => a.isLoginPopup && a.isActive);
          if (hasPopup) {
            setLoginPublicAnnouncementsOpen(true);
          }
        }
      })
      .catch(console.error);
  }, []);

  const parseJsonResponse = async (response: Response, fallbackErrorMsg: string) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text().catch(() => "");
      console.error("[Backend Non-JSON Response]", response.status, response.statusText, text.slice(0, 300));
      throw new Error(`سرویس بک‌اند در دسترس نیست (کد وضعیت: ${response.status}). لطفاً اتصال سرور و متغیر DATABASE_URL را بررسی فرمایید.`);
    }
    try {
      return await response.json();
    } catch {
      throw new Error("پاسخ سرور معتبر نیست (فرمت JSON دریافت نشد).");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await parseJsonResponse(response, "ورود ناموفق");
      if (!response.ok) {
        setLoginShake(true);
        setTimeout(() => setLoginShake(false), 500);
        throw new Error(data.error || "ورود ناموفق");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showNotification("ورود با موفقیت انجام شد.", "success");
      
      const userRole = data.user?.role;
      if (userRole !== "SUPERADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        const userId = data.user?.id || data.user?.username || "default";
        if (!localStorage.getItem(`terms_accepted_${userId}`)) {
          setShowTermsModal(userRole || "GENERAL");
        }
      }
      setView("dashboard");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const handleSupplierRegister = async () => {
    let errors: Record<string, string> = {};
    if (!supplierData.firstName) errors.firstName = "نام الزامی است";
    if (!supplierData.lastName) errors.lastName = "نام خانوادگی الزامی است";
    if (!supplierData.username) errors.username = "نام کاربری الزامی است";
    if (!supplierData.password) {
      errors.password = "کلمه عبور الزامی است";
    } else {
      const strength = getPasswordStrength(supplierData.password);
      if (strength.score < 2) {
        errors.password = "رمز عبور بسیار ضعیف است. لطفاً رمزی با امنیت متوسط یا بالاتر انتخاب کنید.";
      }
    }
    if (supplierData.password !== supplierData.confirmPassword) {
      errors.confirmPassword = "تکرار کلمه عبور با کلمه عبور مطابقت ندارد";
    }
    if (!supplierData.mobile) errors.mobile = "شماره موبایل الزامی است";
    if (!supplierData.nationalCode) errors.nationalCode = "کد ملی الزامی است";

    if (!supplierData.brandName) errors.brandName = "نام تجاری الزامی است";
    if (!supplierData.province) errors.province = "استان الزامی است";
    if (!supplierData.city) errors.city = "شهر الزامی است";
    if (!supplierData.address) errors.address = "آدرس الزامی است";
    if (!supplierData.accountHolderName) errors.accountHolderName = "نام صاحب حساب الزامی است";
    if (!supplierData.bankName) errors.bankName = "نام بانک الزامی است";
    if (!supplierData.shaba) errors.shaba = "شماره شبا الزامی است";

    if (Object.keys(errors).length > 0) {
      setSupplierErrors(errors);
      if (errors.firstName || errors.lastName || errors.mobile || errors.nationalCode) {
        setSupplierStep(1);
      } else if (errors.brandName || errors.province || errors.city || errors.address || errors.accountHolderName || errors.bankName || errors.shaba) {
        setSupplierStep(2);
      } else if (errors.username || errors.password || errors.confirmPassword) {
        setSupplierStep(3);
      }
      return;
    }
    setSupplierErrors({});
    setLoading(true);
    setRegisterError(null);
    try {
      const payload = {
        ...supplierData,
        termsAccepted: true,
        agreementAccepted: true,
        agreementVersion: "1.0",
        agreementAcceptedAt: new Date().toISOString(),
      };
      const response = await fetch("/api/auth/register/supplier", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(response, "خطا در ثبت‌نام تامین‌کننده");
      if (!response.ok)
        throw new Error(data.error || "خطا در ثبت‌نام تامین‌کننده");

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);

      // Clear all registration drafts
      sessionStorage.removeItem("supplierData");
      sessionStorage.removeItem("supplierStep");
      localStorage.removeItem("supplierDataDraft");
      localStorage.removeItem("supplierStepDraft");
      showNotification(
        "ثبت‌نام شما به عنوان تامین‌کننده با موفقیت انجام شد.",
        "success",
      );
      setShowTermsModal(data.user?.role || "SUPPLIER");
      window.history.pushState({}, "", "/supplier/dashboard");
      setView("dashboard");
    } catch (err: any) {
      setRegisterError(err.message);
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCustomerRegister = async () => {
    let errors: Record<string, string> = {};
    if (!customerData.firstName) errors.firstName = "نام الزامی است";
    if (!customerData.lastName) errors.lastName = "نام خانوادگی الزامی است";
    if (!customerData.mobile) errors.mobile = "موبایل الزامی است";
    if (!customerData.username) errors.username = "نام کاربری الزامی است";
    if (!customerData.password) {
      errors.password = "کلمه عبور الزامی است";
    }
    if (customerData.password !== customerData.confirmPassword) {
      errors.confirmPassword = "تکرار کلمه عبور با کلمه عبور مطابقت ندارد";
    }

    if (Object.keys(errors).length > 0) {
      setCustomerErrors(errors);
      return;
    }
    setCustomerErrors({});
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: customerData.username,
          password: customerData.password,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          mobile: customerData.mobile,
          email: customerData.email,
        }),
      });

      const data = await parseJsonResponse(response, "ثبت نام ناموفق بود");
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("explore_token", data.token);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userId", data.user.id.toString());
        
        sessionStorage.removeItem("customerData");
        
        // Show success alert
        showNotification("ثبت‌نام مشتری با موفقیت انجام شد.", "success");
        setToken(data.token);
        setCurrentUser(data.user);
        setView("dashboard");
      } else {
        alert(data.error || "ثبت نام ناموفق بود");
      }
    } catch (err) {
      console.error(err);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreManagerRegister = async () => {
    let errors: Record<string, string> = {};
    if (!storeData.firstName) errors.firstName = "نام الزامی است";
    if (!storeData.lastName) errors.lastName = "نام خانوادگی الزامی است";
    if (!storeData.nationalCode || !/^\d{10}$/.test(storeData.nationalCode)) {
      errors.nationalCode = "کد ملی معتبر ۱۰ رقمی الزامی است";
    }
    if (!storeData.mobile || !/^09\d{9}$/.test(storeData.mobile)) {
      errors.mobile = "شماره موبایل معتبر (۱۱ رقم با 09) الزامی است";
    }
    if (!storeData.storeName) errors.storeName = "نام فروشگاه / مجموعه الزامی است";
    if (!storeData.username) errors.username = "نام کاربری الزامی است";
    if (!storeData.password) {
      errors.password = "کلمه عبور الزامی است";
    } else {
      const strength = getPasswordStrength(storeData.password);
      if (strength.score < 2) {
        errors.password = "رمز عبور بسیار ضعیف است. لطفاً رمزی با امنیت متوسط یا بالاتر انتخاب کنید.";
      }
    }
    if (storeData.password !== storeData.confirmPassword) {
      errors.confirmPassword = "تکرار کلمه عبور با کلمه عبور مطابقت ندارد";
    }

    if (Object.keys(errors).length > 0) {
      setStoreErrors(errors);
      if (errors.firstName || errors.lastName || errors.mobile || errors.nationalCode) {
        setStoreStep(1);
      } else if (errors.storeName) {
        setStoreStep(2);
      } else if (errors.username || errors.password || errors.confirmPassword) {
        setStoreStep(3);
      }
      return;
    }
    setStoreErrors({});
    setLoading(true);
    try {
      const payload = {
        ...storeData,
        storeUrl: storeData.storeUrl || storeData.storeLink,
      };
      const response = await fetch("/api/auth/register/store-manager", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse(response, "خطا در ثبت‌نام مدیر فروشگاه");
      if (!response.ok)
        throw new Error(data.error || "خطا در ثبت‌نام مدیر فروشگاه");

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);

      // Clear all registration drafts
      sessionStorage.removeItem("storeData");
      sessionStorage.removeItem("storeStep");
      localStorage.removeItem("storeDataDraft");
      localStorage.removeItem("storeStepDraft");
      showNotification(
        "ثبت‌نام شما به عنوان مدیر فروشگاه با موفقیت انجام شد.",
        "success",
      );
      setShowTermsModal(data.user?.role || "STORE_MANAGER");
      setView("dashboard");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const handleReferrerRegister = async () => {
    if (
      !refForm.username ||
      !refForm.password ||
      !refForm.firstName ||
      !refForm.lastName ||
      !refForm.mobile
    ) {
      showNotification("لطفاً تمامی فیلدهای اجباری را تکمیل نمایید.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register-referrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "خطا در ثبت‌نام معرف");

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);

      showNotification(
        "ثبت‌نام شما به عنوان معرف با موفقیت انجام شد.",
        "success",
      );
      setView("dashboard");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    setView("explore");
    showNotification("با موفقیت خارج شدید.", "success");
  };
  const getCitiesForProvince = (provName: string) => {
    return PROVINCES.find((p) => p.name === provName)?.cities || [];
  };
  const renderDashboard = () => {
    if (currentUser?.role === "SUPPLIER") {
      return (
        <SupplierDashboard
          user={currentUser}
          onLogout={logout}
          showNotification={showNotification}
          onUpdateUser={(updatedUser: any) => {
            setCurrentUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }}
        />
      );
    } else if (currentUser?.role === "STORE_MANAGER") {
      return (
        <StoreManagerDashboard
          user={currentUser}
          onLogout={logout}
          showNotification={showNotification}
          onUpdateUser={(updatedUser: any) => {
            setCurrentUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }}
        />
      );
    } else if (currentUser?.role === "SUPER_ADMIN") {
      return (
        <SuperAdminDashboard
          user={currentUser}
          onLogout={logout}
          showNotification={showNotification}
          onImpersonateUser={(impersonatedUser, newToken) => {
            if (newToken) {
              setToken(newToken);
              localStorage.setItem("token", newToken);
            }
            setCurrentUser(impersonatedUser);
            localStorage.setItem("user", JSON.stringify(impersonatedUser));
            setView("dashboard");
          }}
        />
      );
    } else if (currentUser?.role === "REFERRER") {
      return (
        <ReferrerDashboard
          currentUser={currentUser}
          onLogout={logout}
          showNotification={showNotification}
        />
      );
    } else if (currentUser?.role === "CUSTOMER") {
      return (
        <CustomerDashboard
          user={currentUser}
          onLogout={logout}
          showNotification={showNotification}
          onUpdateUser={(updatedUser: any) => {
            setCurrentUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }}
        />
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary p-4" dir="rtl">
        <div className="text-center p-8 bg-card border border-subtle rounded-3xl shadow-xl max-w-md w-full space-y-4">
          <p className="text-sm font-bold text-text-primary">نشست شما نامعتبر است یا هنوز نقشی به حساب شما تخصیص داده نشده است.</p>
          <button onClick={logout} className="w-full py-3 bg-primary-default text-white rounded-xl font-bold text-xs cursor-pointer shadow-md">
            خروج و ورود مجدد
          </button>
        </div>
      </div>
    );
  };
  return (
    <>
      <CustomCodeInjector sysConfig={sysConfigState} />
      <div className="print:hidden min-h-screen bg-background font-sans text-primary selection:bg-primary-default/20 selection:text-primary-hover overflow-x-hidden flex flex-col transition-colors duration-300 relative">
        {" "}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {" "}
          {/* Advanced sophisticated floating gradients */}
          <div className="absolute top-[-20%] left-[-20%] w-[75%] h-[75%] bg-gradient-to-tr from-indigo-600/25 via-purple-500/15 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 rounded-full blur-[140px] animate-float"></div>{" "}
          <div className="absolute bottom-[-20%] right-[-20%] w-[75%] h-[75%] bg-gradient-to-bl from-emerald-500/20 via-teal-500/15 to-transparent dark:from-emerald-950/30 dark:via-teal-950/20 rounded-full blur-[140px] animate-float-delayed"></div>{" "}
          <div
            className="absolute top-[20%] right-[10%] w-[45%] h-[45%] bg-danger/15 rounded-full blur-[120px] animate-float"
            style={{
              animationDelay: "3s",
            }}
          ></div>{" "}
          <div
            className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-amber-300/15 rounded-full blur-[110px] animate-float-delayed"
            style={{
              animationDelay: "6s",
            }}
          ></div>{" "}
        </div>{" "}
        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-short">
            {" "}
            <div
              className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-sm backdrop-blur-md border ${notification.type === "success" ? "bg-success/90 text-inverse border-success" : "bg-danger/90 text-inverse border-danger"}`}
            >
              {" "}
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {notification.message}
            </div>{" "}
          </div>
        )}
        {currentUser?.isImpersonated && (
          <div className="bg-slate-900 text-white px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium shadow-xl z-[9999] relative text-center sm:text-right border-b border-white/10" dir="rtl">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="leading-snug opacity-90">شما هم‌اکنون به عنوان کاربر <strong className="text-emerald-400 font-bold">{currentUser.firstName || ''} {currentUser.lastName || ''} ({currentUser.username})</strong> وارد شده‌اید (حالت شبیه‌سازی).</span>
            </div>
            <button
              onClick={handleExitImpersonation}
              className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-md hover:bg-white hover:text-slate-900 transition-all cursor-pointer font-bold shadow-sm shrink-0 w-full sm:w-auto flex items-center justify-center"
            >
              خروج و بازگشت به حساب مدیریت
            </button>
          </div>
        )}
        
      {(!currentUser && (view === "explore" || view === "login")) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-[340px]">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-1.5 rounded-full flex items-center shadow-2xl border border-white/30 dark:border-white/10 ring-1 ring-black/10">
            <div className="relative flex w-full gap-1">
              <button
                onClick={() => setView("explore")}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer z-10 flex items-center justify-center gap-1.5 ${view === "explore" ? "text-white shadow-md bg-gradient-to-r from-primary-default to-indigo-600 scale-100" : "text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 scale-95 hover:scale-100"}`}
              >
                <Compass className={`w-4 h-4 ${view === "explore" ? "animate-pulse" : ""}`} />
                <span>اکسپلور کالا</span>
              </button>
              <button
                onClick={() => setView("login")}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer z-10 flex items-center justify-center gap-1.5 ${view === "login" ? "text-white shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 scale-100" : "text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 scale-95 hover:scale-100"}`}
              >
                <User className="w-4 h-4" />
                <span>ورود / ثبت‌نام</span>
              </button>
            </div>
          </div>
        </div>
      )}

        {view === "dashboard" && (
          <>
            {renderDashboard()}
            
          </>
        )}
        {view === "explore" && (
          <Explore
            onBack={() => {
              const token = localStorage.getItem("token");
              if (token && currentUser) {
                setView("dashboard");
              } else {
                setView("explore");
              }
            }}
          />
        )}
        {view !== "dashboard" && view !== "explore" && (
          <main className="flex-1 flex flex-col relative z-10 p-4 md:p-8 lg:p-12 items-center justify-center bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:24px_24px]">
            {" "}
            <div
              className={`w-full perspective-1000 ${view === "login" ? "max-w-5xl" : "max-w-[540px]"}`}
            >
              {" "}
              {/* Login View */}
              {view === "login" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" dir="rtl">
                  {/* B2B Hero Showcase Card */}
                  <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-[2.5rem] p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-black text-indigo-200">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        پلتفرم هوشمند B2B و زنجیره تامین
                      </div>
                      <h1 className="text-2xl font-black leading-snug text-white">
                        اتصال مستقیم فروشگاه‌ها به شبکه تامین‌کنندگان زوپیت
                      </h1>
                      <p className="text-xs text-indigo-200/90 leading-relaxed">
                        مدیریت هوشمند سفارشات عمده، تسویه خودکار کیف پول تامین‌کنندگان، صادر نمودن لیبل پستی و ارسال مستقیم به سراسر کشور.
                      </p>
                    </div>

                    <div className="relative z-10 my-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                      <img
                        src={heroImage}
                        alt="Zopit B2B E-commerce Platform"
                        referrerPolicy="no-referrer"
                        className="w-full h-52 object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                        <div className="flex items-center justify-between w-full text-[11px] font-extrabold text-white">
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-emerald-400" /> ارسال مستقیم مرسوله
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-400" /> تسویه مالی لحظه‌ای
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200 font-bold">
                      <span>شبکه قدرتمند تجارت B2B</span>
                      <span className="font-mono text-emerald-400 font-extrabold">🚀 بیش از ۱,۰۰۰ غرفه فعال</span>
                    </div>
                  </div>

                  {/* Login Form Box */}
                  <div className="col-span-12 lg:col-span-7 bg-white dark:bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border border-border-default/50 dark:border-border-subtle/50">
                    <div className="w-full p-8 md:p-12 flex flex-col justify-center relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-default/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                      <div className="flex items-center justify-between mb-8">
                        <ZopitLogo size="lg" />
                        <button
                          type="button"
                          onClick={() => setLoginPublicAnnouncementsOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-xl text-xs font-black transition-all cursor-pointer"
                          title="مشاهده اطلاعیه‌های همگانی"
                        >
                          <Megaphone className="w-4 h-4 text-indigo-600" />
                          <span>اطلاعیه‌های عمومی</span>
                        </button>
                      </div>

                    <div className="mb-6 text-right">
                      <h2 className="text-xl font-black text-text-primary mb-2">
                        ورود به حساب کاربری
                      </h2>
                      <p className="text-sm text-text-muted font-medium">
                        جهت ورود به سیستم اطلاعات خود را وارد کنید
                      </p>
                    </div>

                    {/* Mode Switch Tabs: Password vs SMS OTP */}
                    <div className="flex rounded-2xl bg-surface/80 p-1.5 border border-border-default/60 mb-6 gap-1">
                      <button
                        type="button"
                        onClick={() => setLoginMode("otp")}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          loginMode === "otp"
                            ? "bg-primary-default text-white shadow-md shadow-primary-default/25"
                            : "text-text-muted hover:text-text-primary hover:bg-background/50"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>ورود با پیامک (کد یکبار مصرف)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMode("password")}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          loginMode === "password"
                            ? "bg-primary-default text-white shadow-md shadow-primary-default/25"
                            : "text-text-muted hover:text-text-primary hover:bg-background/50"
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        <span>ورود با رمز عبور</span>
                      </button>
                    </div>

                    {/* SMS OTP Login Mode (Fast & Standard) */}
                    {loginMode === "otp" && (
                      <div className="space-y-4">
                        {!loginOtpSent ? (
                          /* Step 1: Enter Mobile Number */
                          <form onSubmit={handleSendLoginOtp} className="space-y-5">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-text-secondary">
                                شماره همراه یا نام کاربری
                              </label>
                              <div className="relative group">
                                <input
                                  type="text"
                                  required
                                  dir="ltr"
                                  autoFocus
                                  value={loginOtpMobile}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
                                      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
                                    setLoginOtpMobile(val);
                                  }}
                                  className="w-full pl-4 pr-11 py-3.5 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50 text-left font-mono tracking-wider"
                                  placeholder="09123456789"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                                  <Smartphone className="w-5 h-5" />
                                </div>
                              </div>
                              <p className="text-[11px] text-text-muted leading-relaxed">
                                کد تایید یکبار مصرف ۵ رقمی از طریق پیامک برای این شماره ارسال خواهد شد.
                              </p>
                            </div>

                            <div>
                              <button
                                type="submit"
                                disabled={loading || !loginOtpMobile.trim()}
                                className="w-full bg-primary-default hover:bg-primary-hover text-white font-black py-4 rounded-xl shadow-lg shadow-primary-default/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
                              >
                                {loading ? (
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    <span>دریافت کد تایید پیامکی</span>
                                  </span>
                                )}
                              </button>
                            </div>

                            <div className="text-center pt-2">
                              <button
                                type="button"
                                onClick={() => setLoginMode("password")}
                                className="text-xs text-text-muted hover:text-primary-default font-bold transition-colors cursor-pointer"
                              >
                                ورود با رمز عبور ثابت
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* Step 2: Enter 5-digit OTP Code */
                          <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                            <div className="p-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-xs text-slate-800 dark:text-slate-100 font-bold">
                                  کد تایید به شماره <span className="font-mono dir-ltr inline-block font-black text-slate-950 dark:text-white">{loginOtpMobile}</span> پیامک شد.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setLoginOtpSent(false);
                                  setLoginOtpCode("");
                                  setLoginSimulatedCode(null);
                                }}
                                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-extrabold underline cursor-pointer"
                              >
                                ویرایش شماره
                              </button>
                            </div>

                            {loginSimulatedCode && (
                              <button
                                type="button"
                                onClick={() => setLoginOtpCode(loginSimulatedCode)}
                                className="w-full p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-colors text-right"
                              >
                                <span>کد تست شبیه‌سازی‌شده: <strong className="font-mono text-sm">{loginSimulatedCode}</strong></span>
                                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">کلیک جهت درج خودکار</span>
                              </button>
                            )}

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-text-secondary">
                                  کد تایید ۵ رقمی را وارد کنید
                                </label>
                                {loginOtpTimer > 0 ? (
                                  <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {Math.floor(loginOtpTimer / 60)}:{(loginOtpTimer % 60).toString().padStart(2, "0")}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSendLoginOtp()}
                                    disabled={loading}
                                    className="text-[11px] text-primary-default font-extrabold hover:underline cursor-pointer"
                                  >
                                    ارسال مجدد کد
                                  </button>
                                )}
                              </div>

                              <div className="relative group">
                                <input
                                  type="text"
                                  required
                                  maxLength={6}
                                  dir="ltr"
                                  autoFocus
                                  value={loginOtpCode}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
                                      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
                                      .replace(/\D/g, "");
                                    setLoginOtpCode(val);
                                  }}
                                  className="w-full pl-4 pr-11 py-3.5 bg-background hover:bg-surface/80 border rounded-xl text-xl tracking-[0.4em] text-center font-mono font-black focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary border-gray-300 dark:border-indigo-500/50"
                                  placeholder="• • • • •"
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                                  <KeyRound className="w-5 h-5" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <button
                                type="submit"
                                disabled={loading || loginOtpCode.length < 4}
                                className="w-full bg-primary-default hover:bg-primary-hover text-white font-black py-4 rounded-xl shadow-lg shadow-primary-default/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
                              >
                                {loading ? (
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>تایید و ورود به حساب</span>
                                  </span>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Password Login Mode */}
                    {loginMode === "password" && (
                      <form onSubmit={handleLoginSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            نام کاربری یا شماره همراه
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              dir="ltr"
                              value={loginUsername}
                              onChange={(e) => setLoginUsername(e.target.value)}
                              className="w-full pl-4 pr-11 py-3.5 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50 text-left"
                              placeholder="نام کاربری یا موبایل"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <User className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-text-secondary">
                              رمز عبور
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setForgotTab("sms_login");
                                setView("forgot_password");
                              }}
                              className="text-[10px] text-primary-default font-bold hover:underline cursor-pointer"
                            >
                              فراموشی رمز یا ورود با پیامک؟
                            </button>
                          </div>
                          <div className="relative group">
                            <input
                              type={showLoginPassword ? "text" : "password"}
                              required
                              dir="ltr"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full pl-12 pr-11 py-3.5 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50 text-left"
                              placeholder="رمز عبور"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <Lock className="w-5 h-5" />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setShowLoginPassword(!showLoginPassword)
                              }
                              className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted hover:text-primary-default transition-colors"
                            >
                              {showLoginPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-default hover:bg-primary-hover text-white font-black py-4 rounded-xl shadow-lg shadow-primary-default/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-75 cursor-pointer"
                          >
                            {loading ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <span>ورود به سیستم</span>
                            )}
                          </button>
                        </div>

                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => setLoginMode("otp")}
                            className="text-xs text-text-muted hover:text-primary-default font-bold transition-colors cursor-pointer"
                          >
                            ورود بدون رمز با کد تایید پیامکی (OTP)
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="mt-6 border-t border-border-default/50 dark:border-border-subtle/50 pt-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">حساب کاربری ندارید؟</span>
                        <button
                          type="button"
                          onClick={() => setView("role_select")}
                          className="text-primary-default font-extrabold hover:underline cursor-pointer"
                        >
                          ثبت‌نام سریع
                        </button>
                      </div>

                      {/* Download PWA App Button */}
                      <button
                        type="button"
                        onClick={handleInstallPwa}
                        className="w-full py-3 px-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white rounded-2xl text-xs font-black shadow-lg border border-indigo-500/30 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-right">
                            <span className="block font-black text-xs text-white">دانلود و نصب وب‌اپلیکیشن زوپیت</span>
                            <span className="block text-[10px] text-indigo-200 font-medium">نسخه PWA سریع و بدون نیاز به دانلود از بازار</span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}
              {/* Forgot Password View */}
              {view === "forgot_password" && (
                <div
                  className="w-full bg-white dark:bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border border-border-default/50 dark:border-border-subtle/50 animate-fade-in"
                  dir="rtl"
                >
                  {/* Forgot Password Form */}
                  <div className="w-full p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-default/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

                    <div className="flex items-center gap-3 mb-6">
                      <ZopitLogo size="lg" />
                      <div>
                        <p className="text-xs font-bold text-primary-default mt-1">
                          بازیابی رمز و ورود اضطراری به حساب
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 text-right">
                      <h2 className="text-xl font-black text-text-primary mb-1.5">
                        فراموشی رمز عبور یا ورود با پیامک
                      </h2>
                      <p className="text-xs text-text-muted font-medium">
                        در صورت فراموشی رمز عبور، می‌توانید مستقیماً با پیامک وارد شوید یا رمز جدید تعیین کنید.
                      </p>
                    </div>

                    {/* Tabs for Forgot Password */}
                    <div className="flex rounded-2xl bg-surface/80 p-1 border border-border-default/60 mb-6 gap-1">
                      <button
                        type="button"
                        onClick={() => setForgotTab("sms_login")}
                        className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          forgotTab === "sms_login"
                            ? "bg-primary-default text-white shadow-md shadow-primary-default/25"
                            : "text-text-muted hover:text-text-primary hover:bg-background/50"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>ورود مستقیم با پیامک</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotTab("sms_reset")}
                        className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          forgotTab === "sms_reset"
                            ? "bg-primary-default text-white shadow-md shadow-primary-default/25"
                            : "text-text-muted hover:text-text-primary hover:bg-background/50"
                        }`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>تعیین رمز با پیامک</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotTab("national_code")}
                        className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          forgotTab === "national_code"
                            ? "bg-primary-default text-white shadow-md shadow-primary-default/25"
                            : "text-text-muted hover:text-text-primary hover:bg-background/50"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>کد ملی</span>
                      </button>
                    </div>

                    {/* Tab 1: Direct SMS Login */}
                    {forgotTab === "sms_login" && (
                      <form onSubmit={handleForgotOtpDirectLogin} className="space-y-4">
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300">
                          با وارد کردن شماره همراه، کد تایید برای شما پیامک شده و می‌توانید بدون نیاز به رمز وارد حساب خود شوید.
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            شماره همراه یا نام کاربری *
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1 group">
                              <input
                                type="text"
                                required
                                dir="ltr"
                                value={forgotOtpMobile}
                                onChange={(e) => setForgotOtpMobile(e.target.value)}
                                className="w-full pl-4 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50 text-left font-mono"
                                placeholder="09121111111"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                                <Smartphone className="w-4 h-4" />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendForgotOtp()}
                              disabled={loading || forgotOtpTimer > 0}
                              className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                            >
                              {forgotOtpTimer > 0 ? (
                                <span className="font-mono">{Math.floor(forgotOtpTimer / 60)}:{(forgotOtpTimer % 60).toString().padStart(2, '0')}</span>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{forgotOtpSent ? "ارسال مجدد" : "دریافت کد"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {forgotOtpSent && (
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              کد ورود با پیامک ارسال شد.
                            </span>
                            {forgotSimulatedCode && (
                              <span className="font-mono font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-900 dark:text-slate-100">
                                کد تست: {forgotSimulatedCode}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            کد تایید ۵ رقمی دریافتی *
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              maxLength={6}
                              dir="ltr"
                              value={forgotOtpCode}
                              onChange={(e) => setForgotOtpCode(e.target.value)}
                              className="w-full pl-4 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-base tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="• • • • •"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <KeyRound className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={loading || !forgotOtpCode}
                            className="w-full bg-primary-default hover:bg-primary-hover text-white font-black py-4 rounded-xl shadow-lg shadow-primary-default/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-75 cursor-pointer"
                          >
                            {loading ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <span className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>ورود مستقیم به حساب کاربری</span>
                              </span>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Tab 2: Reset Password via SMS */}
                    {forgotTab === "sms_reset" && (
                      <form onSubmit={handleForgotOtpResetPassword} className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            شماره همراه یا نام کاربری *
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1 group">
                              <input
                                type="text"
                                required
                                dir="ltr"
                                value={forgotOtpMobile}
                                onChange={(e) => setForgotOtpMobile(e.target.value)}
                                className="w-full pl-4 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50 text-left font-mono"
                                placeholder="09121111111"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                                <Smartphone className="w-4 h-4" />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendForgotOtp()}
                              disabled={loading || forgotOtpTimer > 0}
                              className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                            >
                              {forgotOtpTimer > 0 ? (
                                <span className="font-mono">{Math.floor(forgotOtpTimer / 60)}:{(forgotOtpTimer % 60).toString().padStart(2, '0')}</span>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{forgotOtpSent ? "ارسال مجدد" : "دریافت کد"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {forgotOtpSent && (
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              کد تایید پیامک شد.
                            </span>
                            {forgotSimulatedCode && (
                              <span className="font-mono font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-900 dark:text-slate-100">
                                کد تست: {forgotSimulatedCode}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            کد تایید ۵ رقمی *
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              maxLength={6}
                              dir="ltr"
                              value={forgotOtpCode}
                              onChange={(e) => setForgotOtpCode(e.target.value)}
                              className="w-full pl-4 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-base tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="• • • • •"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <KeyRound className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            رمز عبور جدید *
                          </label>
                          <div className="relative group">
                            <input
                              type={forgotShowPassword ? "text" : "password"}
                              required
                              value={forgotNewPassword}
                              onChange={(e) => setForgotNewPassword(e.target.value)}
                              className="w-full pl-12 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="حداقل ۶ کاراکتر"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <Lock className="w-5 h-5" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setForgotShowPassword(!forgotShowPassword)}
                              className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted hover:text-primary-default transition-colors"
                            >
                              {forgotShowPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            تکرار رمز عبور جدید *
                          </label>
                          <div className="relative group">
                            <input
                              type={forgotShowPassword ? "text" : "password"}
                              required
                              value={forgotConfirmPassword}
                              onChange={(e) => setForgotConfirmPassword(e.target.value)}
                              className="w-full pl-12 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="تکرار کلمه عبور جدید"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <Lock className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={loading || !forgotOtpCode || !forgotNewPassword}
                            className="w-full bg-primary-default hover:bg-primary-hover text-white font-black py-4 rounded-xl shadow-lg shadow-primary-default/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-75 cursor-pointer"
                          >
                            {loading ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <span>تغییر رمز عبور و ورود به حساب</span>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Tab 3: National Code Recovery (Legacy) */}
                    {forgotTab === "national_code" && (
                      <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            نام کاربری یا شماره تماس *
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              value={forgotIdentity}
                              onChange={(e) => setForgotIdentity(e.target.value)}
                              className="w-full pl-4 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="مثال: s_ahmadi یا 09121111111"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <User className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            کد ملی ۱۰ رقمی *
                          </label>
                          <div className="relative group">
                            <input
                              type="text"
                              required
                              maxLength={10}
                              value={forgotNationalCode}
                              onChange={(e) => setForgotNationalCode(e.target.value)}
                              className="w-full pl-4 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary text-center font-mono font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="کد ملی ۱۰ رقمی"
                              style={{ direction: "ltr" }}
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <FileText className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            رمز عبور جدید *
                          </label>
                          <div className="relative group">
                            <input
                              type={forgotShowPassword ? "text" : "password"}
                              required
                              value={forgotNewPassword}
                              onChange={(e) => setForgotNewPassword(e.target.value)}
                              className="w-full pl-12 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="حداقل ۶ کاراکتر"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <Lock className="w-5 h-5" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setForgotShowPassword(!forgotShowPassword)}
                              className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-muted hover:text-primary-default transition-colors"
                            >
                              {forgotShowPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            تکرار رمز عبور جدید *
                          </label>
                          <div className="relative group">
                            <input
                              type={forgotShowPassword ? "text" : "password"}
                              required
                              value={forgotConfirmPassword}
                              onChange={(e) => setForgotConfirmPassword(e.target.value)}
                              className="w-full pl-12 pr-11 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="تکرار کلمه عبور جدید"
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-default transition-colors">
                              <Lock className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        {/* CAPTCHA block */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-text-secondary">
                            کد امنیتی (کپچا) *
                          </label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="text"
                              required
                              maxLength={4}
                              value={captchaInput}
                              onChange={(e) => setCaptchaInput(e.target.value)}
                              className="flex-1 px-4 py-3 bg-background hover:bg-surface/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all text-text-primary text-center font-mono font-bold border-gray-300 dark:border-indigo-500/50"
                              placeholder="کد ۴ رقمی روبرو"
                            />
                            <div className="flex items-center gap-2 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 px-4 py-2.5 rounded-xl border border-subtle select-none">
                              <span className="font-mono font-black text-lg text-slate-700 dark:text-slate-200 tracking-widest line-through select-none italic transform -skew-x-12">
                                {captchaVal}
                              </span>
                              <button
                                type="button"
                                onClick={generateCaptcha}
                                className="p-1 text-muted hover:text-primary transition-colors cursor-pointer"
                                title="تغییر کد امنیتی"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-default hover:bg-primary-hover text-white font-black py-4 rounded-xl shadow-lg shadow-primary-default/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-75 cursor-pointer"
                          >
                            {loading ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <span>بروزرسانی رمز عبور</span>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="mt-6 text-center border-t border-border-default/50 dark:border-border-subtle/50 pt-4">
                      <p className="text-xs text-text-muted">
                        رمز عبور خود را به یاد آورده‌اید؟
                        <button
                          onClick={() => setView("login")}
                          className="text-primary-default font-bold mr-1 hover:underline cursor-pointer"
                        >
                          بازگشت به صفحه ورود
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Role Select View */}
              {view === "role_select" && (
                <div
                  id="view-role"
                  dir="rtl"
                  className="bg-card/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-border-default/60 dark:border-border-subtle/50 animate-fade-in text-right relative max-w-lg mx-auto"
                >
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="absolute top-6 right-6 text-text-muted hover:text-primary-default transition-all bg-surface hover:bg-subtle rounded-full p-2 cursor-pointer shadow-sm border border-border-subtle/50"
                    aria-label="بازگشت به صفحه ورود"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div className="flex justify-center mb-6">
                    <ZopitLogo size="xl" />
                  </div>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-text-primary mb-2 tracking-tight">
                      به زوپیت بپیوندید
                    </h2>
                    <p className="text-text-muted text-sm font-medium">
                      برای شروع، نوع حساب کاربری خود را انتخاب کنید
                    </p>
                  </div>
                  <div className="space-y-4">
                    {/* 1. Supplier */}
                    <button
                      type="button"
                      onClick={() => setView("supplier_form")}
                      className="w-full group bg-card border border-border-default/80 dark:border-border-subtle/40 p-4.5 rounded-2xl hover:border-primary-default hover:bg-primary-default/[0.02] hover:shadow-xl hover:shadow-primary-default/5 transition-all text-right relative overflow-hidden flex items-center justify-between gap-4 cursor-pointer"
                      aria-label="ثبت نام به عنوان تامین کننده یا عمده فروش"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-default/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary-default group-hover:text-white transition-all duration-300 text-primary-default">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-text-primary group-hover:text-primary-default transition-colors">
                            تامین‌کننده / عمده‌فروش
                          </h3>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed font-medium">
                            ثبت محصولات، قیمت‌گذاری عمده و دریافت سفارشات از فروشگاه‌ها
                          </p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-primary-default group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                    </button>

                    {/* 2. Store Manager */}
                    <button
                      type="button"
                      onClick={() => setView("store_manager_form")}
                      className="w-full group bg-card border border-border-default/80 dark:border-border-subtle/40 p-4.5 rounded-2xl hover:border-success hover:bg-success/[0.02] hover:shadow-xl hover:shadow-success/5 transition-all text-right relative overflow-hidden flex items-center justify-between gap-4 cursor-pointer"
                      aria-label="ثبت نام به عنوان مدیر فروشگاه خرده فروشی"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-success group-hover:text-white transition-all duration-300 text-success">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-text-primary group-hover:text-success transition-colors">
                            مدیر فروشگاه (خرده‌فروش)
                          </h3>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed font-medium">
                            صرفاً فقط فروشنده کالا در سیستم است
                          </p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-success group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                    </button>

                    {/* 3. Customer */}
                    <button
                      type="button"
                      onClick={() => setView("customer_form")}
                      className="w-full group bg-card border border-border-default/80 dark:border-border-subtle/40 p-4.5 rounded-2xl hover:border-blue-500 hover:bg-blue-500/[0.02] hover:shadow-xl hover:shadow-blue-500/5 transition-all text-right relative overflow-hidden flex items-center justify-between gap-4 cursor-pointer"
                      aria-label="ثبت نام به عنوان مشتری خریدار"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 text-blue-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-text-primary group-hover:text-blue-500 transition-colors">
                            مشتری (خریدار)
                          </h3>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed font-medium">
                            ثبت‌نام برای خرید محصولات، پیگیری سفارشات و پشتیبانی
                          </p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-blue-500 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                    </button>

                    {/* 4. Referrer */}
                    <button
                      type="button"
                      onClick={() => setView("referrer_form")}
                      className="w-full group bg-card border border-border-default/80 dark:border-border-subtle/40 p-4.5 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/[0.02] hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-right relative overflow-hidden flex items-center justify-between gap-4 cursor-pointer"
                      aria-label="ثبت نام به عنوان معرف سیستم"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 text-indigo-500">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-text-primary group-hover:text-indigo-500 transition-colors">
                            همکار معرف (Referrer)
                          </h3>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed font-medium">
                            کسب سود همیشگی از معرفی تامین‌کنندگان و فروشندگان جدید
                          </p>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-indigo-500 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                    </button>
                  </div>
                </div>
              )}
            </div>{" "}
            <div className="w-full max-w-[800px]">
              {" "}
              {/* 3. SUPPLIER MULTI-STEP FORM */}
              
              {/* Customer Registration View */}
                {view === "customer_form" && (
                <div
                  id="view-customer"
                  className="bg-card/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border animate-fade-in text-center relative"
                >
                  <button
                    type="button"
                    onClick={() => setView("role_select")}
                    className="absolute top-6 right-6 text-muted hover:text-primary transition-colors bg-surface rounded-full p-2 cursor-pointer"
                    aria-label="بازگشت به انتخاب نقش"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div className="flex justify-center mb-6">
                    <ZopitLogo size="xl" />
                  </div>
                  <h2 className="text-2xl font-black text-primary mb-2">ثبت نام مشتری</h2>
                  <p className="text-primary text-sm mb-8">اطلاعات خود را وارد کنید</p>
                  
                  <div className="space-y-4 animate-fade-in text-right">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">نام *</label>
                        <input
                          type="text"
                          required
                          value={customerData.firstName}
                          onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        {customerErrors.firstName && <p className="text-[10px] text-danger mt-1 font-semibold">{customerErrors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">نام خانوادگی *</label>
                        <input
                          type="text"
                          required
                          value={customerData.lastName}
                          onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        {customerErrors.lastName && <p className="text-[10px] text-danger mt-1 font-semibold">{customerErrors.lastName}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">موبایل *</label>
                        <input
                          type="tel"
                          required
                          value={customerData.mobile}
                          onChange={(e) => setCustomerData({ ...customerData, mobile: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          dir="ltr"
                          placeholder="09........."
                        />
                        {customerErrors.mobile && <p className="text-[10px] text-danger mt-1 font-semibold">{customerErrors.mobile}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">ایمیل (اختیاری)</label>
                        <input
                          type="email"
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-black text-secondary mb-1.5">نام کاربری (انگلیسی) *</label>
                      <input
                        type="text"
                        required
                        value={customerData.username}
                        onChange={(e) => setCustomerData({ ...customerData, username: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        dir="ltr"
                      />
                      {customerErrors.username && <p className="text-[10px] text-danger mt-1 font-semibold">{customerErrors.username}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">کلمه عبور *</label>
                        <input
                          type="password"
                          required
                          value={customerData.password}
                          onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          dir="ltr"
                        />
                        {customerErrors.password && <p className="text-[10px] text-danger mt-1 font-semibold">{customerErrors.password}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">تکرار کلمه عبور *</label>
                        <input
                          type="password"
                          required
                          value={customerData.confirmPassword}
                          onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                          className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          dir="ltr"
                        />
                        {customerErrors.confirmPassword && <p className="text-[10px] text-danger mt-1 font-semibold">{customerErrors.confirmPassword}</p>}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 justify-between items-center mt-6">
                      <button
                        type="button"
                        onClick={handleCustomerRegister}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            در حال ایجاد حساب...
                          </span>
                        ) : (
                          "تایید و ثبت نام"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {view === "supplier_form" && (
                <div
                  id="view-supplier-form"
                  className="space-y-6 animate-fade-in text-right"
                >
                  {" "}
                  <div className="bg-card/95 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] shadow-2xl border">
                    <div className="flex justify-center mb-4 pb-4 border-b border-subtle">
                      <ZopitLogo size="md" />
                    </div>
                    {" "}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-subtle">
                      {" "}
                      <div>
                        {" "}
                        <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                          <ZopitLogo size="sm" />
                          ثبت‌نام تامین‌کننده{" "}
                        </h2>{" "}
                        <p className="text-muted text-sm mt-2 mr-1">
                          مرحله {supplierStep} از ۳:{" "}
                          {supplierStep === 1
                            ? "اطلاعات فردی و شناسنامه‌ای"
                            : supplierStep === 2
                            ? "اطلاعات کسب‌وکار و مالی"
                            : "تعیین نام کاربری و کلمه عبور"}
                        </p>{" "}
                      </div>{" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <button
                          onClick={() => setView("role_select")}
                          className="text-muted hover:text-secondary bg-surface p-2.5 rounded-full transition-colors cursor-pointer"
                          title="بازگشت"
                        >
                          {" "}
                          <ArrowRight className="w-5 h-5" />{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}

                    {/* Stepper Bar for Supplier */}
                    <div className="mb-8 px-2">
                      <div className="flex items-center justify-between max-w-md mx-auto relative">
                        <div className="absolute top-4 left-6 right-6 h-1 bg-subtle z-0" />
                        <div
                          className="absolute top-4 left-6 h-1 bg-primary-default z-0 transition-all duration-300"
                          style={{
                            width: supplierStep === 1 ? "0%" : supplierStep === 2 ? "50%" : "100%",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleSupplierStepChange(1)}
                          className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            supplierStep >= 1 ? "bg-primary-default text-white shadow-md shadow-primary-default/30" : "bg-surface border text-muted"
                          }`}>۱</div>
                          <span className={`text-[11px] font-bold ${supplierStep === 1 ? "text-primary" : "text-muted"}`}>اطلاعات فردی</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSupplierStepChange(2)}
                          className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            supplierStep >= 2 ? "bg-primary-default text-white shadow-md shadow-primary-default/30" : "bg-surface border text-muted"
                          }`}>۲</div>
                          <span className={`text-[11px] font-bold ${supplierStep === 2 ? "text-primary" : "text-muted"}`}>کسب‌وکار و مالی</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSupplierStepChange(3)}
                          className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            supplierStep >= 3 ? "bg-primary-default text-white shadow-md shadow-primary-default/30" : "bg-surface border text-muted"
                          }`}>۳</div>
                          <span className={`text-[11px] font-bold ${supplierStep === 3 ? "text-primary" : "text-muted"}`}>حساب کاربری</span>
                        </button>
                      </div>
                    </div>

                    {/* Supplier Draft Restore Banner */}
                    {localStorage.getItem("supplierDataDraft") && (
                      <div className="mb-6 p-4 bg-primary-default/10 border border-primary-default/30 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-fade-in text-primary-hover text-xs">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <Info className="w-4 h-4 shrink-0 text-primary-default" />{" "}
                          <span>
                            یک پیش‌نویس ذخیره‌شده از ثبت‌نام قبلی شما یافت شد.
                            آیا مایل به بازیابی اطلاعات قبلی هستید؟
                          </span>{" "}
                        </div>{" "}
                        <div className="flex gap-2 shrink-0">
                          {" "}
                          <button
                            type="button"
                            onClick={() => {
                              const savedData =
                                localStorage.getItem("supplierDataDraft");
                              const savedStep =
                                localStorage.getItem("supplierStepDraft");
                              if (savedData) {
                                setSupplierData(JSON.parse(savedData));
                              }
                              if (savedStep) {
                                const parsed = parseInt(savedStep, 10);
                                setSupplierStep(parsed > 2 || isNaN(parsed) ? 1 : parsed);
                              }
                              showNotification(
                                "پیش‌نویس قبلی شما با موفقیت بازیابی شد.",
                                "success",
                              );
                            }}
                            className="px-3 py-1.5 bg-primary-default hover:bg-primary-hover text-white font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {" "}
                            بازیابی پیش‌نویس{" "}
                          </button>{" "}
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.removeItem("supplierDataDraft");
                              localStorage.removeItem("supplierStepDraft");
                              showNotification(
                                "پیش‌نویس ذخیره‌شده حذف گردید.",
                                "success",
                              );
                            }}
                            className="px-3 py-1.5 border hover:bg-surface text-secondary font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {" "}
                            حذف{" "}
                          </button>{" "}
                        </div>{" "}
                      </div>
                    )}
                    {/* STEP 1: Personal Info */}
                    {supplierStep === 1 && (
                      <div className="space-y-4 animate-fade-in text-right">
                        {" "}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {" "}
                          <div>
                            {" "}
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              نام *
                            </label>{" "}
                            <input
                              type="text"
                              required
                              value={supplierData.firstName}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  firstName: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all"
                            />{" "}
                            {supplierErrors.firstName && (
                              <p className="text-[10px] text-danger mt-1 font-semibold">
                                {supplierErrors.firstName}
                              </p>
                            )}
                          </div>{" "}
                          <div>
                            {" "}
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              نام خانوادگی *
                            </label>{" "}
                            <input
                              type="text"
                              required
                              value={supplierData.lastName}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  lastName: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all"
                            />{" "}
                            {supplierErrors.lastName && (
                              <p className="text-[10px] text-danger mt-1 font-semibold">
                                {supplierErrors.lastName}
                              </p>
                            )}
                          </div>{" "}
                        </div>{" "}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {" "}
                          <div>
                            {" "}
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              شماره موبایل *
                            </label>{" "}
                            <input
                              type="tel"
                              required
                              value={supplierData.mobile}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  mobile: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all font-mono"
                              style={{
                                direction: "ltr",
                              }}
                            />{" "}
                            {supplierErrors.mobile && (
                              <p className="text-[10px] text-danger mt-1 font-semibold">
                                {supplierErrors.mobile}
                              </p>
                            )}
                          </div>{" "}
                          <div>
                            {" "}
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              کد ملی *
                            </label>{" "}
                            <input
                              type="text"
                              required
                              value={supplierData.nationalCode}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  nationalCode: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all font-mono"
                              style={{
                                direction: "ltr",
                              }}
                            />{" "}
                            {supplierErrors.nationalCode && (
                              <p className="text-[10px] text-danger mt-1 font-semibold">
                                {supplierErrors.nationalCode}
                              </p>
                            )}
                          </div>{" "}
                        </div>{" "}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              ایمیل (اختیاری)
                            </label>{" "}
                            <input
                              type="email"
                              value={supplierData.email}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  email: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all font-mono"
                              style={{
                                direction: "ltr",
                              }}
                            />{" "}
                          </div>{" "}
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              کد معرف (اختیاری)
                            </label>{" "}
                            <input
                              type="text"
                              value={supplierData.referralCode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setSupplierData({
                                  ...supplierData,
                                  referralCode: val,
                                });
                              }}
                              placeholder="مثال: 123456"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all font-mono"
                              style={{
                                direction: "ltr",
                              }}
                            />{" "}
                          </div>{" "}
                        </div>{" "}

                        <div className="flex gap-3 justify-between items-center mt-6">
                          <button
                            type="button"
                            onClick={() => handleSupplierStepChange(2)}
                            className="flex-1 bg-primary-default hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                          >
                            ادامه و مرحله بعد <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={saveSupplierDraft}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Database className="w-4 h-4" /> ذخیره پیش‌نویس
                          </button>
                        </div>
                      </div>
                    )}
                    {/* STEP 2: Business & Financial Info */}
                    {supplierStep === 2 && (
                      <div className="space-y-4 animate-fade-in text-right">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              نام برند / نام تجاری *
                            </label>
                            <input
                              type="text"
                              required
                              value={supplierData.brandName}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  brandName: e.target.value,
                                })
                              }
                              placeholder="نام تجاری کسب‌وکار"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all"
                            />
                            {supplierErrors.brandName && (
                              <p className="text-[10px] text-danger mt-1 font-semibold">
                                {supplierErrors.brandName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              نوع فعالیت اصلی *
                            </label>
                            <select
                              value={supplierData.activityType}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  activityType: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                            >
                              <option value="PRODUCER">تولیدکننده</option>
                              <option value="WHOLESALER">
                                عمده‌فروش / بنکدار
                              </option>
                              <option value="IMPORTER">واردکننده مستقیم</option>
                              <option value="OTHER">سایر</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <SearchableSelect
                            label="استان *"
                            placeholder="انتخاب استان..."
                            value={supplierData.province}
                            onChange={(val) =>
                              setSupplierData({
                                ...supplierData,
                                province: val,
                                city: "",
                              })
                            }
                            options={PROVINCES.map((p) => p.name)}
                          />
                          <SearchableSelect
                            label="شهر *"
                            placeholder="انتخاب شهر..."
                            value={supplierData.city}
                            onChange={(val) =>
                              setSupplierData({ ...supplierData, city: val })
                            }
                            options={getCitiesForProvince(
                              supplierData.province,
                            )}
                            disabled={!supplierData.province}
                          />
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              کد پستی *
                            </label>
                            <input
                              type="text"
                              required
                              value={supplierData.postalCode}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  postalCode: e.target.value,
                                })
                              }
                              placeholder="کد پستی ۱۰ رقمی"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all font-mono"
                              style={{
                                direction: "ltr",
                              }}
                            />
                            {supplierErrors.postalCode && (
                              <p className="text-[10px] text-danger mt-1 font-semibold">
                                {supplierErrors.postalCode}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-secondary mb-1.5">
                            نشانی دقیق دفتر مرکزی یا انبار *
                          </label>
                          <textarea
                            rows={2}
                            value={supplierData.address}
                            onChange={(e) =>
                              setSupplierData({
                                ...supplierData,
                                address: e.target.value,
                              })
                            }
                            placeholder="مثال: تهران، خیابان شریعتی، بن‌بست الوند، پلاک ۲، واحد ۴"
                            className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all"
                          />
                          {supplierErrors.address && (
                            <p className="text-[10px] text-danger mt-1 font-semibold">
                              {supplierErrors.address}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              تلفن ثابت فروشگاه/شرکت *
                            </label>
                            <input
                              type="tel"
                              required
                              value={supplierData.telephone}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  telephone: e.target.value,
                                })
                              }
                              placeholder="مثال: 02188888888"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all font-mono"
                              style={{
                                direction: "ltr",
                              }}
                            />
                            {supplierErrors.telephone && (
                              <p className="text-[10px] text-danger mt-1 font-semibold">
                                {supplierErrors.telephone}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              آدرس وب‌سایت یا کانال فروش (اختیاری)
                            </label>
                            <input
                              type="url"
                              value={supplierData.website}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  website: e.target.value,
                                })
                              }
                              placeholder="https://mybrand.ir"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all font-mono"
                              style={{
                                direction: "ltr",
                              }}
                            />
                          </div>
                        </div>
                        {/* --- FINANCIAL FIELDS --- */}
                        <div className="p-4 bg-warning/10 border border-amber-200 rounded-xl flex gap-3 text-amber-900 text-xs text-right mt-6">
                          <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-1">
                              دقت در وارد کردن اطلاعات شبا
                            </span>
                            جهت تسویه حساب و واریز اتوماتیک سهم تامین‌کننده،
                            حتماً شبا بانکی معتبر متعلق به نام صاحب کسب‌وکار را
                            وارد نمایید.
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-xs font-black text-secondary mb-1.5">
                            نام و نام خانوادگی صاحب حساب *
                          </label>
                          <input
                            type="text"
                            required
                            value={supplierData.accountHolderName}
                            onChange={(e) =>
                              setSupplierData({
                                ...supplierData,
                                accountHolderName: e.target.value,
                              })
                            }
                            placeholder="نام کامل ثبت شده در بانک"
                            className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all"
                          />
                          {supplierErrors.accountHolderName && (
                            <p className="text-[10px] text-danger mt-1 font-semibold">
                              {supplierErrors.accountHolderName}
                            </p>
                          )}
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-black text-secondary">
                              شماره شبا (IBAN) *
                            </label>
                            {supplierData.shaba.length >= 24 && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formatAndValidateShaba(supplierData.shaba).isValid ? "bg-success/20 text-emerald-800" : "bg-danger/20 text-rose-800"}`}
                              >
                                {formatAndValidateShaba(supplierData.shaba).isValid
                                  ? "✓ شبا معتبر است"
                                  : "✗ شبا نامعتبر است"}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={supplierData.shaba}
                              onChange={(e) =>
                                setSupplierData({
                                  ...supplierData,
                                  shaba: e.target.value,
                                })
                              }
                              maxLength={30}
                              placeholder="IR000000000000000000000000"
                              className={`w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left font-mono focus:outline-none focus:ring-2 focus:bg-card dark:focus:bg-surface/50 transition-all ${supplierData.shaba.length >= 24 ? (formatAndValidateShaba(supplierData.shaba).isValid ? "border-emerald-300 focus:ring-success" : "border-rose-300 focus:ring-rose-500") : " focus:ring-primary-default"}`}
                              style={{
                                direction: "ltr",
                              }}
                            />
                          </div>
                          {supplierErrors.shaba && (
                            <p className="text-[10px] text-danger mt-1 font-semibold">
                              {supplierErrors.shaba}
                            </p>
                          )}
                          <p className="text-[10px] text-muted mt-1">
                            با یا بدون پیشوند IR و فاصله قابل قبول است.
                          </p>
                        </div>
                        <div className="mt-4">
                          <label className="block text-xs font-black text-secondary mb-1.5">
                            نام بانک صادرکننده کارت/حساب *
                          </label>
                          <input
                            type="text"
                            required
                            value={supplierData.bankName}
                            onChange={(e) =>
                              setSupplierData({
                                ...supplierData,
                                bankName: e.target.value,
                              })
                            }
                            placeholder="مثال: بانک ملی، ملت، سامان و ..."
                            className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-default dark:focus:ring-primary-default focus:bg-card dark:focus:bg-surface/50 transition-all"
                          />
                          {supplierErrors.bankName && (
                            <p className="text-[10px] text-danger mt-1 font-semibold">
                              {supplierErrors.bankName}
                            </p>
                          )}
                        </div>
                        {/* --- END FINANCIAL FIELDS --- */}
                        <div className="flex gap-3 justify-between items-center mt-6">
                          <button
                            type="button"
                            onClick={() => setSupplierStep(1)}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all text-xs cursor-pointer font-bold"
                          >
                            مرحله قبل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSupplierStepChange(3)}
                            className="flex-1 bg-primary-default hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                          >
                            ادامه و مرحله بعد <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={saveSupplierDraft}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Database className="w-4 h-4" /> ذخیره پیش‌نویس
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Account Credentials */}
                    {supplierStep === 3 && (
                      <div className="space-y-4 animate-fade-in text-right">
                        <div className="p-4 bg-surface/60 border border-subtle rounded-2xl space-y-4">
                          <h4 className="text-xs font-bold text-primary flex items-center gap-2 border-b border-subtle pb-2">
                            <Lock className="w-4 h-4 text-primary-default" /> اطلاعات حساب کاربری (جهت ورود به سامانه)
                          </h4>
                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">
                              نام کاربری اختصاصی (Username) *
                            </label>
                            <input
                              type="text"
                              required
                              value={supplierData.username}
                              onChange={(e) => setSupplierData({ ...supplierData, username: e.target.value })}
                              placeholder="مثال: supplier_sam"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left font-mono focus:outline-none focus:ring-2 focus:ring-primary-default"
                              style={{ direction: "ltr" }}
                            />
                            {supplierErrors.username && <p className="text-[10px] text-danger mt-1 font-semibold">{supplierErrors.username}</p>}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">کلمه عبور *</label>
                              <input
                                type="password"
                                required
                                value={supplierData.password}
                                onChange={(e) => setSupplierData({ ...supplierData, password: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                                style={{ direction: "ltr" }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">تکرار کلمه عبور *</label>
                              <input
                                type="password"
                                required
                                value={supplierData.confirmPassword}
                                onChange={(e) => setSupplierData({ ...supplierData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                                style={{ direction: "ltr" }}
                              />
                            </div>
                          </div>
                          {supplierErrors.password && <p className="text-[10px] text-danger font-semibold">{supplierErrors.password}</p>}
                          {supplierErrors.confirmPassword && <p className="text-[10px] text-danger font-semibold">{supplierErrors.confirmPassword}</p>}
                        </div>

                        <div className="flex gap-3 justify-between items-center mt-6">
                          <button
                            type="button"
                            onClick={() => setSupplierStep(2)}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all text-xs cursor-pointer font-bold"
                          >
                            مرحله قبل
                          </button>
                          <button
                            type="button"
                            onClick={handleSupplierRegister}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-500/20"
                          >
                            {loading ? "در حال پردازش..." : "تکمیل ثبت‌نام و درخواست عضویت"}
                          </button>
                          <button
                            type="button"
                            onClick={saveSupplierDraft}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Database className="w-4 h-4" /> ذخیره پیش‌نویس
                          </button>
                        </div>
                      </div>
                    )}
</div>
</div>
)}
{view === "store_manager_form" && (
              <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in text-right">
                <div className="bg-card border border-border-subtle p-8 rounded-3xl shadow-xl shadow-primary-default/5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-subtle">
                    <div>
                      <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                        <ZopitLogo size="sm" />
                        ثبت‌نام مدیر فروشگاه
                      </h2>
                      <p className="text-xs text-muted mt-1">
                        مرحله {storeStep} از ۳:{" "}
                        {storeStep === 1
                          ? "مشخصات فردی مدیر فروشگاه"
                          : storeStep === 2
                          ? "اطلاعات فروشگاه و کسب‌وکار"
                          : "تنظیم حساب کاربری و کلمه عبور"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView("role_select")}
                      className="p-2 bg-surface hover:bg-border text-secondary rounded-full transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Stepper Bar for Store Manager */}
                  <div className="mb-8 px-2">
                    <div className="flex items-center justify-between max-w-md mx-auto relative">
                      <div className="absolute top-4 left-6 right-6 h-1 bg-subtle z-0" />
                      <div
                        className="absolute top-4 left-6 h-1 bg-primary-default z-0 transition-all duration-300"
                        style={{
                          width: storeStep === 1 ? "0%" : storeStep === 2 ? "50%" : "100%",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleStoreStepChange(1)}
                        className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          storeStep >= 1 ? "bg-primary-default text-white shadow-md shadow-primary-default/30" : "bg-surface border text-muted"
                        }`}>۱</div>
                        <span className={`text-[11px] font-bold ${storeStep === 1 ? "text-primary" : "text-muted"}`}>اطلاعات فردی</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStoreStepChange(2)}
                        className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          storeStep >= 2 ? "bg-primary-default text-white shadow-md shadow-primary-default/30" : "bg-surface border text-muted"
                        }`}>۲</div>
                        <span className={`text-[11px] font-bold ${storeStep === 2 ? "text-primary" : "text-muted"}`}>اطلاعات فروشگاه</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStoreStepChange(3)}
                        className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          storeStep >= 3 ? "bg-primary-default text-white shadow-md shadow-primary-default/30" : "bg-surface border text-muted"
                        }`}>۳</div>
                        <span className={`text-[11px] font-bold ${storeStep === 3 ? "text-primary" : "text-muted"}`}>حساب کاربری</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); if (storeStep === 3) handleStoreManagerRegister(); }} className="space-y-6">
                    
                    {/* Step 1: Personal Info */}
                    {storeStep === 1 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="p-4 bg-surface/50 border border-subtle rounded-2xl space-y-4">
                          <h3 className="text-xs font-bold text-primary flex items-center gap-2 border-b border-subtle pb-2">
                            <User className="w-4 h-4 text-primary-default" /> مشخصات فردی مدیر فروشگاه
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">نام *</label>
                              <input
                                type="text"
                                required
                                value={storeData.firstName}
                                onChange={(e) => setStoreData({ ...storeData, firstName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default"
                              />
                              {storeErrors.firstName && <p className="text-[10px] text-danger mt-1">{storeErrors.firstName}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">نام خانوادگی *</label>
                              <input
                                type="text"
                                required
                                value={storeData.lastName}
                                onChange={(e) => setStoreData({ ...storeData, lastName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default"
                              />
                              {storeErrors.lastName && <p className="text-[10px] text-danger mt-1">{storeErrors.lastName}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">شماره موبایل *</label>
                              <input
                                type="tel"
                                required
                                placeholder="09123456789"
                                value={storeData.mobile}
                                onChange={(e) => setStoreData({ ...storeData, mobile: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                                style={{ direction: "ltr" }}
                              />
                              {storeErrors.mobile && <p className="text-[10px] text-danger mt-1">{storeErrors.mobile}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">کد ملی *</label>
                              <input
                                type="text"
                                required
                                maxLength={10}
                                placeholder="10 رقم بدون خط تیره"
                                value={storeData.nationalCode}
                                onChange={(e) => setStoreData({ ...storeData, nationalCode: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                                style={{ direction: "ltr" }}
                              />
                              {storeErrors.nationalCode && <p className="text-[10px] text-danger mt-1">{storeErrors.nationalCode}</p>}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">ایمیل (اختیاری)</label>
                            <input
                              type="email"
                              value={storeData.email}
                              onChange={(e) => setStoreData({ ...storeData, email: e.target.value })}
                              placeholder="example@domain.com"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                              style={{ direction: "ltr" }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 justify-between items-center mt-6">
                          <button
                            type="button"
                            onClick={() => handleStoreStepChange(2)}
                            className="flex-1 bg-primary-default hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                          >
                            ادامه و مرحله بعد <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={saveStoreDraft}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Database className="w-4 h-4" /> ذخیره پیش‌نویس
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Store & Business Info */}
                    {storeStep === 2 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="p-4 bg-surface/50 border border-subtle rounded-2xl space-y-4">
                          <h3 className="text-xs font-bold text-primary flex items-center gap-2 border-b border-subtle pb-2">
                            <Store className="w-4 h-4 text-primary-default" /> اطلاعات فروشگاه و کسب‌وکار
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">نام فروشگاه / مجموعه *</label>
                              <input
                                type="text"
                                required
                                placeholder="مثال: فروشگاه کالای دیجیتال آریا"
                                value={storeData.storeName}
                                onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default"
                              />
                              {storeErrors.storeName && <p className="text-[10px] text-danger mt-1">{storeErrors.storeName}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">نوع پلتفرم فروشگاه</label>
                              <select
                                value={storeData.platformType}
                                onChange={(e) => setStoreData({ ...storeData, platformType: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default"
                              >
                                <option value="WOOCOMMERCE">فروشگاه ووکامرس (WooCommerce)</option>
                                <option value="INSTAGRAM">پیج زوپیت‌گرام (ZoombitGram)</option>
                                <option value="CUSTOM_SITE">وب‌سایت اختصاصی</option>
                                <option value="PHYSICAL_OTHER">فروشگاه حضوری / سایر</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">لینک وب‌سایت / فروشگاه اینترنتی</label>
                              <input
                                type="url"
                                placeholder="https://mystore.ir"
                                value={storeData.storeUrl || storeData.storeLink}
                                onChange={(e) => setStoreData({ ...storeData, storeUrl: e.target.value, storeLink: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                                style={{ direction: "ltr" }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">حوزه فعالیت</label>
                              <input
                                type="text"
                                placeholder="مثال: لوازم خانگی، پوشاک، کالای دیجیتال..."
                                value={storeData.fieldOfActivity}
                                onChange={(e) => setStoreData({ ...storeData, fieldOfActivity: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">آدرس دقیق فروشگاه / دفتر</label>
                            <textarea
                              rows={2}
                              placeholder="استان، شهر، خیابان اصلی، پلاک، واحد..."
                              value={storeData.storeAddress}
                              onChange={(e) => setStoreData({ ...storeData, storeAddress: e.target.value })}
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default leading-relaxed"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 justify-between items-center mt-6">
                          <button
                            type="button"
                            onClick={() => setStoreStep(1)}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all text-xs cursor-pointer font-bold"
                          >
                            مرحله قبل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStoreStepChange(3)}
                            className="flex-1 bg-primary-default hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                          >
                            ادامه و مرحله بعد <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={saveStoreDraft}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Database className="w-4 h-4" /> ذخیره پیش‌نویس
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Credentials */}
                    {storeStep === 3 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="p-4 bg-surface/50 border border-subtle rounded-2xl space-y-4">
                          <h3 className="text-xs font-bold text-primary flex items-center gap-2 border-b border-subtle pb-2">
                            <Lock className="w-4 h-4 text-primary-default" /> اطلاعات حساب کاربری (جهت ورود)
                          </h3>

                          <div>
                            <label className="block text-xs font-black text-secondary mb-1.5">نام کاربری اختصاصی (Username) *</label>
                            <input
                              type="text"
                              required
                              value={storeData.username}
                              onChange={(e) => setStoreData({ ...storeData, username: e.target.value })}
                              placeholder="مثال: store_arya"
                              className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                              style={{ direction: "ltr" }}
                            />
                            {storeErrors.username && <p className="text-[10px] text-danger mt-1">{storeErrors.username}</p>}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">کلمه عبور *</label>
                              <input
                                type="password"
                                required
                                value={storeData.password}
                                onChange={(e) => setStoreData({ ...storeData, password: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                                style={{ direction: "ltr" }}
                              />
                              {storeErrors.password && <p className="text-[10px] text-danger mt-1">{storeErrors.password}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-black text-secondary mb-1.5">تکرار کلمه عبور *</label>
                              <input
                                type="password"
                                required
                                value={storeData.confirmPassword}
                                onChange={(e) => setStoreData({ ...storeData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                                style={{ direction: "ltr" }}
                              />
                              {storeErrors.confirmPassword && <p className="text-[10px] text-danger mt-1">{storeErrors.confirmPassword}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 justify-between items-center mt-6">
                          <button
                            type="button"
                            onClick={() => setStoreStep(2)}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all text-xs cursor-pointer font-bold"
                          >
                            مرحله قبل
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm disabled:opacity-50"
                          >
                            {loading ? "در حال پردازش..." : "تکمیل ثبت‌نام و فعال‌سازی فروشگاه"}
                          </button>
                          <button
                            type="button"
                            onClick={saveStoreDraft}
                            className="px-4 py-3 border hover:bg-surface text-secondary font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Database className="w-4 h-4" /> ذخیره پیش‌نویس
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
            
            {view === "referrer_form" && (
              <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in text-right">
                <div className="bg-card border border-border-subtle p-8 rounded-3xl shadow-xl shadow-primary-default/5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-subtle">
                    <div>
                      <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                        <ZopitLogo size="sm" />
                        ثبت‌نام بازاریاب (معرف)
                      </h2>
                    </div>
                    <button
                      onClick={() => setView("role_select")}
                      className="p-2 bg-surface hover:bg-border text-secondary rounded-full transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleReferrerRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">نام *</label>
                        <input
                          type="text"
                          required
                          value={refForm.firstName}
                          onChange={(e) => setRefForm({ ...refForm, firstName: e.target.value })}
                          className="w-full px-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">نام خانوادگی *</label>
                        <input
                          type="text"
                          required
                          value={refForm.lastName}
                          onChange={(e) => setRefForm({ ...refForm, lastName: e.target.value })}
                          className="w-full px-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-black text-secondary mb-1.5">شماره موبایل *</label>
                      <input
                        type="tel"
                        required
                        value={refForm.mobile}
                        onChange={(e) => setRefForm({ ...refForm, mobile: e.target.value })}
                        className="w-full px-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                        style={{ direction: "ltr" }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-black text-secondary mb-1.5">ایمیل *</label>
                      <input
                        type="email"
                        required
                        value={refForm.email}
                        onChange={(e) => setRefForm({ ...refForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                        style={{ direction: "ltr" }}
                      />
                    </div>

                    <hr className="my-6 border-t border-border-subtle" />

                    <div>
                      <label className="block text-xs font-black text-secondary mb-1.5">نام کاربری اختصاصی (Username) *</label>
                      <input
                        type="text"
                        required
                        value={refForm.username}
                        onChange={(e) => setRefForm({ ...refForm, username: e.target.value })}
                        className="w-full px-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                        style={{ direction: "ltr" }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">کلمه عبور *</label>
                        <input
                          type="password"
                          required
                          value={refForm.password}
                          onChange={(e) => setRefForm({ ...refForm, password: e.target.value })}
                          className="w-full px-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                          style={{ direction: "ltr" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-secondary mb-1.5">تکرار کلمه عبور *</label>
                        <input
                          type="password"
                          required
                          value={refForm.password}
                          onChange={(e) => setRefForm({ ...refForm, password: e.target.value })}
                          className="w-full px-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary-default font-mono text-left"
                          style={{ direction: "ltr" }}
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-default hover:bg-primary-hover text-inverse font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                      >
                        {loading ? "در حال پردازش..." : "ثبت‌نام به عنوان بازاریاب (معرف)"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          {/* Discreet Footer with Logo and subtle Enamad at bottom of dotted canvas */}
          <EnamadBadge variant="subtle_footer" />
        </main>
        )}
      </div>

      {/* Terms & Conditions Popup Modal on Login/Entry */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" dir="rtl">
          <div className="bg-card w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-subtle flex flex-col overflow-hidden animate-scale-up">
            <div className="p-6 bg-surface/80 border-b border-subtle flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-default/10 rounded-2xl text-primary-default">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary">
                    قوانین و ضوابط عمومی و اختصاصی سامانه
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    مقررات و دستورالعمل‌های فعالیت در زوپیت
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTermsModal(null)}
                className="p-2 hover:bg-surface rounded-full text-muted hover:text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-secondary leading-relaxed flex-1">
              <div className="p-4 bg-primary-default/5 border border-primary-default/20 rounded-2xl text-xs text-primary leading-relaxed">
                <strong>توجه مهم:</strong> ورود و ادامه فعالیت در سامانه زوپیت به منزله مطالعه کامل، آگاهی دقیق و پذیرش تمامی بندهای قوانین و مقررات ذیل می‌باشد.
              </div>

              {showTermsModal === "supplier" || showTermsModal === "SUPPLIER" ? (
                <div className="space-y-3 text-xs leading-loose text-primary">
                  {supplierTermsText ? (
                    <p className="whitespace-pre-line">{supplierTermsText}</p>
                  ) : (
                    <>
                      <h4 className="font-bold text-sm text-primary">آیین‌نامه و ضوابط اختصاصی تامین‌کنندگان:</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li><strong>صحت اطلاعات و اصالت کالا:</strong> تامین‌کننده متعهد است تمامی کالاهای ثبت شده دارای اصالت کامل، استانداردهای قانونی و گارانتی معتبر باشند.</li>
                        <li><strong>تامین و تحویل به‌موقع:</strong> تامین‌کننده موظف است پس از ثبت سفارش توسط خریدار، ظرف مهلت مقرر (حداکثر ۴۸ ساعت) کالا را تحویل انبار یا پست نماید.</li>
                        <li><strong>قیمت‌گذاری شفاف:</strong> قیمت‌های ثبت شده باید رقابتی و مطابق با نرخ مصوب باشد. ایجاد قیمت‌های غیرواقعی ممنوع است.</li>
                        <li><strong>مدیریت موجودی:</strong> عدم موجودی کالاهای فعال منجر به کسر امتیاز تامین‌کننده و جرایم تاخیر طبق مصوبات سامانه خواهد شد.</li>
                        <li><strong>تسویه حساب:</strong> تسویه حساب‌ها بر اساس چرخه منظم مالی و پس از تایید تحویل کالا به خریدار به شماره شبا ثبت شده واریز می‌گردد.</li>
                      </ol>
                    </>
                  )}
                </div>
              ) : showTermsModal === "store" || showTermsModal === "STORE_MANAGER" ? (
                <div className="space-y-3 text-xs leading-loose text-primary">
                  {storeTermsText ? (
                    <p className="whitespace-pre-line">{storeTermsText}</p>
                  ) : (
                    <>
                      <h4 className="font-bold text-sm text-primary">ضوابط و شرایط مدیران فروشگاه‌ها:</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>پاسخگویی به‌موقع به مشتریان و خریداران نهایی.</li>
                        <li>رعایت اخلاق حرفه‌ای در ارائه خدمات و فروش اقساطی/نقدی.</li>
                        <li>امانت‌داری در حفظ اطلاعات مشتریان و تسویه‌های مالی.</li>
                      </ol>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs leading-loose text-primary">
                  <h4 className="font-bold text-sm text-primary">قوانین و شرایط عمومی سامانه:</h4>
                  <p>
                    کلیه کاربران، تامین‌کنندگان و فروشگاه‌ها موظف به رعایت قوانین جمهوری اسلامی ایران، آیین‌نامه‌های تجارت الکترونیک و ضوابط اخلاقی زوپیت می‌باشند.
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 bg-surface/50 border-t border-subtle flex justify-end items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const userId = currentUser?.id || currentUser?.username || "default";
                  localStorage.setItem(`terms_accepted_${userId}`, "true");
                  setShowTermsModal(null);
                  showNotification("قوانین و ضوابط تایید گردید.", "success");
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> متوجه شدم و می‌پذیرم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA / MOBILE APP INSTALL MODAL */}
      {showIosPwaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-indigo-500/30 text-white rounded-[2.5rem] max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">نصب وب‌اپلیکیشن زوپیت (PWA)</h3>
                  <p className="text-[11px] text-indigo-200">دسترسی سریع و آفلاین روی گوشی موبایل</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosPwaModal(false)}
                className="p-2 text-indigo-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs text-indigo-100">
              {/* Direct Install Button if supported */}
              {deferredPrompt && (
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl space-y-2">
                  <p className="font-bold text-emerald-300 text-xs">درگاه نصب مستقیم شناسایی شد!</p>
                  <button
                    type="button"
                    onClick={handleInstallPwa}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg transition cursor-pointer text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    نصب فوری اپلیکیشن زوپیت با یک کلیک
                  </button>
                </div>
              )}

              {/* iOS Guide */}
              <div className="bg-indigo-950/60 border border-indigo-500/20 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-black text-amber-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  راهنمای نصب روی آیفون (iOS / Safari):
                </div>
                <ol className="space-y-2 text-[11px] text-indigo-200 list-decimal list-inside leading-relaxed">
                  <li>در مرورگر Safari دکمه <strong className="text-white font-extrabold inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-blue-400 inline" /> Share (اشتراک‌گذاری)</strong> در پایین صفحه را لمس کنید.</li>
                  <li>در منوی باز شده گزینه <strong className="text-white font-extrabold inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.</li>
                  <li>در گوشه بالا روی دکمه <strong className="text-emerald-400 font-extrabold">Add</strong> بزنید. اپلیکیشن زوپیت روی صفحه گوشی شما قرار خواهد گرفت.</li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="bg-slate-950/60 border border-white/10 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-black text-emerald-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  راهنمای نصب روی اندروید (Chrome / Firefox / Edge):
                </div>
                <ol className="space-y-2 text-[11px] text-indigo-200 list-decimal list-inside leading-relaxed">
                  <li>روی سه نقطه بالای مرورگر کلیک کنید.</li>
                  <li>گزینه <strong className="text-white font-extrabold">نصب اپلیکیشن (Install App)</strong> یا <strong className="text-white font-extrabold">افزودن به صفحه اصلی</strong> را لمس کنید.</li>
                  <li>تایید کنید تا آیکون زوپیت مانند اپلیکیشن‌های بازار مستقیم نصب شود.</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosPwaModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer text-xs"
              >
                متوجه شدم و بستن
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalModals />
      <GlobalToast />
    </>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  return <MyPanel currentUser={currentUser} setCurrentUser={setCurrentUser} />;
}

