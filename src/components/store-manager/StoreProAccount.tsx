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
  ChevronRight
} from "lucide-react";
import { toast } from "../GlobalToast";
import { ProAccountMediaShowcase } from "./ProAccountMediaShowcase";
import { StoreProAccountStep2 } from "./StoreProAccountStep2";
import { requestClientSideZibalPayment } from "../../services/payment/clientPaymentBridge";

interface StoreProAccountProps {
  user?: any;
  showNotification?: (message: string, type: "success" | "error") => void;
  onNavigateTab?: (tab: string) => void;
}

export function StoreProAccount({ user, showNotification, onNavigateTab }: StoreProAccountProps) {
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "PRO_MAX">("PRO_MAX");
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [renewingHost, setRenewingHost] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCpanelPass, setShowCpanelPass] = useState(false);
  const [showWpPass, setShowWpPass] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
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

  // 24-Hour countdown timer state with auto-renewal and localStorage persistence
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const storageKey = "zopit_promax_offer_expiry";
    let expiry = localStorage.getItem(storageKey);
    const now = Date.now();
    if (!expiry || parseInt(expiry, 10) <= now) {
      const newExpiry = now + 24 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, newExpiry.toString());
      expiry = newExpiry.toString();
    }

    const timer = setInterval(() => {
      const currentNow = Date.now();
      let targetTime = parseInt(localStorage.getItem(storageKey) || "0", 10);
      let diff = targetTime - currentNow;
      if (diff <= 0) {
        // Auto-renew timer for next 24 hours so offer remains live and active
        const renewed = currentNow + 24 * 60 * 60 * 1000;
        localStorage.setItem(storageKey, renewed.toString());
        diff = renewed - currentNow;
      }
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ hours, minutes, seconds });
    }, 1000);

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
  
  const [hasDomainPriority, setHasDomainPriority] = useState(false);
  const [hasEnamad, setHasEnamad] = useState(false);
  const [hasGateway, setHasGateway] = useState(false);
  const [hasTaxProfile, setHasTaxProfile] = useState(false);
  const [hasPostalPanel, setHasPostalPanel] = useState(false);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [logoDescription, setLogoDescription] = useState("");
  const [domainProposals, setDomainProposals] = useState<string[]>(["", "", "", "", ""]);
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
      const hostBasePrice = parseInt(settings.promaxAccountPrice || '199000', 10);
      const domainCost = hasDomainPriority ? 80000 : 0;
      const adminServicesCost = hasEnamad ? 50000 : 0;
      const totalCost = hostBasePrice + domainCost + adminServicesCost;
      
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
      const res = await fetch("/api/store-manager/pro/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProAccount(data.proAccount);
        if (data.proAccount?.planType) {
          setSelectedPlan(data.proAccount.planType === 'PRO' ? 'PRO' : 'PRO_MAX');
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.activePromotions) {
          setActivePromotions(data.activePromotions);
        }
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

  const handleProceedToStep2 = () => {
    if (!fullName.trim()) {
      const msg = "لطفاً نام و نام خانوادگی مدیر فروشگاه را وارد نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (!nationalCode.trim() || nationalCode.trim().length < 10) {
      const msg = "لطفاً کد ملی معتبر (۱۰ رقمی) را وارد نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (!mobile.trim() || mobile.trim().length < 10) {
      const msg = "لطفاً شماره همراه معتبر را وارد نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (!hasSignature && !signatureDataUrl) {
      const msg = "لطفاً قرارداد را امضا نمایید (کشیدن امضا با دست/ماوس یا کلیک بر دکمه امضای خودکار).";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    if (canvasRef.current) {
      try {
        const sig = canvasRef.current.toDataURL("image/png");
        if (sig && sig.length > 50) {
          setSignatureDataUrl(sig);
          setHasSignature(true);
        }
      } catch (err) {}
    }

    if (parseInt(captchaInput, 10) !== num1 + num2) {
      const msg = "کد امنیتی (کپچا) اشتباه است. لطفاً دوباره تلاش کنید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      resetCaptcha();
      return;
    }

    if (!termsAccepted) {
      const msg = "لطفاً تیک پذیرش قوانین و مقررات را فعال نمایید.";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
      return;
    }

    setFormStep(2);
    const container = document.getElementById("pro-register-wizard-container");
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

    const hostBasePrice = parseInt(settings.promaxAccountPrice || '199000', 10);
    const domainCost = hasDomainPriority ? 80000 : 0;
    const adminServicesCost = hasEnamad ? 50000 : 0;
    const subtotal = hostBasePrice + domainCost + adminServicesCost;
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
          hasDomainPriority,
          planType: selectedPlan,
          domainProposals: domainProposals.map(d => d.trim()).filter(Boolean),
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
      title: "ثبت دامنه ملی اختصاصی (.ir)",
      desc: "ثبت و اعطای دامنه اختصاصی با نام برند شما جهت برندسازی مستقل",
      value: "۱۱۰,۰۰۰ تومان",
      icon: Globe,
      color: "from-blue-500/20 to-blue-600/5 text-blue-500"
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
      {/* Top Banner Header with 24-Hour Countdown Timer */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border-default p-6 md:p-8 text-text-primary shadow-xl space-y-6">
        <div className="absolute -top-12 -left-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 24-Hour Countdown Badge Banner */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-indigo-500/10 border border-indigo-500/20 p-3.5 md:p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-black text-indigo-600">
                فرصت طلایی ۲۴ ساعته: پکیج کامل پرو مکس (۱۴,۸۰۰,۰۰۰ تومان) ۱۰۰٪ رایگان شد!
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                زوپیت کلیه هزینه‌های نرم‌افزاری، لایسنس‌ها و طراحی پلتفرم را برای شما کاملاً رایگان کرده است.
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 shrink-0 font-mono" dir="ltr">
            <div className="flex flex-col items-center bg-surface border border-indigo-500/20 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <span className="text-lg md:text-xl font-black text-indigo-600">
                {String(countdown.hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-text-muted font-sans font-bold">ساعت</span>
            </div>
            <span className="text-indigo-600 font-black text-lg">:</span>
            <div className="flex flex-col items-center bg-surface border border-indigo-500/20 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <span className="text-lg md:text-xl font-black text-indigo-600">
                {String(countdown.minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-text-muted font-sans font-bold">دقیقه</span>
            </div>
            <span className="text-indigo-600 font-black text-lg">:</span>
            <div className="flex flex-col items-center bg-surface border border-indigo-500/20 px-3 py-1.5 rounded-xl shadow-inner min-w-[52px]">
              <span className="text-lg md:text-xl font-black text-rose-400 animate-pulse">
                {String(countdown.seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-text-muted font-sans font-bold">ثانیه</span>
            </div>
          </div>
        </div>

        {/* Main Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/40 text-amber-600 dark:text-amber-400 text-xs font-black">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>طرح ویژه راه‌اندازی فروشگاه اختصاصی زوپیت (Zopit Pro Max)</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-text-primary leading-tight">
              دریافت ۱۰۰٪ رایگان اشتراک پرومکس زوپیت (Zopit Pro Max)
            </h1>
            <p className="text-text-secondary text-xs md:text-sm max-w-3xl leading-relaxed">
              کلیه خدمات و لایسنس‌های نرم‌افزاری، طراحی قالب اختصاصی وودمارت، افزونه‌ها و پشتیبانی به ارزش <strong className="text-primary font-black">۱۴,۸۰۰,۰۰۰ تومان به صورت ۱۰۰٪ رایگان و هدیه</strong> به شما تقدیم می‌گردد. مشخصات خود را ثبت کرده و در مرحله بعد هاست اختصاصی ابری را با تخفیف ویژه دریافت نمایید.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-3xl border border-indigo-500/20 text-center shrink-0 w-full lg:w-auto shadow-xl space-y-2.5">
            <span className="text-xs text-indigo-600 dark:text-indigo-400 block font-black">پکیج طلایی اشتراک پرومکس</span>
            
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                <span className="text-text-muted">ارزش پکیج نرم‌افزاری:</span>
                <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg border border-rose-500/30 font-sans font-bold text-xs">
                  <span className="line-through decoration-rose-400 decoration-1">۱۴,۸۰۰,۰۰۰ تومان</span>
                </span>
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/15 px-3.5 py-1.5 rounded-full border border-emerald-500/30 my-1 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>هزینه اشتراک: ۱۰۰٪ رایگان (۰ تومان)</span>
              </div>
              <div className="pt-2 border-t border-border-subtle w-full mt-2">
                <span className="text-[11px] text-text-muted block">دامنه اختصاصی (.ir) + قالب + لایسنس‌ها</span>
                <span className="text-xs font-bold text-indigo-500 mt-0.5 inline-block">هدیه ویژه پلتفرم زوپیت</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Audio Podcast Showcase for Pro Account */}
      <ProAccountMediaShowcase audioUrl={settings?.audioUrl} />

      {/* IF ALREADY APPROVED / ACTIVE PRO ACCOUNT */}
      {isProApproved ? (
        <div className="space-y-8">
          {/* VIP Status Badge */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <Crown className="w-8 h-8 text-slate-950" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white flex items-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">اکانت پرومکس فعال است</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                    Zopit PRO MAX
                  </span>
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  شما در حال استفاده از قدرتمندترین زیرساخت اختصاصی زوپیت هستید.
                </p>
              </div>
            </div>
            {proAccount.createdAt && (
              <div className="relative z-10 flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">تاریخ فعال‌سازی</span>
                <span className="text-sm font-mono text-amber-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-amber-500/20 shadow-inner">
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
                      className="bg-indigo-950/90 dark:bg-slate-900 border-2 border-indigo-500/50 p-5 rounded-3xl text-text-primary shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                              🔥 تخفیف ویژه همگانی
                            </span>
                            {promo.applicablePlan && promo.applicablePlan !== 'ALL' && (
                              <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 font-black text-[10px] px-2 py-0.5 rounded-md">
                                {promo.applicablePlan === 'PRO_MAX' ? 'ویژه پرومکس' : 'ویژه پرو'}
                              </span>
                            )}
                            <h3 className="font-black text-sm md:text-base text-text-primary">
                              کد تخفیف <span className="font-mono text-indigo-600 font-black px-1.5 py-0.5 bg-amber-950/60 rounded-md border border-indigo-500/30" dir="ltr">{promo.code}</span> فعال است!
                            </h3>
                          </div>
                          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                            {promo.title ? <strong>{promo.title}: </strong> : null}
                            بهره‌مندی از <strong className="text-indigo-600 font-bold">{promo.discountType === 'PERCENTAGE' ? (promo.discountValue + '٪ تخفیف') : (Number(promo.discountValue)?.toLocaleString('fa-IR') + ' تومان تخفیف')}</strong> روی هزینه فعال‌سازی اشتراک.
                            {promo.maxUses ? <span className="text-text-muted text-[11px] mr-1">(ظرفیت محدود: {promo.maxUses - (promo.usedCount || 0)} اکانت باقی‌مانده)</span> : null}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isCurrentApplied}
                        onClick={() => handleApplyDiscountCodeWithCode(promo.code)}
                        className={`font-black text-xs px-5 py-3 rounded-2xl transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-2 ${
                          isCurrentApplied
                            ? "bg-emerald-600 text-text-primary cursor-default opacity-90 shadow-md"
                            : "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20"
                        }`}
                      >
                        <Ticket className="w-4 h-4" />
                        <span>{isCurrentApplied ? "✓ این تخفیف اعمال شده است" : "اعمال خودکار این کد تخفیف"}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          {/* PRO MAX EXCLUSIVE PLAN CARD (PRO RETIRED & REMOVED) */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-primary flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <span>پکیج طلایی اشتراک پرومکس زوپیت (Zopit Pro Max)</span>
                </h2>
                <p className="text-xs text-muted mt-1">
                  کامل‌ترین و پیشرفته‌ترین پکیج فروشگاهی زوپیت با ارزش ۱۴,۸۰۰,۰۰۰ تومان که کلیه بخش‌های نرم‌افزاری آن به صورت ۱۰۰٪ رایگان به شما اهدا می‌شود:
                </p>
              </div>
            </div>

            {/* UNIFIED PRO MAX SHOWCASE */}
            <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-amber-500/10 via-card to-card border-2 border-amber-500/80 shadow-2xl shadow-amber-500/10 space-y-6">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 text-xs font-black px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>۱۰۰٪ رایگان با حمایت زوپیت</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-subtle pb-6">
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30">
                      <Crown className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-primary flex items-center gap-2">
                        <span>اشتراک پرومکس (Zopit Pro Max)</span>
                        <span className="text-xs bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-lg">پکیج جامع طلایی</span>
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        دسترسی به تمامی امکانات، قالب اختصاصی وودمارت، اتصال به ترب و ایمالز، سامانه لجستیک و استارتاپ‌ها
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-surface/90 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] text-muted block font-bold">ارزش کل خدمات نرم‌افزاری:</span>
                  <div className="text-sm font-sans font-bold text-rose-400 line-through">
                    ۱۴,۸۰۰,۰۰۰ تومان
                  </div>
                  <div className="text-2xl font-black text-emerald-500 pt-0.5 flex items-center justify-center gap-1.5">
                    <span>۱۰۰٪ رایگان</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">هدیه زوپیت</span>
                  </div>
                </div>
              </div>

              {/* 9 DETAILED SERVICE CARDS IN UNIFIED GRID */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-secondary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>ریز خدمات و ارزش ریالی پکیج هدیه پرومکس:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {proFeaturesList.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="bg-surface/80 border border-subtle hover:border-amber-500/30 rounded-2xl p-4 transition-all shadow-xs flex flex-col justify-between space-y-2.5"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xs`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              رایگان
                            </span>
                          </div>
                          <h5 className="font-black text-xs text-primary leading-snug">{item.title}</h5>
                          <p className="text-[11px] text-muted leading-relaxed">{item.desc}</p>
                        </div>

                        <div className="pt-2 border-t border-subtle/60 flex items-center justify-between text-[11px]">
                          <span className="text-muted">ارزش خدمت:</span>
                          <span className="font-sans font-bold text-amber-600 dark:text-amber-400">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* UNIFIED REGISTRATION & PRO MAX ACTIVATION FORM */}
          {/* TWO-STEP REGISTRATION & PRO MAX ACTIVATION WIZARD */}
          <div id="pro-register-wizard-container" className={formStep === 2 ? "space-y-8" : "bg-card border border-border-subtle rounded-[2.5rem] p-6 sm:p-10 space-y-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-indigo-500/10"}>
            {/* WIZARD STEP HEADER & PROGRESS INDICATOR */}
            {formStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-primary flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    <span>ثبت‌نام و راه‌اندازی اشتراک پرومکس زوپیت (Zopit Pro Max)</span>
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    {formStep === 1
                      ? "گام ۱ از ۲: مشخصات متقاضی، اولویت‌های دامنه اختصاصی و خدمات تکمیلی"
                      : "گام ۲ از ۲: زیرساخت هاستینگ ابری، کد تخفیف و پیش‌فاکتور نهایی"}
                  </p>
                </div>
                <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  <span>پکیج طلایی هدیه (ارزش ۱۴,۸۰۰,۰۰۰ تومان)</span>
                </span>
              </div>

              {/* Progress Steps Nav */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className={`p-4 rounded-2xl border transition-all text-right flex items-center gap-3.5 cursor-pointer ${
                    formStep === 1
                      ? "bg-indigo-500/10 border-indigo-500/60 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-surface border-subtle hover:border-indigo-500/30 opacity-80"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      formStep === 1
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                        : "bg-surface border border-subtle text-secondary"
                    }`}
                  >
                    ۱
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-primary block">
                      گام اول: مشخصات متقاضی و خدمات تکمیلی
                    </span>
                    <span className="text-[11px] text-muted block">
                      اطلاعات مدیر، اولویت دامنه، ای‌نماد و امضای قرارداد
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className={`p-4 rounded-2xl border transition-all text-right flex items-center gap-3.5 cursor-pointer ${
                    false
                      ? "bg-emerald-500/10 border-emerald-500/60 shadow-md ring-2 ring-emerald-500/20"
                      : "bg-surface border-subtle hover:border-emerald-500/30 opacity-80"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      false
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                        : "bg-surface border border-subtle text-secondary"
                    }`}
                  >
                    ۲
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-primary block">
                      گام دوم: هاست ابری و پیش‌فاکتور نهایی
                    </span>
                    <span className="text-[11px] text-muted block">
                      هاستینگ اختصاصی NVMe، کد تخفیف و پرداخت
                    </span>
                  </div>
                </button>
              </div>
            </div>

            )}
            {/* STEP 1: APPLICANT INFO & SERVICES FORM */}
            {formStep === 1 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* SECTION 1: STORE MANAGER PROFILE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-sm border-b border-subtle/50 pb-2">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <span>۱. مشخصات مدیر فروشگاه</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-secondary block mb-1.5">
                        نام و نام خانوادگی مدیر فروشگاه <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: محمد رضایی"
                        className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-secondary block mb-1.5">
                        کد ملی <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nationalCode}
                        onChange={(e) => setNationalCode(e.target.value)}
                        placeholder="۱۰ رقم کد ملی"
                        maxLength={10}
                        className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-secondary block mb-1.5">
                        شماره موبایل همراه <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        maxLength={11}
                        className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DOMAIN NAME PROPOSALS (.IR) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-subtle/50 pb-2">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>۲. پیشنهاد نام دامنه اختصاصی (.ir) به ترتیب اولویت (تا ۵ اولویت دلخواه)</span>
                    </div>
                    <span className="text-[11px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      ثبت دامنه ۱۰۰٪ رایگان
                    </span>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">
                    نام‌های پیشنهادی خود را با حروف انگلیسی وارد کنید. اولین دامنه‌ای که در سامانه ایرنیک آزاد باشد، به صورت اختصاصی برای فروشگاه شما ثبت و متصل خواهد شد:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[11px] font-bold text-secondary flex items-center justify-between">
                          <span>اولویت {idx.toLocaleString('fa-IR')}:</span>
                          {idx === 1 && <span className="text-[10px] text-amber-500 font-bold">اصلی</span>}
                        </label>
                        <input
                          type="text"
                          value={domainProposals[idx - 1] || ''}
                          onChange={(e) => {
                            const updated = [...domainProposals];
                            updated[idx - 1] = e.target.value;
                            setDomainProposals(updated);
                          }}
                          placeholder={`brand${idx}.ir`}
                          className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-blue-500 outline-none text-primary"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Domain Priority Checkbox Option */}
                  <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 mt-3 ${
                    hasDomainPriority ? "bg-blue-500/10 border-blue-500/60 shadow-md" : "bg-surface border-subtle hover:border-blue-500/30"
                  }`}>
                    <input
                      type="checkbox"
                      checked={hasDomainPriority}
                      onChange={(e) => setHasDomainPriority(e.target.checked)}
                      className="mt-1 rounded text-blue-600 focus:ring-blue-500 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="space-y-1 text-right flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-primary">سفارش اولویت‌بندی و ثبت تخصصی دامنه‌های پیشنهادی</span>
                        <span className="text-[10px] font-sans font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 whitespace-nowrap">
                          +۸۰,۰۰۰ تومان
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        استعلام لحظه‌ای، بررسی حقوقی آزاد بودن نام‌ها، اتصال فوری DNS و رزرو مستقیم دامنه‌های اولویت‌دار توسط کارشناسان زوپیت در سامانه ایرنیک.
                      </p>
                    </div>
                  </label>
                </div>

                {/* SECTION 3: ADMINISTRATIVE & COMPLEMENTARY OPTIONS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-subtle/50 pb-2">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      <span>۳. خدمات اداری و آپشن‌های تکمیلی فروشگاه</span>
                    </div>
                    <span className="text-[11px] text-indigo-400 font-bold">
                      انتخاب اختیاری بر اساس نیاز
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Payment Gateway */}
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${hasGateway ? 'bg-indigo-500/10 border-indigo-500/60 shadow-md' : 'bg-surface border-subtle hover:border-indigo-500/30'}`}>
                      <input
                        type="checkbox"
                        checked={hasGateway}
                        onChange={(e) => setHasGateway(e.target.checked)}
                        className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="space-y-1 text-right flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-primary">درگاه پرداخت مستقیم شاپرک</span>
                          <span className="text-[10px] font-sans font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                            رایگان (هدیه)
                          </span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">
                          اخذ، احراز هویت و اتصال درگاه پرداخت شتابی مستقیم با پشتیبانی فنی زوپیت.
                        </p>
                      </div>
                    </label>

                    {/* 2. Tax File Setup */}
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${hasTaxProfile ? 'bg-indigo-500/10 border-indigo-500/60 shadow-md' : 'bg-surface border-subtle hover:border-indigo-500/30'}`}>
                      <input
                        type="checkbox"
                        checked={hasTaxProfile}
                        onChange={(e) => setHasTaxProfile(e.target.checked)}
                        className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="space-y-1 text-right flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-primary">تشکیل پرونده مالیاتی</span>
                          <span className="text-[10px] font-sans font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                            رایگان (هدیه)
                          </span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">
                          ثبت‌نام و راهنمایی تشکیل پرونده در سامانه امور مالیاتی جهت اتصال درگاه.
                        </p>
                      </div>
                    </label>

                    {/* 3. eNamad option */}
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${hasEnamad ? 'bg-indigo-500/10 border-indigo-500/60 shadow-md' : 'bg-surface border-subtle hover:border-indigo-500/30'}`}>
                      <input
                        type="checkbox"
                        checked={hasEnamad}
                        onChange={(e) => setHasEnamad(e.target.checked)}
                        className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="space-y-1 text-right flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-primary">اخذ ای‌نماد رسمی (نماد اعتماد)</span>
                          <span className="text-[10px] font-sans font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 whitespace-nowrap">
                            +۵۰,۰۰۰ تومان
                          </span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">
                          ثبت‌نام و احراز هویت در مرکز تجارت الکترونیکی (تعرفه دولتی سامانه اینماد؛ زوپیت هیچ دستمزدی دریافت نمی‌کند).
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Additional Logo & Logistics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Custom Logo Creation */}
                    <div className={`p-4 rounded-2xl border transition-all space-y-3 ${hasCustomLogo ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm' : 'bg-surface border-subtle'}`}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasCustomLogo}
                          onChange={(e) => setHasCustomLogo(e.target.checked)}
                          className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 w-4 h-4 cursor-pointer"
                        />
                        <div className="space-y-0.5 text-right flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-primary">طراحی لوگوی اختصاصی برند فروشگاه</span>
                            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              هدیه ۱۰۰٪ رایگان
                            </span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            طراحی هویت بصری و لوگوی فروشگاه شما توسط تیم گرافیست زوپیت.
                          </p>
                        </div>
                      </label>

                      {hasCustomLogo && (
                        <div className="pt-2">
                          <textarea
                            value={logoDescription}
                            onChange={(e) => setLogoDescription(e.target.value)}
                            placeholder="توضیحات، ایده، نام انگلیسی برند یا رنگ‌های دلخواه برای طراحی لوگو..."
                            rows={2}
                            className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* Postal & Logistics Panel */}
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${hasPostalPanel ? 'bg-indigo-500/10 border-indigo-500/60 shadow-sm' : 'bg-surface border-subtle'}`}>
                      <input
                        type="checkbox"
                        checked={hasPostalPanel}
                        onChange={(e) => setHasPostalPanel(e.target.checked)}
                        className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="space-y-0.5 text-right flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary">سامانه پنل پستی و لجستیک یکپارچه</span>
                          <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            فعال‌سازی رایگان
                          </span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed">
                          اتصال به شبکه پست ملی و شرکت‌های حمل‌ونقل اختصاصی جهت ارسال سریع سفارشات سراسر کشور.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* SECTION 4: SIGNATURE CANVAS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-subtle/50 pb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-secondary flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-emerald-500" />
                        <span>۴. کادر امضای دیجیتال آنلاین قرارداد <span className="text-rose-500">*</span>:</span>
                      </label>
                      {(hasSignature || signatureDataUrl) && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>امضای رسمی ثبت شد</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={autoGenerateSignature}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 font-bold bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/20 cursor-pointer transition-all active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> امضای خودکار با هویت دیجیتال
                      </button>

                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium cursor-pointer p-1 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> پاکسازی
                      </button>
                    </div>
                  </div>

                  <div className="border border-emerald-500/30 rounded-2xl bg-surface p-2.5 relative text-center shadow-xs">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={140}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="w-full h-32 touch-none cursor-crosshair bg-background rounded-xl border border-subtle"
                    />
                    {!hasSignature && !signatureDataUrl && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted text-xs p-4">
                        <span>جهت ثبت امضا، با دست یا ماوس در این کادر بکشید</span>
                        <span className="text-[10px] text-emerald-500 mt-1 font-bold">یا دکمه «امضای خودکار با هویت دیجیتال» را بفشارید</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 5: TERMS ACCEPTANCE & MATH CAPTCHA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                  {/* Clean inline terms agreement note */}
                  <label className="flex items-center gap-3 cursor-pointer bg-surface p-4 rounded-2xl border border-subtle">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-bold text-primary leading-relaxed">
                      با تأیید و ارسال این فرم،
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTermsModal(true);
                        }}
                        className="text-emerald-500 hover:text-emerald-400 underline font-extrabold mx-1 cursor-pointer inline-block"
                      >
                        قوانین و مقررات رسمی زوپیت
                      </button>
                      را مطالعه نموده و می‌پذیرم.
                    </span>
                  </label>

                  {/* Math Captcha */}
                  <div className="bg-surface p-3.5 rounded-2xl border border-subtle flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-secondary whitespace-nowrap">کد امنیتی:</span>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-black text-base px-4 py-1.5 rounded-xl shadow-xs tracking-widest flex items-center gap-2">
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{num1}</span>
                      <span className="text-emerald-500 font-bold">+</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{num2}</span>
                      <span className="text-emerald-500 font-bold">=</span>
                    </div>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="پاسخ"
                      className="w-20 px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none text-primary"
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
                </div>

                {/* Step 1 Submit / Next Button */}
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="w-full md:w-[75%] mx-auto py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer transform hover:scale-[1.01]"
                  >
                    <span>تایید اطلاعات و ورود به مرحله هاستینگ ابری و صدور فاکتور</span>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CLOUD HOSTING, DISCOUNT COUPON & FINAL INVOICE */}
            {formStep === 2 && (
              <StoreProAccountStep2
                fullName={fullName}
                mobile={mobile}
                setFormStep={setFormStep}
                settings={settings}
                hasDomainPriority={hasDomainPriority}
                hasEnamad={hasEnamad}
                discountCodeText={discountCodeText}
                setDiscountCodeText={setDiscountCodeText}
                isDiscountApplied={isDiscountApplied}
                setIsDiscountApplied={setIsDiscountApplied}
                applyDiscount={handleApplyDiscountCode}
                appliedDiscount={appliedDiscount}
                calculatedAmount={Math.max(0, parseInt(settings.promaxAccountPrice || "199000", 10) + (hasDomainPriority ? 80000 : 0) + (hasEnamad ? 50000 : 0) - appliedDiscount)}
                handleRegisterPro={handleRegister}
                submitting={submitting}
              />
            )}
          </div>
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
