import React, { useState, useEffect, useRef } from "react";
import {
  Crown,
  CheckCircle2,
  Shield,
  Zap,
  Gift,
  Globe,
  Server,
  PackageCheck,
  CreditCard,
  Puzzle,
  TrendingUp,
  Sparkles,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  PenTool,
  BadgePercent
} from "lucide-react";
import { toast } from "../GlobalToast";

interface StoreProAccountProps {
  user?: any;
  showNotification?: (message: string, type: "success" | "error") => void;
  onNavigateTab?: (tab: string) => void;
}

export function StoreProAccount({ user, showNotification, onNavigateTab }: StoreProAccountProps) {
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    autoApprove: true,
    proAccountPrice: 0,
    hostRenewalPrice: 500000,
    hostDiscountedPrice: 198000,
    torobPrice: 150000,
    promoCode: "ZOPIT-PRO-198",
    termsContent: ""
  });

  // Registration form states
  const [fullName, setFullName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Captcha state
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(4);
  const [captchaInput, setCaptchaInput] = useState("");

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Visibility toggles for passwords
  const [showCpanelPass, setShowCpanelPass] = useState(false);
  const [showWpPass, setShowWpPass] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [renewingHost, setRenewingHost] = useState(false);
  const [payingTorob, setPayingTorob] = useState(false);

  useEffect(() => {
    fetchProStatus();
    resetCaptcha();
  }, []);

  useEffect(() => {
    if (user) {
      const userFullName =
        (user.firstName || user.lastName
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
          : user.fullName || user.storeName || "");
      if (userFullName) setFullName(userFullName);
      if (user.nationalCode) setNationalCode(user.nationalCode);
      if (user.mobile) setMobile(user.mobile);
    }
  }, [user]);

  const resetCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setNum1(a);
    setNum2(b);
    setCaptchaInput("");
  };

  const fetchProStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/pro/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProAccount(data.proAccount);
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Error fetching pro status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Canvas Coordinates Helper
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Canvas Signature Handlers with Pointer Events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#10b981"; // emerald color
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const autoGenerateSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#10b981";
    ctx.font = "italic bold 22px Tahoma, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const nameToDraw = fullName.trim() || "امضای دیجیتال کاربر";
    ctx.fillText(nameToDraw, canvas.width / 2, canvas.height / 2 - 10);

    // Decorative underline
    ctx.beginPath();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.moveTo(canvas.width / 2 - 100, canvas.height / 2 + 15);
    ctx.quadraticCurveTo(canvas.width / 2, canvas.height / 2 + 30, canvas.width / 2 + 100, canvas.height / 2 + 15);
    ctx.stroke();

    setHasSignature(true);
    if (showNotification) showNotification("امضای دیجیتال خودکار ثبت شد", "success");
    else toast("امضای دیجیتال خودکار ثبت شد", "success");
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    if (showNotification) showNotification("کپی شد", "success");
    else toast("کپی شد", "success");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !nationalCode.trim() || !mobile.trim()) {
      const msg = "لطفا نام و نام خانوادگی، کد ملی و شماره همراه را وارد نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (!hasSignature) {
      const msg = "لطفا قرارداد را امضا نمایید (کشیدن امضا با دست/ماوس در کادر مربوطه).";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (parseInt(captchaInput, 10) !== num1 + num2) {
      const msg = "کد امنیتی (کپچا) اشتباه است. لطفاً دوباره تلاش کنید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      resetCaptcha();
      return;
    }

    if (!termsAccepted) {
      const msg = "لطفاً تیک پذیرش قوانین و قرارداد را فعال نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    const canvas = canvasRef.current;
    const signatureImage = canvas ? canvas.toDataURL("image/png") : "";

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/pro/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          nationalCode,
          mobile,
          signatureImage
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (showNotification) showNotification(data.message, "success");
        else toast(data.message, "success");
        fetchProStatus();
      } else {
        if (showNotification) showNotification(data.error || "خطا در ثبت نام", "error");
        else toast(data.error || "خطا در ثبت نام", "error");
      }
    } catch (err: any) {
      const msg = err.message || "خطا در ارتباط با سرور";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewHost = async () => {
    setRenewingHost(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/pro/renew-host", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.payLink) {
        window.location.href = data.payLink;
      } else {
        const msg = data.error || "خطا در انتقال به درگاه پرداخت";
        if (showNotification) showNotification(msg, "error");
        else toast(msg, "error");
      }
    } catch (err: any) {
      const msg = err.message || "خطا در پرداخت";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
    } finally {
      setRenewingHost(false);
    }
  };

  const handlePayTorob = async () => {
    setPayingTorob(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/pro/pay-torob", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.payLink) {
        window.location.href = data.payLink;
      } else {
        const msg = data.error || "خطا در ایجاد لینک پرداخت ترب";
        if (showNotification) showNotification(msg, "error");
        else toast(msg, "error");
      }
    } catch (err: any) {
      const msg = err.message || "خطا در پرداخت ترب";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
    } finally {
      setPayingTorob(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <p className="text-sm font-bold text-muted">در حال بارگذاری اطلاعات اکانت پرو...</p>
      </div>
    );
  }

  const isProApproved = proAccount && (proAccount.status === "APPROVED" || proAccount.status === "ACTIVE");

  const proFeaturesList = [
    {
      id: 1,
      title: "دامنه رایگان اختصاصی (.ir)",
      desc: "یک دامنه ملی رایگان جهت برندسازی و اعتبار وب‌سایت فروشگاه شما",
      value: "100,000 تومان",
      icon: Globe,
      color: "from-blue-500/20 to-blue-600/5 text-blue-500"
    },
    {
      id: 2,
      title: "قالب آماده حرفه‌ای وردپرس (وودمارت / WoodMart)",
      desc: "طراحی کاملا سفارشی‌سازی شده، آماده فروش و واکنش‌گرا (مخصوص فروشگاهی)",
      value: "2,000,000 تومان",
      icon: LayoutDashboardIcon,
      color: "from-purple-500/20 to-purple-600/5 text-purple-500"
    },
    {
      id: 3,
      title: "هاست رایگان ۱ ماهه ابری",
      desc: "میزبانی پرسرعت اختصاصی برای بارگذاری اولیه بدون دغدغه فنی",
      value: "500,000 تومان",
      icon: Server,
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-500"
    },
    {
      id: 4,
      title: "پنل اختصاصی لجستیک و پست",
      desc: "مدیریت خودکار ثبت سفارشات پستی، چاپ فاکتور و شناسه مرسولات",
      value: "998,000 تومان",
      icon: PackageCheck,
      color: "from-amber-500/20 to-amber-600/5 text-amber-500"
    },
    {
      id: 5,
      title: "راه‌اندازی درگاه، پرونده مالیاتی و آموزش کامل",
      desc: "قابلیت انجام کامل توسط تیم فنی زوپیت یا ارسال دوره‌های ویدئویی آموزشی (به انتخاب شما)",
      value: "1,500,000 تومان",
      icon: CreditCard,
      color: "from-pink-500/20 to-pink-600/5 text-pink-500"
    },
    {
      id: 6,
      title: "افزونه‌های ۱۰۰٪ رایگان و کاربردی وردپرس",
      desc: "پکیج کامل افزونه‌های ضروری امنیت، سئو، پیامک و بهینه‌سازی سرعت",
      value: "1,200,000 تومان",
      icon: Puzzle,
      color: "from-cyan-500/20 to-cyan-600/5 text-cyan-500"
    },
    {
      id: 7,
      title: "اتصال به موتورهای جستجوی کالا (ترب و ایمالز)",
      desc: "اتصال به یکی از قوی‌ترین کانال‌های جذب مشتری و افزایش فوری فروش آنلاین",
      value: "750,000 تومان",
      icon: TrendingUp,
      color: "from-indigo-500/20 to-indigo-600/5 text-indigo-500"
    },
    {
      id: 8,
      title: "دسترسی رایگان به استارتاپ‌های آینده زوپیت",
      desc: "عضویت ویژه و دسترسی بدون هزینه به تمامی سرویس‌ها و ابزارهای جدید آتی مجموعه",
      value: "1,500,000 تومان",
      icon: Sparkles,
      color: "from-violet-500/20 to-violet-600/5 text-violet-500"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12" dir="rtl">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute -top-12 -left-12 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
              <Crown className="w-4 h-4 text-emerald-400" />
              <span>اشتراک طلایی مدیران فروشگاه زوپیت</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              اکانت پرو زوپیت (Zopit Pro Account)
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              مجموعه‌ای بی‌نظیر از ۸ خدمت و پکیج کلیدی جهت راه‌اندازی، توسعه و جهش فروش آنلاین فروشگاه شما
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 text-center shrink-0 w-full md:w-auto">
            <span className="text-xs text-slate-400 block mb-1">ارزش کل خدمات پکیج پرو:</span>
            <div className="text-sm text-slate-400 line-through font-mono decoration-rose-500 decoration-2">
              ۸,۵۴۸,۰۰۰ تومان
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
              <span>کاملاً رایگان!</span>
              <span className="text-xs font-normal text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                (در حال حاضر)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* IF ALREADY APPROVED / ACTIVE PRO ACCOUNT */}
      {isProApproved ? (
        <div className="space-y-8">
          {/* Status Badge */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <span>اکانت پرو شما فعال می‌باشد</span>
                  <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                    ACTIVE PRO
                  </span>
                </h3>
                <p className="text-xs text-muted mt-1">
                  شما هم‌اکنون به تمامی امکانات پکیج پرو زوپیت دسترسی کامل دارید.
                </p>
              </div>
            </div>
            {proAccount.createdAt && (
              <span className="text-xs font-mono text-muted bg-surface px-3 py-1.5 rounded-xl border border-subtle">
                تاریخ فعال‌سازی: {new Date(proAccount.createdAt).toLocaleDateString("fa-IR")}
              </span>
            )}
          </div>

          {/* Credentials Card */}
          <div className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-emerald-500" />
                <h2 className="text-lg font-black text-primary">اطلاعات هاست و دسترسی‌های اختصاصی شما</h2>
              </div>
              <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                تخصیص یافته
              </span>
            </div>

            {proAccount.domainName || proAccount.cpanelUrl || proAccount.wpAdminUrl ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Domain Card */}
                <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-500" /> دامنه اختصاصی:
                    </span>
                    {proAccount.domainName && (
                      <a
                        href={`https://${proAccount.domainName}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-mono"
                      >
                        باز کردن <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="font-mono font-black text-sm text-primary dir-ltr text-right truncate">
                    {proAccount.domainName || "در حال ثبت توسط پشتیبانی..."}
                  </p>
                </div>

                {/* cPanel Access Card */}
                <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-amber-500" /> ورود به cPanel:
                    </span>
                    {proAccount.cpanelUrl && (
                      <a
                        href={proAccount.cpanelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-mono"
                      >
                        ورود به کنترل‌پنل <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs font-mono dir-ltr text-right">
                    <div className="flex justify-between items-center bg-card p-2 rounded-lg border border-subtle">
                      <span className="text-muted">User:</span>
                      <span className="font-bold text-primary">{proAccount.cpanelUsername || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center bg-card p-2 rounded-lg border border-subtle">
                      <span className="text-muted">Pass:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {showCpanelPass ? proAccount.cpanelPassword || "—" : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCpanelPass(!showCpanelPass)}
                          className="text-muted hover:text-primary"
                        >
                          {showCpanelPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WP Admin Access Card */}
                <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-500" /> وردپرس (WP Admin):
                    </span>
                    {proAccount.wpAdminUrl && (
                      <a
                        href={proAccount.wpAdminUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-500 hover:underline flex items-center gap-1 font-mono"
                      >
                        ورود به مدیریت <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs font-mono dir-ltr text-right">
                    <div className="flex justify-between items-center bg-card p-2 rounded-lg border border-subtle">
                      <span className="text-muted">User:</span>
                      <span className="font-bold text-primary">{proAccount.wpUsername || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center bg-card p-2 rounded-lg border border-subtle">
                      <span className="text-muted">Pass:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {showWpPass ? proAccount.wpPassword || "—" : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowWpPass(!showWpPass)}
                          className="text-muted hover:text-primary"
                        >
                          {showWpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-center space-y-2">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  در حال آماده‌سازی و کانفیگ هاست اختصاصی شما توسط دپارتمان پشتیبانی...
                </p>
                <p className="text-xs text-muted">
                  اطلاعات ورود به cPanel و وردپرس به محض تکمیل در این بخش نمایش داده خواهد شد.
                </p>
              </div>
            )}
          </div>

          {/* RENEWALS AND SERVICES SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Host Renewal Card */}
            <div className="bg-card border border-border-subtle rounded-3xl p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <Server className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-black text-primary text-base">تمدید هاست ماهانه</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  ماه اول رایگان بود
                </span>
              </div>

              {/* Promo Discount Code Banner */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BadgePercent className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-primary block">کد تخفیف ویژه تمدید هاست:</span>
                    <span className="text-[11px] text-muted">تخفیف ویژه برای فروشگاه‌های برتر زوپیت</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(settings.promoCode || "ZOPIT-PRO-198", "promo")}
                  className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl font-mono font-black hover:bg-emerald-400 transition-colors flex items-center gap-1"
                >
                  {settings.promoCode || "ZOPIT-PRO-198"}
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs text-muted block mb-1">هزینه تمدید ۱ ماهه هاست:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted line-through font-mono">
                      {settings.hostRenewalPrice?.toLocaleString("fa-IR")} تومان
                    </span>
                    <span className="text-xl font-black text-emerald-500 font-mono">
                      {settings.hostDiscountedPrice?.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRenewHost}
                  disabled={renewingHost}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 text-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {renewingHost ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  <span>پرداخت و تمدید آنلاین</span>
                </button>
              </div>
            </div>

            {/* Torob Service Connection Card (Coming Soon) */}
            <div className="bg-card border border-border-subtle rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-black text-primary text-base">اتصال اختصاصی به ترب (Torob)</h3>
                </div>
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  به زودی راه‌اندازی می‌شود
                </span>
              </div>

              <div className="bg-surface p-4 rounded-2xl border border-subtle space-y-2 text-right">
                <p className="text-xs text-secondary leading-relaxed font-medium">
                  اتصال خودکار به موتور جستجوی ترب به زودی در اپدیت‌های جدید پلتفرم زوپیت اضافه می‌گردد. در حال حاضر نیاز به هیچ اقدامی از سمت شما نمی‌باشد.
                </p>
                <div className="text-[11px] text-muted flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>تیم فنی در حال فراهم‌سازی سرویس هوشمند اتصال مستقیم محصولات است.</span>
                </div>
              </div>
            </div>

            {/* Direct Ticket Support Section */}
            <div className="bg-card border border-border-subtle rounded-3xl p-6 space-y-4 shadow-xl col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-black text-primary text-base">پشتیبانی و راهنمایی مستقیم مدیران پرو</h3>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  پاسخگویی مستقیم مدیر کل
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
                <div className="text-right">
                  <h4 className="font-black text-sm text-primary">نیاز به راهنمایی، سوال یا مشاوره دارید؟</h4>
                  <p className="text-xs text-muted mt-1">
                    مشکل یا درخواست خود را در قالب تیکت ارسال کنید تا مدیر کل پلتفرم مستقیماً شما را راهنمایی کند.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) {
                      onNavigateTab("tickets");
                      if (showNotification) showNotification("انتقال به بخش تیکت‌های پشتیبانی...", "success");
                    } else {
                      toast("لطفاً از منوی کناری وارد بخش تیکت‌ها شوید.", "info");
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>ثبت تیکت پشتیبانی و درخواست راهنمایی پرو</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* REGISTRATION & PROMOTIONAL VIEW */
        <div className="space-y-8">
          {/* Zopit Expectation Box */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-right space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-base">
              <TrendingUp className="w-5 h-5 shrink-0" />
              <span>انتظار شبکه زوپیت از مدیران فروشگاه پرو:</span>
            </div>
            <p className="text-xs md:text-sm text-secondary leading-relaxed font-medium">
              در قبال اعطای این ۸ خدمت ارزشمند و هدیه رایگان (که همگی جهت رشد و توسعه کسب‌وکار شما آماده شده‌اند)، شبکه زوپیت از شما انتظار دارد که تمامی تلاش خود را جهت <strong className="text-primary font-black">افزایش فروش آنلاین و ثبت و ارسال سفارشات بیشتر در پلتفرم</strong> بکار گیرید تا یک همکاری برد-برد بلندمدت شکل گیرد.
            </p>
          </div>

          {/* 8 Feature Cards Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>۸ خدمت و هدیه استثنایی اکانت پرو:</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {proFeaturesList.map((item) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={item.id}
                    className="bg-card border border-border-subtle rounded-2xl p-5 hover:border-emerald-500/40 transition-all shadow-md flex flex-col justify-between space-y-4 relative group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-mono text-muted bg-surface px-2 py-0.5 rounded-lg border border-subtle">
                          خدمت #{item.id}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-primary leading-snug">{item.title}</h3>
                      <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                      <span className="text-[11px] text-muted">ارزش واقعى:</span>
                      <span className="text-xs font-mono font-bold text-rose-500 line-through decoration-rose-500">
                        {item.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REGISTRATION & CONTRACT FORM SECTION */}
          <div className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-primary flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-500" />
                  <span>فرم ثبت‌نام و امضای دیجیتال قرارداد پرو</span>
                </h2>
                <p className="text-xs text-muted mt-1">
                  جهت دریافت و فعال‌سازی این ۸ خدمت، لطفاً مشخصات را تایید و قرارداد زیر را امضا نمایید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="px-4 py-2 bg-surface hover:bg-subtle text-primary border border-subtle rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>مشاهده کامل متن قرارداد</span>
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Profile Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-secondary">
                      نام و نام خانوادگی مدیر فروشگاه <span className="text-rose-500">*</span>
                    </label>
                    {fullName && (
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ثبت شده در سیستم
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                    className={`w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium ${user?.firstName || user?.lastName || user?.fullName ? "opacity-70 cursor-not-allowed text-muted" : "text-primary"}`}
                    required
                    readOnly={!!(user?.firstName || user?.lastName || user?.fullName)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-secondary">
                      کد ملی <span className="text-rose-500">*</span>
                    </label>
                    {nationalCode && (
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ثبت شده در سیستم
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={nationalCode}
                    onChange={(e) => setNationalCode(e.target.value)}
                    placeholder="۱۰ رقم کد ملی"
                    maxLength={10}
                    className={`w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${user?.nationalCode ? "opacity-70 cursor-not-allowed text-muted" : "text-primary"}`}
                    required
                    readOnly={!!user?.nationalCode}
                  />
                </div>
              </div>

              {/* Digital Signature Canvas Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-secondary flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-emerald-500" />
                    <span>کادر امضای دیجیتال (با لمس، ماوس یا دکمه خودکار) <span className="text-rose-500">*</span>:</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={autoGenerateSignature}
                      className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" /> امضای خودکار با هویت دیجیتال
                    </button>

                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> پاکسازی
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-emerald-500/40 rounded-2xl bg-surface p-2 relative text-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="w-full h-36 touch-none cursor-crosshair bg-background rounded-xl border border-subtle"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted text-xs p-4">
                      <span>انگشت یا ماوس خود را در این کادر جهت ثبت امضا بکشید</span>
                      <span className="text-[10px] text-emerald-500 mt-1 font-bold">یا دکمه «امضای خودکار با هویت دیجیتال» را بفشارید</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Captcha & Terms Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                {/* Math Captcha with High Contrast */}
                <div className="bg-surface p-3.5 rounded-2xl border border-subtle flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-secondary whitespace-nowrap">کد امنیتی:</span>
                  <div className="bg-slate-900 border-2 border-emerald-500/50 text-emerald-400 font-mono font-black text-base px-4 py-1.5 rounded-xl shadow-inner tracking-widest flex items-center gap-2">
                    <span className="text-emerald-300 font-extrabold">{num1}</span>
                    <span className="text-emerald-500 font-bold">+</span>
                    <span className="text-emerald-300 font-extrabold">{num2}</span>
                    <span className="text-emerald-500 font-bold">=</span>
                  </div>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="پاسخ"
                    className="w-20 px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={resetCaptcha}
                    className="text-muted hover:text-primary cursor-pointer p-1"
                    title="تغییر سوال"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Terms Agreement Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer bg-surface p-3.5 rounded-2xl border border-subtle">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-bold text-primary leading-relaxed">
                    تمام بندها و شرایط قرارداد اکانت پرو زوپیت را مطالعه نموده و می‌پذیرم.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 text-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5 fill-slate-950" />
                  )}
                  <span>ثبت و فعال‌سازی فوری اکانت پرو زوپیت</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract & Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-subtle rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-black text-primary text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>متن قرارداد و قوانین رسمی اکانت پرو زوپیت</span>
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-muted hover:text-primary p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs leading-relaxed text-secondary space-y-4 text-justify">
              {settings.termsContent ? (
                <div className="whitespace-pre-wrap font-sans text-secondary leading-relaxed">
                  {settings.termsContent}
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-sans text-secondary leading-relaxed space-y-4">
                  <h4 className="font-bold text-primary text-center text-sm mb-4">
                    «قرارداد ارائه خدمات اکانت ویژه (Pro) و واگذاری مشروط زیرساخت فروشگاهی»
                  </h4>

                  <div>
                    <strong className="text-primary">ماده ۱: طرفین قرارداد</strong>
                    <p>این قرارداد در تاریخ ................... فیمابین پلتفرم زوپیت به مدیریت ................... که در این قرارداد «مجری/پلتفرم» نامیده می‌شود از یک سو، و مدیر فروشگاه متقاضی که در این قرارداد «فروشنده/کارفرما» نامیده می‌شود، با شرایط و تکالیف ذیل منعقد می‌گردد.</p>
                  </div>

                  <div>
                    <strong className="text-primary">ماده ۲: موضوع قرارداد</strong>
                    <p>ارائه پکیج جامع راه‌اندازی و مدیریت فروشگاه آنلاین (اکانت پرو)، شامل تامین زیرساخت‌های نرم‌افزاری (هاست و دامنه اختصاصی ir.)، نصب و پیکربندی سیستم مدیریت محتوا (قالب وودمارت)، انجام امور اداری و قانونی (اخذ اینماد، درگاه پرداخت، پرونده مالیاتی)، اتصال به موتورهای جستجوی کالا (ترب) و ارائه خدمات لجستیک، در ازای تعهد فروشنده به تامین کالا و حفظ حداقل سقف فروش ماهانه.</p>
                  </div>

                  <div>
                    <strong className="text-primary">ماده ۳: مدت قرارداد</strong>
                    <p>مدت این قرارداد از تاریخ امضا به مدت یک سال شمسی می‌باشد و در صورت توافق طرفین و احراز شرایط مندرج در ماده ۵، به‌صورت خودکار قابل تمدید است.</p>
                  </div>

                  <div>
                    <strong className="text-primary">ماده ۴: تعهدات و خدمات مجری (پلتفرم)</strong>
                    <p>۱-۴. زیرساخت وب: ثبت یک عدد دامنه ir. متناسب با نام فروشگاه و تخصیص فضای میزبانی (هاست). هزینه هاست برای ماه اول رایگان بوده و برای ماه‌های آتی با درصد تخفیف ویژه برای فروشنده محاسبه خواهد شد.</p>
                    <p>۲-۴. طراحی و پیکربندی: نصب وردپرس، راه‌اندازی قالب فروشگاهی وودمارت (Woodmart) و نصب افزونه‌های رایگان و ضروری جهت عملکرد صحیح سایت.</p>
                    <p>۳-۴. امور حقوقی و مالی: انجام تمامی رویه‌های اداری شامل تشکیل پرونده مالیاتی، ثبت‌نام و اخذ نماد اعتماد الکترونیکی (اینماد) و دریافت درگاه پرداخت اینترنتی به نام فروشنده.</p>
                    <p>۴-۴. بازاریابی و توسعه فروش: انجام تنظیمات فنی جهت اتصال و همگام‌سازی محصولات فروشگاه با موتور جستجوی ترب و پلتفرم‌های مشابه.</p>
                    <p>۵-۴. لجستیک: تامین زیرساخت‌های ارسال و پردازش سفارشات از طریق سیستم یکپارچه پلتفرم و استارتاپ‌های همکار.</p>
                  </div>

                  <div>
                    <strong className="text-primary">ماده ۵: تعهدات فروشنده و شرایط احراز حد نصاب فروش (تارگت)</strong>
                    <p>۱-۵. فروشنده متعهد است همواره موجودی کالاها و قیمت آنها را در سایت به‌روز نگه دارد و سفارشات ثبت‌شده را در سریع‌ترین زمان ممکن برای بخش لجستیک آماده‌سازی کند.</p>
                    <p>۲-۵. حد نصاب فروش: فروشنده متعهد می‌گردد که از ماه دوم شروع به کار، حداقل تعداد مشخصی سفارش موفق یا مبلغ مشخصی فروش خالص در هر ماه تقویمی داشته باشد.</p>
                    <p>۳-۵. پرداخت هزینه‌های ماهانه تمدید هاست (با احتساب تخفیف ماده ۴) در موعد مقرر بر عهده فروشنده است.</p>
                    <p>۴-۵. فروشنده موظف به رعایت کلیه قوانین تجارت الکترونیک جمهوری اسلامی ایران بوده و مسئولیت حقوقی فروش کالای قاچاق، غیرمجاز یا معیوب منحصراً بر عهده وی می‌باشد.</p>
                  </div>

                  <div>
                    <strong className="text-primary">ماده ۶: شرایط اختصاصی مالکیت دامنه (بند مشروط)</strong>
                    <p>۱-۶. با توجه به قوانین ثبت دامنه در مرکز ایرنیک، دامنه موضوع این قرارداد در ابتدا توسط پلتفرم ثبت و راه‌اندازی می‌گردد اما در اختیار و انحصار فروشگاه خواهد بود.</p>
                    <p>۲-۶. انتقال قطعی: در صورتی که فروشنده بتواند برای ماه‌های متوالی حد نصاب فروش (مندرج در بند ۲-۵) را با موفقیت محقق سازد، مالکیت صددرصدی و حقوقی دامنه به شناسه ایرنیک فروشنده منتقل خواهد شد.</p>
                    <p>۳-۶. استرداد و سلب امتیاز: چنانچه فروشنده در هر ماه از رسیدن به حداقل حد نصاب فروش باز بماند یا فعالیت فروشگاه را متوقف کند، پلتفرم این اختیار و حقِ غیرقابل‌فسخ را دارد که قرارداد اکانت پرو را لغو کرده، خدمات هاست را قطع نموده و دامنه ثبت‌شده را به مالکیت خود درآورده یا غیرفعال کند. فروشنده با تایید این قرارداد، حق هرگونه اعتراض در خصوص سلب مالکیت دامنه در صورت عدم تحقق تارگت را از خود سلب می‌نماید.</p>
                  </div>

                  <div>
                    <strong className="text-primary">ماده ۷: محرمانگی و حفظ اطلاعات</strong>
                    <p>تمامی اطلاعات مشتریان، داده‌های مالی و ساختار فنی سایت که در اختیار فروشنده قرار می‌گیرد، امانت تلقی شده و فروشنده حق واگذاری، فروش یا انتشار آنها را به اشخاص ثالث ندارد.</p>
                  </div>

                  <div>
                    <strong className="text-primary">ماده ۸: فورس ماژور و حل اختلاف</strong>
                    <p>۱-۸. در صورت بروز حوادث غیرمترقبه (قطعی سراسری اینترنت، مشکلات زیرساختی هاستینگ‌های کشوری و...) که خارج از کنترل طرفین باشد، تعهدات تا زمان رفع مشکل به حالت تعلیق در می‌آید.</p>
                    <p>۲-۸. در صورت بروز هرگونه اختلاف در تفسیر یا اجرای این قرارداد، موضوع ابتدا از طریق مذاکره مسالمت‌آمیز حل و فصل شده و در صورت عدم حصول نتیجه، مرجع صالح قضایی جهت رسیدگی تعیین می‌گردد.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border-subtle text-left">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                متوجه شدم و می‌پذیرم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon helper function
function LayoutDashboardIcon(props: any) {
  return <Crown {...props} />;
}
