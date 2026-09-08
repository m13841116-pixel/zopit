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
  BadgePercent,
  Ticket,
  Building2,
  ShieldCheck,
  Info,
  Download,
  FileArchive,
  HardDrive,
  FolderDown,
  FileCode,
  Terminal,
  FileCheck,
  Layers,
  ArrowLeft,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Timer
} from "lucide-react";
import { toast } from "../GlobalToast";
import { ProAccountMediaShowcase } from "./ProAccountMediaShowcase";
import { requestClientSideZibalPayment } from "../../services/payment/clientPaymentBridge";
import { PricingPlansTable, PlanId, BillingCycle } from "./PricingPlansTable";

interface StoreProAccountProps {
  user?: any;
  showNotification?: (message: string, type: "success" | "error") => void;
  onNavigateTab?: (tab: string) => void;
}

export function StoreProAccount({ user, showNotification, onNavigateTab }: StoreProAccountProps) {
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("PRO");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("ANNUAL");
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [renewingHost, setRenewingHost] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCpanelPass, setShowCpanelPass] = useState(false);
  const [showWpPass, setShowWpPass] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [proResources, setProResources] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    autoApprove: true,
    proAccountPrice: 189000,
    promaxAccountPrice: 299000,
    hostRenewalPrice: 900000,
    hostDiscountedPrice: 299000,
    torobPrice: 150000,
    promoCode: "ZOPIT-PRO-198",
    termsContent: ""
  });

  // Midnight countdown timer state with auto-renewal every midnight (12 شب به ۱۲ شب)
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59, 999);
      let diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        // Automatically renews for the next midnight
        target.setDate(target.getDate() + 1);
        diff = target.getTime() - now.getTime();
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Registration form states (Two-Step Wizard: Step 1 = Store Info & Admin, Step 2 = Cloud Host & Invoice)
  const [fullName, setFullName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showProTicketModal, setShowProTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("ارسال مدارک برای اکانت پرومکس");
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketAttachment, setTicketAttachment] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  
  const [hasEnamad, setHasEnamad] = useState(false);
  const [hasGateway, setHasGateway] = useState(false);
  const [hasTaxProfile, setHasTaxProfile] = useState(false);
  const [hasPostalPanel, setHasPostalPanel] = useState(false);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [logoDescription, setLogoDescription] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);

  // Discount code states
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [discountCodeText, setDiscountCodeText] = useState<string>("");
  const [isDiscountApplied, setIsDiscountApplied] = useState<boolean>(false);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);

  // Captcha state
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(4);
  const [captchaInput, setCaptchaInput] = useState("");

  const handleApplyDiscountCode = () => handleApplyDiscountCodeWithCode();
  const handleApplyDiscountCodeWithCode = async (overrideCode?: string) => {
    const code = (overrideCode || discountCodeText).trim().toUpperCase();
    if (overrideCode) setDiscountCodeText(overrideCode);
    if (!code) {
      const msg = "لطفاً کد تخفیف را وارد نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    try {
      const res = await fetch("/api/store-manager/pro/apply-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ code, planType: selectedPlan })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "کد تخفیف وارد شده معتبر نمی‌باشد.");
      }

      // Calculate applied discount amount
      const planCost = selectedPlan === 'VIP' ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) : selectedPlan === 'PRO' ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) : 259000;
      const adminServicesCost = (selectedPlan === 'STARTUP' && hasEnamad) ? 50000 : 0;
      const totalCost = planCost + adminServicesCost;
      
      let discountAmount = 0;
      if (data.discountType === 'PERCENTAGE') {
        discountAmount = Math.floor(totalCost * (data.discountValue / 100));
      } else {
        discountAmount = data.discountValue;
      }
      
      if (discountAmount > totalCost) discountAmount = totalCost;

      setAppliedDiscount(discountAmount);
      setIsDiscountApplied(true);
      const msg = `کد تخفیف ${code} با موفقیت اعمال گردید!`;
      if (showNotification) showNotification(msg, "success");
      else toast(msg, "success");
    } catch (err: any) {
      const msg = err.message || "کد تخفیف وارد شده معتبر نمی‌باشد.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      setIsDiscountApplied(false);
      setAppliedDiscount(0);
    }
  };

  // Canvas Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
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

  
  const handleSendProTicket = async () => {
    if (!ticketMsg) {
      if (showNotification) showNotification("متن پیام الزامی است.", "error");
      else toast("متن پیام الزامی است.", "error");
      return;
    }
    setSubmittingTicket(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: ticketSubject,
          department: "اکانت پرومکس",
          priority: "HIGH",
          message: ticketMsg,
          attachmentUrl: ticketAttachment || null
        }),
      });
      if (res.ok) {
        if (showNotification) showNotification("مدارک با موفقیت به پشتیبانی اکانت پرومکس ارسال شد.", "success");
        else toast("مدارک با موفقیت به پشتیبانی اکانت پرومکس ارسال شد.", "success");
        setShowProTicketModal(false);
        setTicketMsg("");
        setTicketAttachment("");
      } else {
        const data = await res.json();
        if (showNotification) showNotification(data.error || "خطا در ارسال تیکت", "error");
        else toast(data.error || "خطا در ارسال تیکت", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطای شبکه", "error");
      else toast("خطای شبکه", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const fetchProStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const [res, subRes] = await Promise.all([
        fetch("/api/store-manager/pro/status", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/store-manager/subscription/status", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (res.ok) {
        const data = await res.json();
        setProAccount(data.proAccount);
        if (data.proAccount?.planType) {
          setSelectedPlan(data.proAccount.planType as PlanId || "PRO");
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.activePromotions) {
          setActivePromotions(data.activePromotions);
        }
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionStatus(subData);
      }

      // Fetch all active public promotions from public API
      try {
        const promoRes = await fetch("/api/public/discounts/promotions");
        if (promoRes.ok) {
          const promoData = await promoRes.json();
          if (Array.isArray(promoData)) {
            setActivePromotions(promoData);
          }
        }
      } catch (pe) {}

      await fetchProResources();
    } catch (err) {
      console.error("Error fetching pro status:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProResources = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/pro/resources", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProResources(data);
      }
    } catch (e) {
      console.error("Error fetching pro resources:", e);
    }
  };

  const handleDownloadResource = (resource: any) => {
    setDownloadingId(resource.id);
    const msg = `دانلود پکیج «${resource.title}» آغاز شد.`;
    if (showNotification) showNotification(msg, "success");
    else toast(msg, "success");

    setTimeout(() => {
      try {
        if (resource.downloadUrl && (resource.downloadUrl.startsWith("http://") || resource.downloadUrl.startsWith("https://") || resource.downloadUrl.startsWith("/"))) {
          window.open(resource.downloadUrl, "_blank");
          setDownloadingId(null);
          return;
        }

        const dummyContent = `--- پلتفرم هوشمند زوپیت - پکیج اختصاصی اکانت پرومکس ---
عنوان پکیج: ${resource.title}
توضیحات: ${resource.description}
نسخه: ${resource.version || '1.0'}
حجم فایل: ${resource.fileSize || 'اختصاصی'}
پلتفرم: فروشگاه‌ساز ابری زوپیت (Zopit Cloud E-Commerce)

راهنمای سریع استفاده:
۱. وارد پیشخوان مدیریت وردپرس فروشگاه اختصاصی خود شوید.
۲. از منوی افزونه‌ها > افزودن افزونه > بارگذاری، فایل را انتخاب و فعال نمایید.
۳. درگاه‌های بانکی و وب‌سرویس پیامک به صورت خودکار متصل می‌گردند.
۴. برای پشتیبانی می‌توانید از بخش تیکت‌های پرو استفاده کنید.
`;
        const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = resource.fileType?.toLowerCase().includes("pdf") ? "pdf" : (resource.fileType?.toLowerCase().includes("xml") ? "xml" : "zip");
        a.download = `${resource.id || 'zopit-package'}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download error:", err);
      } finally {
        setDownloadingId(null);
      }
    }, 500);
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
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL("image/png"));
      setHasSignature(true);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl("");
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
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
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
      setFormStep(1);
      const msg = "لطفاً مشخصات مدیر فروشگاه را در مرحله اول تکمیل فرمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (!hasSignature && !signatureDataUrl) {
      setFormStep(1);
      const msg = "لطفاً قرارداد را در مرحله اول امضا نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (!termsAccepted) {
      setFormStep(1);
      const msg = "لطفاً تیک پذیرش قوانین و مقررات را فعال نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    const canvas = canvasRef.current;
    const signatureImage = signatureDataUrl || (canvas ? canvas.toDataURL("image/png") : "");

    const planCost = selectedPlan === 'VIP' ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) : selectedPlan === 'PRO' ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) : 259000;
    const adminServicesCost = (selectedPlan === 'STARTUP' && hasEnamad) ? 50000 : 0;
    const subtotal = planCost + adminServicesCost;
    const calculatedAmount = Math.max(0, subtotal - appliedDiscount);

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
          signatureImage,
          hasEnamad,
          hasGateway,
          hasTaxProfile,
          hasPostalPanel,
          hasCustomLogo,
          logoDescription,
          planType: selectedPlan,
          amount: calculatedAmount,
          promoCodeInput: isDiscountApplied ? discountCodeText : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.payLink) {
          window.location.assign(data.payLink);
          return;
        }
        if (data.clientPaymentRequired) {
          toast("در حال انتقال سریع به درگاه زیبال...", "info");
          const clientRes = await requestClientSideZibalPayment({
            amountInRials: data.amountInRials,
            merchant: data.merchant,
            callbackUrl: data.callbackUrl,
            description: data.description,
          });
          if (clientRes.success && clientRes.payLink) {
            window.location.assign(clientRes.payLink);
            return;
          } else {
            toast(clientRes.error || "خطا در اتصال به درگاه زیبال", "error");
          }
          return;
        }
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
        window.location.assign(data.payLink);
        return;
      } else if (res.ok && data.clientPaymentRequired) {
        toast("در حال انتقال سریع به درگاه زیبال...", "info");
        const clientRes = await requestClientSideZibalPayment({
          amountInRials: data.amountInRials,
          merchant: data.merchant,
          callbackUrl: data.callbackUrl,
          description: data.description,
        });
        if (clientRes.success && clientRes.payLink) {
          window.location.assign(clientRes.payLink);
          return;
        } else {
          toast(clientRes.error || "خطا در اتصال به درگاه پرداخت", "error");
        }
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
        window.location.assign(data.payLink);
        return;
      } else if (res.ok && data.clientPaymentRequired) {
        toast("در حال انتقال سریع به درگاه زیبال...", "info");
        const clientRes = await requestClientSideZibalPayment({
          amountInRials: data.amountInRials,
          merchant: data.merchant,
          callbackUrl: data.callbackUrl,
          description: data.description,
        });
        if (clientRes.success && clientRes.payLink) {
          window.location.assign(clientRes.payLink);
          return;
        } else {
          toast(clientRes.error || "خطا در اتصال به درگاه پرداخت", "error");
        }
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
        <p className="text-sm font-bold text-muted">در حال بارگذاری اطلاعات اکانت پرومکس...</p>
      </div>
    );
  }

  const isProApproved = proAccount && (proAccount.status === "APPROVED" || proAccount.status === "ACTIVE");

  const proFeaturesList = [
    {
      id: 1,
      title: "قالب وودمارت اورجینال اختصاصی زوپیت",
      desc: "طراحی مدرن، فوق واکنش‌گرا و بهینه‌شده برای فروش حداکثری و لود زیر ۲ ثانیه",
      value: "۲,۵۰۰,۰۰۰ تومان",
      icon: Crown,
      color: "from-amber-500/20 to-amber-600/5 text-amber-500"
    },
    {
      id: 2,
      title: "قالب فروشگاهی و اختصاصی زوپیت",
      desc: "طراحی مدرن، واکنش‌گرا و بهینه‌شده برای فروش موبایلی و لود سریع",
      value: "۲,۵۰۰,۰۰۰ تومان",
      icon: Crown,
      color: "from-amber-500/20 to-amber-600/5 text-indigo-500"
    },
    {
      id: 3,
      title: "هاست ابری فوق‌سریع اختصاصی (۱۵ گیگ SSD + ۵ هسته CPU + ۵ گیگ رم)",
      desc: "میزبانی پرسرعت NVMe SSD ابری با ۶۷٪ تخفیف اختصاصی فقط ۲۹۹ هزار تومان (ارزش اصلی ۹۰۰,۰۰۰ تومان)",
      value: "۹۰۰,۰۰۰ تومان",
      icon: Server,
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-500"
    },
    {
      id: 4,
      title: "پکیج افزونه‌های کاربردی و ضروری وردپرس",
      desc: "پکیج کامل افزونه‌های ضروری امنیت، سئو، پیامک و بهینه‌سازی سرعت",
      value: "۲,۰۰۰,۰۰۰ تومان",
      icon: Puzzle,
      color: "from-cyan-500/20 to-cyan-600/5 text-cyan-500"
    },
    {
      id: 5,
      title: "راه‌اندازی و کانفیگ کامل فروشگاه",
      desc: "راه‌اندازی کامل توسط تیم فنی زوپیت یا ارسال دوره‌های آموزشی ویدئویی (به انتخاب شما)",
      value: "۱,۷۵۰,۰۰۰ تومان",
      icon: CreditCard,
      color: "from-pink-500/20 to-pink-600/5 text-pink-500"
    },
    {
      id: 6,
      title: "سامانه و پنل پستی و لجستیک اختصاصی زوپیت",
      desc: "اتصال مستقیم به پنل پستی اختصاصی زوپیت جهت مدیریت، پیگیری و ارسال سریع مرسولات",
      value: "۹۹۸,۰۰۰ تومان",
      icon: PackageCheck,
      color: "from-purple-500/20 to-purple-600/5 text-purple-500"
    },
    {
      id: 7,
      title: "مشاوره و پشتیبانی اختصاصی کسب‌وکار",
      desc: "پشتیبانی و مشاوره تخصصی در راه‌اندازی و رشد فروشگاه شما",
      value: "۱,۸۰۰,۰۰۰ تومان",
      icon: Sparkles,
      color: "from-amber-500/20 to-amber-600/5 text-indigo-500"
    },
    {
      id: 8,
      title: "دسترسی به استارتاپ‌های آینده زوپیت (پچ طلایی)",
      desc: "عضویت ویژه و دسترسی بدون هزینه به تمامی سرویس‌ها و ابزارهای جدید آتی مجموعه",
      value: "۲,۵۰۰,۰۰۰ تومان",
      icon: Crown,
      color: "from-purple-500/20 to-purple-600/5 text-purple-500"
    },
    {
      id: 9,
      title: "اتصال به موتورهای جستجوی کالا (ترب و ایمالز)",
      desc: "اتصال به یکی از قوی‌ترین کانال‌های جذب مشتری و افزایش فوری فروش آنلاین",
      value: "۵۰۰,۰۰۰ تومان",
      icon: TrendingUp,
      color: "from-indigo-500/20 to-indigo-600/5 text-indigo-500"
    },
    {
      id: 10,
      title: "طراحی لوگوی اختصاصی برند",
      desc: "طراحی اختصاصی هویت بصری و لوگوی فروشگاه توسط تیم گرافیست زوپیت",
      value: "۱,۲۰۰,۰۰۰ تومان",
      icon: PenTool,
      color: "from-rose-500/20 to-rose-600/5 text-rose-500"
    },
    {
      id: 11,
      title: "درگاه پرداخت آنلاین بانکی",
      desc: "اخذ و کانفیگ مستقیم درگاه پرداخت الکترونیکی شتابی جهت پذیرش آنلاین سفارشات",
      value: "۵۵۰,۰۰۰ تومان",
      icon: CreditCard,
      color: "from-teal-500/20 to-teal-600/5 text-teal-500"
    },
    {
      id: 12,
      title: "تشکیل و رسیدگی به پرونده مالیاتی",
      desc: "ثبت‌نام و تشکیل پرونده در سازمان امور مالیاتی کشور جهت دریافت درگاه و اینماد",
      value: "۵۵۰,۰۰۰ تومان",
      icon: Building2,
      color: "from-blue-500/20 to-blue-600/5 text-blue-500"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12" dir="rtl">

      {/* Premium Audio Intro */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-sm">پیام صوتی مدیر پلتفرم زوپیت</h3>
            <p className="text-slate-500 text-xs mt-0.5">لطفاً پیش از انتخاب پلن و ثبت‌نام، این فایل صوتی کوتاه را بشنوید</p>
          </div>
        </div>
        <audio controls className="h-9 outline-none rounded-lg max-w-[280px] sm:max-w-xs">
          <source src="/intro.mp3" type="audio/mpeg" />
        </audio>
      </div>
      {/* IF ALREADY APPROVED / ACTIVE PRO ACCOUNT */}
      {isProApproved ? (
        <div className="space-y-8">
          {/* VIP Status Badge */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/60 border border-indigo-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm text-white">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                  <span>اکانت پرو فعال است</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                    Zopit PRO
                  </span>
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  شما در حال استفاده از قدرتمندترین زیرساخت اختصاصی ابری زوپیت هستید.
                </p>
              </div>
            </div>
            {proAccount.createdAt && (
              <div className="relative z-10 flex flex-col items-start sm:items-end gap-1">
                <span className="text-[11px] text-slate-500 font-medium">تاریخ فعال‌سازی</span>
                <span className="text-sm font-semibold text-slate-800 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                  {new Date(proAccount.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
            )}
          </div>
          {/* Credentials Card */}
          <div className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-black text-primary">اطلاعات هاست و دسترسی‌های اختصاصی شما</h2>
                  <p className="text-xs text-muted">مشخصات ورود به کنترل‌پنل هاست و پیشخوان وردپرس فروشگاه</p>
                </div>
              </div>
              <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                تخصیص یافته و فعال
              </span>
            </div>

            {proAccount.domainName || proAccount.cpanelUrl || proAccount.wpAdminUrl ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Domain Card */}
                  <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-blue-500" /> دامنه اختصاصی:
                        </span>
                        {proAccount.domainName && (
                          <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            متصل به هاست
                          </span>
                        )}
                      </div>
                      <p className="font-mono font-black text-sm text-primary dir-ltr text-right truncate bg-card p-3 rounded-xl border border-subtle">
                        {proAccount.domainName || "در حال اتصال توسط پشتیبانی..."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-subtle/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted">DNSهای زوپیت: ns1.zopit.ir</span>
                      {proAccount.domainName && (
                        <a
                          href={`https://${proAccount.domainName}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          مشاهده سایت <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* cPanel Access Card */}
                  <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                          <Server className="w-4 h-4 text-indigo-500" /> کنترل‌پنل هاست (cPanel):
                        </span>
                        <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          Direct Access
                        </span>
                      </div>

                      <div className="space-y-2 text-xs font-mono dir-ltr text-right">
                        <div className="flex justify-between items-center bg-card p-2.5 rounded-xl border border-subtle">
                          <span className="text-muted text-[11px]">User:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{proAccount.cpanelUsername || "—"}</span>
                            {proAccount.cpanelUsername && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(proAccount.cpanelUsername);
                                  setCopiedField("cp_user");
                                  toast("نام کاربری cPanel کپی شد", "success");
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="text-muted hover:text-primary cursor-pointer p-1"
                                title="کپی نام کاربری"
                              >
                                {copiedField === "cp_user" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-card p-2.5 rounded-xl border border-subtle">
                          <span className="text-muted text-[11px]">Pass:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              {showCpanelPass ? proAccount.cpanelPassword || "—" : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowCpanelPass(!showCpanelPass)}
                              className="text-muted hover:text-primary cursor-pointer p-1"
                              title={showCpanelPass ? "مخفی کردن" : "نمایش پسورد"}
                            >
                              {showCpanelPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {proAccount.cpanelPassword && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(proAccount.cpanelPassword);
                                  setCopiedField("cp_pass");
                                  toast("کلمه عبور cPanel کپی شد", "success");
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="text-muted hover:text-primary cursor-pointer p-1"
                                title="کپی پسورد"
                              >
                                {copiedField === "cp_pass" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-subtle/60">
                      {proAccount.cpanelUrl ? (
                        <a
                          href={proAccount.cpanelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                        >
                          <span>ورود به کنترل‌پنل cPanel</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted block text-center">آدرس لاگین در حال صدور</span>
                      )}
                    </div>
                  </div>

                  {/* WP Admin Access Card */}
                  <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-purple-500" /> پیشخوان وردپرس (WP-Admin):
                        </span>
                        <span className="text-[10px] font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          Store Admin
                        </span>
                      </div>

                      <div className="space-y-2 text-xs font-mono dir-ltr text-right">
                        <div className="flex justify-between items-center bg-card p-2.5 rounded-xl border border-subtle">
                          <span className="text-muted text-[11px]">User:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{proAccount.wpUsername || "—"}</span>
                            {proAccount.wpUsername && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(proAccount.wpUsername);
                                  setCopiedField("wp_user");
                                  toast("نام کاربری وردپرس کپی شد", "success");
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="text-muted hover:text-primary cursor-pointer p-1"
                                title="کپی نام کاربری"
                              >
                                {copiedField === "wp_user" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-card p-2.5 rounded-xl border border-subtle">
                          <span className="text-muted text-[11px]">Pass:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              {showWpPass ? proAccount.wpPassword || "—" : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowWpPass(!showWpPass)}
                              className="text-muted hover:text-primary cursor-pointer p-1"
                              title={showWpPass ? "مخفی کردن" : "نمایش پسورد"}
                            >
                              {showWpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {proAccount.wpPassword && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(proAccount.wpPassword);
                                  setCopiedField("wp_pass");
                                  toast("کلمه عبور وردپرس کپی شد", "success");
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="text-muted hover:text-primary cursor-pointer p-1"
                                title="کپی پسورد"
                              >
                                {copiedField === "wp_pass" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-subtle/60">
                      {proAccount.wpAdminUrl ? (
                        <a
                          href={proAccount.wpAdminUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-text-primary rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20"
                        >
                          <span>ورود به پیشخوان وردپرس</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted block text-center">آدرس پیشخوان در حال صدور</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl text-center space-y-2">
                <p className="text-sm font-bold text-amber-700 dark:text-indigo-600">
                  در حال آماده‌سازی و کانفیگ هاست اختصاصی شما توسط دپارتمان پشتیبانی...
                </p>
                <p className="text-xs text-muted">
                  اطلاعات ورود به cPanel و وردپرس به محض تکمیل در این بخش نمایش داده خواهد شد.
                </p>
              </div>
            )}
          </div>

          {/* DOWNLOADS & PLUGINS CENTER (NEW SECTION) */}
          <div className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FolderDown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary">مرکز دانلود پکیج افزونه‌ها و فایل‌های اختصاصی فروشگاه</h2>
                  <p className="text-xs text-muted">فایل‌های ضروری، افزونه‌های فعال‌شده و راهنماهای گام‌به‌گام برای اکانت شما</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                شامل لایسنس مادام‌العمر
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proResources && proResources.length > 0 ? (
                proResources.map((res: any) => (
                  <div
                    key={res.id}
                    className="bg-surface hover:bg-surface-hover/80 p-5 rounded-2xl border border-subtle hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            {res.fileType || "ZIP"}
                          </span>
                          <span className="text-xs font-mono text-muted">حجم: {res.fileSize || "—"}</span>
                        </div>
                        {res.version && (
                          <span className="text-[11px] font-mono font-bold text-muted bg-card px-2 py-0.5 rounded-md border border-subtle">
                            v{res.version}
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-sm text-primary group-hover:text-emerald-400 transition-colors">
                        {res.title}
                      </h3>
                      <p className="text-xs text-secondary leading-relaxed font-normal">
                        {res.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-subtle/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted">
                        بروزرسانی: {res.updatedAt || "اخیر"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadResource(res)}
                        disabled={downloadingId === res.id}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {downloadingId === res.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>در حال آماده‌سازی...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>دانلود فایل</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center bg-surface rounded-2xl border border-subtle">
                  <FileArchive className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted">در حال بارگذاری فایل‌های پکیج...</p>
                </div>
              )}
            </div>
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
                <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
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
                  <h3 className="font-black text-primary text-base">پشتیبانی و راهنمایی مستقیم مدیران پرومکس</h3>
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
                  <span>ثبت تیکت پشتیبانی و درخواست راهنمایی پرومکس</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* REGISTRATION & PROMOTIONAL VIEW */
        <div className="space-y-8">
          {/* Zopit Expectation Box */}
          {/* Active Promotion Banner for Initial Registration */}
          {activePromotions && activePromotions.length > 0 && !isProApproved && (
            <div className="space-y-3">
              {activePromotions
                .filter((p: any) => !p.applicablePlan || p.applicablePlan === 'ALL' || p.applicablePlan === selectedPlan)
                .map((promo: any, pIdx: number) => {
                  const isCurrentApplied = isDiscountApplied && discountCodeText.trim().toUpperCase() === promo.code.toUpperCase();
                  return (
                    <div 
                      key={promo.id || pIdx}
                      className="bg-amber-50/80 border border-amber-200 p-4 sm:p-5 rounded-2xl text-slate-900 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
                        <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                              تخفیف ویژه
                            </span>
                            {promo.applicablePlan && promo.applicablePlan !== 'ALL' && (
                              <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2 py-0.5 rounded-md border border-indigo-200">
                                {promo.applicablePlan === 'PRO_MAX' ? 'ویژه پرومکس' : 'ویژه پرو'}
                              </span>
                            )}
                            <h3 className="font-bold text-sm md:text-base text-slate-900">
                              کد تخفیف <span className="font-mono text-indigo-600 font-bold px-2 py-0.5 bg-white rounded-md border border-slate-200" dir="ltr">{promo.code}</span> فعال است!
                            </h3>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {promo.title ? <strong className="text-slate-800">{promo.title}: </strong> : null}
                            بهره‌مندی از <strong className="text-indigo-600 font-bold">{promo.discountType === 'PERCENTAGE' ? (promo.discountValue + '٪ تخفیف') : (Number(promo.discountValue)?.toLocaleString('fa-IR') + ' تومان تخفیف')}</strong> روی هزینه فعال‌سازی اشتراک.
                            {promo.maxUses ? <span className="text-slate-500 text-[11px] mr-1">(ظرفیت محدود: {promo.maxUses - (promo.usedCount || 0)} اکانت باقی‌مانده)</span> : null}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isCurrentApplied}
                        onClick={() => handleApplyDiscountCodeWithCode(promo.code)}
                        className={`font-bold text-xs px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                          isCurrentApplied
                            ? "bg-emerald-600 text-white cursor-default shadow-xs"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95"
                        }`}
                      >
                        <Ticket className="w-4 h-4" />
                        <span>{isCurrentApplied ? "تخفیف اعمال شد" : "اعمال خودکار این کد تخفیف"}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          {/* MODERN PRICING PLANS TABLE */}
          {formStep === 1 && (
            <div className="animate-fade-in">
              <PricingPlansTable
                selectedPlan={selectedPlan}
                billingCycle={billingCycle}
                onSelectPlan={(plan, billing) => {
                  setSelectedPlan(plan);
                  setBillingCycle(billing);
                }}
                onProceedToForm={() => {
                  setFormStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}

          {formStep > 1 && (
            <div id="pro-register-wizard-container" className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
              {/* Back to plans button */}
              <button
                type="button"
                onClick={() => {
                  setFormStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>بازگشت به انتخاب پلن</span>
              </button>

              <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span>تکمیل اطلاعات و راه‌اندازی پلن {selectedPlan === "VIP" ? "ویژه VIP" : selectedPlan === "PRO" ? "حرفه‌ای (رشد)" : "استارتاپ"}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    لطفاً مشخصات را بررسی نموده و پس از ثبت امضای دیجیتال، پرداخت نهایی را تکمیل فرمایید.
                  </p>
                </div>
              </div>

              {/* Midnight countdown reminder */}
              <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-amber-500/10 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-2 flex-wrap">
                      <span>تخفیف و تعرفه ویژه راه‌اندازی (معتبر تا ۲۴:۰۰ امشب)</span>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        تمدید خودکار هر شب ساعت ۱۲ شب
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {selectedPlan === "STARTUP"
                        ? "پلن استارتاپ بر اساس کف قیمت مصوب سرور ابری محاسبه شده و ثبت‌نام تا پایان امروز معتبر است."
                        : "تعرفه‌های تخفیف سالانه و ماهانه تا پایان امروز فعال بوده و هر شب ساعت ۱۲ تمدید می‌شوند."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-amber-200 px-3.5 py-1.5 rounded-xl shadow-2xs shrink-0" dir="ltr">
                  <span className="text-[11px] font-bold text-slate-400 font-sans">اعتبار تا ۱۲ شب:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-amber-600">
                    {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* APPLICANT INFO & SERVICES FORM */}
              <div className="space-y-8">
                {/* SECTION 1: STORE MANAGER PROFILE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>۱. مشخصات مدیر فروشگاه</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        نام و نام خانوادگی مدیر فروشگاه <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: محمد رضایی"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-900 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        کد ملی <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nationalCode}
                        onChange={(e) => setNationalCode(e.target.value)}
                        placeholder="۱۰ رقم کد ملی"
                        maxLength={10}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        شماره موبایل <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="09123456789"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ADMIN SERVICES */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>۲. خدمات اداری، حقوقی و درگاه پرداخت</span>
                    </div>
                    {selectedPlan === "STARTUP" ? (
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        پلن استارتاپ: ۵۰,۰۰۰ تومان تعرفه دولتی ای‌نماد
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        رایگان با پلن‌های پرو و VIP (تقبل ۱۰۰٪ توسط زوپیت)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-all ${
                      hasEnamad ? "bg-indigo-50/40 border-indigo-200" : "bg-slate-50/70 hover:bg-slate-50 border-slate-200"
                    }`}>
                      <input
                        type="checkbox"
                        checked={hasEnamad}
                        onChange={(e) => setHasEnamad(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-800">اخذ نماد اعتماد الکترونیکی (ای‌نماد)</span>
                          {selectedPlan === "STARTUP" ? (
                            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                              + ۵۰,۰۰۰ تومان
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              رایگان
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {selectedPlan === "STARTUP"
                            ? "به دلیل محاسبه پلن استارتاپ با کف قیمت، هزینه مصوب سامانه دولتی اینماد (۵۰ هزار تومان) دریافت شده و تمامی مراحل اداری و تاییدیه توسط زوپیت پیگیری و انجام می‌شود."
                            : "اخذ رسمی ای‌نماد و کلیه پیگیری‌های اداری به نام شما، با تقبل ۱۰۰٪ هزینه‌ها توسط زوپیت."}
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-all ${
                      hasTaxProfile ? "bg-indigo-50/40 border-indigo-200" : "bg-slate-50/70 hover:bg-slate-50 border-slate-200"
                    }`}>
                      <input
                        type="checkbox"
                        checked={hasTaxProfile}
                        onChange={(e) => setHasTaxProfile(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-800">تشکیل پرونده مالیاتی</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            رایگان
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          ثبت‌نام و تشکیل پرونده مالیاتی معتبر در سازمان امور مالیاتی کشور بدون نیاز به مراجعه حضوری.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* SECTION 3: SIGNATURE CANVAS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-indigo-600" />
                        <span>۳. کادر امضای دیجیتال آنلاین قرارداد <span className="text-rose-500">*</span>:</span>
                      </label>
                      {(hasSignature || signatureDataUrl) && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>امضای رسمی ثبت شد</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={autoGenerateSignature}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-xl border border-indigo-100 cursor-pointer transition-all active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 text-indigo-600" /> امضای خودکار با هویت دیجیتال
                      </button>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer p-1 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> پاکسازی
                      </button>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-2xl bg-slate-50 p-2.5 relative text-center shadow-xs">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={140}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="w-full h-32 touch-none cursor-crosshair bg-white rounded-xl border border-slate-200 shadow-xs"
                    />
                    {!hasSignature && !signatureDataUrl && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs p-4">
                        <span>جهت ثبت امضا، با دست یا ماوس در این کادر بکشید</span>
                        <span className="text-[10px] text-indigo-600 mt-1 font-semibold">یا دکمه «امضای خودکار با هویت دیجیتال» را بفشارید</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: INVOICE & DISCOUNT */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>۴. فاکتور نهایی و پرداخت</span>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">پلن انتخابی شما:</span>
                      <span className="text-slate-900 font-bold">{selectedPlan === "VIP" ? "ویژه VIP" : selectedPlan === "PRO" ? "حرفه‌ای (رشد)" : "استارتاپ"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">هزینه پلن:</span>
                      <span className="text-slate-900 font-bold">
                        {Math.max(0, (selectedPlan === 'VIP' ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) : selectedPlan === 'PRO' ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) : 259000)).toLocaleString()} تومان
                      </span>
                    </div>

                    {/* Itemized Enamad cost row */}
                    {hasEnamad && (
                      <div className="flex justify-between items-center text-sm py-1 border-t border-slate-200/60 pt-2">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-indigo-600" />
                          <span>تعرفه صدور ای‌نماد (سامانه دولتی اینماد):</span>
                        </span>
                        {selectedPlan === 'STARTUP' ? (
                          <span className="text-amber-900 font-bold bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md text-xs">
                            + ۵۰,۰۰۰ تومان
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs">
                            رایگان (تقبل ۱۰۰٪ توسط زوپیت)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tax profile row */}
                    {hasTaxProfile && (
                      <div className="flex justify-between items-center text-sm py-1 border-t border-slate-200/60 pt-2">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تشکیل پرونده در سازمان امور مالیاتی:</span>
                        </span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs">
                          رایگان
                        </span>
                      </div>
                    )}

                    {/* Promo code */}
                    <div className="pt-4 border-t border-slate-200/80">
                      <label className="text-xs font-semibold text-slate-600 block mb-2">
                        کد تخفیف (اختیاری)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCodeText}
                          onChange={(e) => setDiscountCodeText(e.target.value)}
                          disabled={isDiscountApplied}
                          placeholder="کد تخفیف خود را وارد کنید"
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 disabled:opacity-50"
                        />
                        {isDiscountApplied ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsDiscountApplied(false);
                              setDiscountCodeText("");
                              setAppliedDiscount(0);
                            }}
                            className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100 transition-all shrink-0 border border-rose-200"
                          >
                            لغو تخفیف
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyDiscountCode}
                            className="px-4 py-2 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-all shrink-0 border border-slate-200"
                          >
                            اعمال کد
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                        <span className="text-emerald-800">تخفیف اعمال شده:</span>
                        <span className="text-emerald-700 font-bold">
                          - {appliedDiscount.toLocaleString()} تومان
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-base pt-4 border-t border-slate-200/80">
                      <span className="text-slate-800 font-extrabold">مبلغ قابل پرداخت:</span>
                      <span className="text-indigo-600 font-extrabold text-xl">
                        {Math.max(
                          0, 
                          (selectedPlan === 'VIP' 
                            ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) 
                            : selectedPlan === 'PRO' 
                              ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) 
                              : 259000) 
                          + ((selectedPlan === 'STARTUP' && hasEnamad) ? 50000 : 0) 
                          - appliedDiscount
                        ).toLocaleString()} تومان
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: TERMS ACCEPTANCE & MATH CAPTCHA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                  <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-medium text-slate-700 leading-relaxed">
                      با تأیید و ارسال این فرم،
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTermsModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 underline font-bold mx-1 cursor-pointer inline-block"
                      >
                        قوانین و مقررات رسمی زوپیت
                      </button>
                      را مطالعه نموده و می‌پذیرم.
                    </span>
                  </label>
                  
                  {/* Math Captcha */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">کد امنیتی:</span>
                    <div className="bg-white border border-slate-200 text-indigo-600 font-mono font-bold text-base px-3.5 py-1.5 rounded-xl shadow-xs tracking-widest flex items-center gap-2">
                      <span>{num1}</span>
                      <span className="text-slate-400">+</span>
                      <span>{num2}</span>
                      <span className="text-slate-400">=</span>
                    </div>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="پاسخ"
                      className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={resetCaptcha}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title="تغییر سوال"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={(e) => handleRegister(e as any)}
                    disabled={submitting}
                    className="w-full md:w-[75%] mx-auto py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer transform hover:scale-[1.005] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>ارتقا و پرداخت نهایی</span>
                        <ChevronLeft className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    )}

      {/* Contract & Terms Modal */}
      
      {/* Pro Ticket Modal */}
      {showProTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border-subtle flex flex-col">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface/50">
              <h3 className="font-black text-primary text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                ارسال مدارک اختصاصی پرو
              </h3>
              <button 
                onClick={() => setShowProTicketModal(false)}
                className="p-2 bg-background hover:bg-surface rounded-xl transition-colors text-muted hover:text-rose-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 text-sm text-secondary space-y-4 text-right" dir="rtl">
              <p className="text-xs text-muted mb-4">
                لطفا تصاویر کارت ملی، شناسنامه و شماره شبا خود را آپلود کرده و پیام خود را جهت بررسی سریع وارد نمایید. این تیکت با اولویت بالا و مستقیما به دپارتمان اکانت پرومکس ارسال خواهد شد.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">موضوع ارسال</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">توضیحات</label>
                <textarea
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="مثال: مدارک برای درگاه پرداخت و اینماد پیوست شد..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">لینک فایل پیوست (اختیاری)</label>
                <input
                  type="text"
                  value={ticketAttachment}
                  onChange={(e) => setTicketAttachment(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr text-left"
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-border-subtle bg-surface/50 flex justify-end gap-3">
              <button
                onClick={() => setShowProTicketModal(false)}
                className="px-5 py-2.5 bg-background hover:bg-surface text-secondary font-bold rounded-xl text-xs transition-colors border border-border-subtle"
              >
                انصراف
              </button>
              <button
                onClick={handleSendProTicket}
                disabled={submittingTicket}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-text-primary font-black rounded-xl text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submittingTicket ? "در حال ارسال..." : "ارسال مدارک"}
                <PenTool className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-subtle rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-black text-primary text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>متن قرارداد و قوانین رسمی اکانت پرومکس زوپیت</span>
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
                    <p>ارائه پکیج جامع راه‌اندازی و مدیریت فروشگاه آنلاین (اکانت پرومکس)، شامل تامین زیرساخت‌های نرم‌افزاری (هاست و دامنه اختصاصی ir.)، نصب و پیکربندی سیستم مدیریت محتوا (قالب وودمارت)، انجام امور اداری و قانونی (اخذ اینماد، درگاه پرداخت، پرونده مالیاتی)، اتصال به موتورهای جستجوی کالا (ترب) و ارائه خدمات لجستیک، در ازای تعهد فروشنده به تامین کالا و حفظ حداقل سقف فروش ماهانه.</p>
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
                    <p>۳-۶. استرداد و سلب امتیاز: چنانچه فروشنده در هر ماه از رسیدن به حداقل حد نصاب فروش باز بماند یا فعالیت فروشگاه را متوقف کند، پلتفرم این اختیار و حقِ غیرقابل‌فسخ را دارد که قرارداد اکانت پرومکس را لغو کرده، خدمات هاست را قطع نموده و دامنه ثبت‌شده را به مالکیت خود درآورده یا غیرفعال کند. فروشنده با تایید این قرارداد، حق هرگونه اعتراض در خصوص سلب مالکیت دامنه در صورت عدم تحقق تارگت را از خود سلب می‌نماید.</p>
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
