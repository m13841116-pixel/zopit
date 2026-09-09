import React, { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  Shield, 
  Server, 
  Zap, 
  Crown, 
  CheckCircle2, 
  Layers, 
  ArrowLeft,
  Sparkles,
  Cpu,
  BadgePercent,
  CreditCard,
  Palette,
  Bot,
  Globe,
  LifeBuoy,
  Timer,
  Clock,
  Flame,
  HelpCircle,
  Gem,
  Store,
  Compass,
  FileText
} from "lucide-react";

export type PlanId = "STARTUP" | "PRO" | "VIP";
export type BillingCycle = "MONTHLY" | "ANNUAL";

// Stateful promo countdown supporting both fixed date and daily midnight resetting
export function usePromoCountdown(endTimeStr?: string | null) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let target: Date;

      if (endTimeStr) {
        target = new Date(endTimeStr);
      } else {
        target = new Date();
        target.setHours(23, 59, 59, 999);
      }

      let diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        if (!endTimeStr) {
          target.setDate(target.getDate() + 1);
          diff = target.getTime() - now.getTime();
        } else {
          setCountdown({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
          return;
        }
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds, isExpired: false });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  return countdown;
}

interface PricingPlansTableProps {
  selectedPlan: PlanId;
  billingCycle?: BillingCycle;
  onSelectPlan: (plan: PlanId, billing: BillingCycle) => void;
  onProceedToForm: () => void;
}

export function PricingPlansTable({ 
  selectedPlan, 
  billingCycle: externalBillingCycle, 
  onSelectPlan, 
  onProceedToForm 
}: PricingPlansTableProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(externalBillingCycle || "ANNUAL");
  const [configs, setConfigs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic, server-authoritative plan configs on mount
  useEffect(() => {
    async function fetchConfigs() {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch("/api/store-manager/subscription/configs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConfigs(data);
        }
      } catch (err) {
        console.error("Error loading server-authoritative configs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (externalBillingCycle && externalBillingCycle !== billingCycle) {
      setBillingCycle(externalBillingCycle);
    }
  }, [externalBillingCycle]);

  const handleToggleBilling = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    // When switching cycle, ensure we keep a valid plan selected (STARTUP only has monthly, others have both)
    const nextPlan = selectedPlan === "STARTUP" && cycle === "ANNUAL" ? "PRO" : selectedPlan;
    onSelectPlan(nextPlan as PlanId, cycle);
  };

  const handleSelect = (plan: PlanId, cycle: BillingCycle) => {
    onSelectPlan(plan, cycle);
  };

  const handleProceed = (plan: PlanId, cycle: BillingCycle) => {
    onSelectPlan(plan, cycle);
    onProceedToForm();
  };

  // Safe fallback configurations matching the seeded database default values
  const defaultConfigs = {
    STARTUP: {
      planName: "STARTUP",
      nameFa: "استارتاپ (پایه)",
      salePrice: 259000,
      priceToman: 259000,
      originalValue: 1200000,
      discountPercentage: 78,
      savingsToman: 941000,
      hostingLabel: "هاست ابری ۱۰ گیگابایت NVMe اختصاصی فروشگاه در پکیج شما",
      enamadGift: false
    },
    PRO_MONTHLY: {
      planName: "PRO_MONTHLY",
      nameFa: "حرفه‌ای Pro (ماهانه)",
      salePrice: 2490000,
      priceToman: 2490000,
      originalValue: 4800000,
      discountPercentage: 48,
      savingsToman: 2310000,
      hostingLabel: "هاست ابری فوق‌سریع ۱۵ گیگابایت NVMe در پکیج شما",
      enamadGift: true,
      totalServiceValueToman: 15150000
    },
    PRO_ANNUAL: {
      planName: "PRO_ANNUAL",
      nameFa: "حرفه‌ای Pro (سالانه)",
      salePrice: 24900000,
      priceToman: 24900000,
      originalValue: 29880000,
      discountPercentage: 17,
      savingsToman: 4980000,
      annualSavingVsMonthlyToman: 4980000,
      annualSavingVsMonthlyPercentage: 17,
      monthsFree: 2,
      hostingLabel: "هاست ابری فوق‌سریع ۱۵ گیگابایت NVMe سالانه در پکیج شما",
      enamadGift: true,
      totalServiceValueToman: 15150000,
      discountBadge: "پیشنهاد ویژه سالانه"
    },
    VIP_MONTHLY: {
      planName: "VIP_MONTHLY",
      nameFa: "ویژه VIP سازمانی (ماهانه)",
      salePrice: 599000,
      priceToman: 599000,
      originalValue: 2400000,
      discountPercentage: 75,
      savingsToman: 1801000,
      hostingLabel: "هاست ابری اختصاصی ۳۰ گیگابایت با ۹ هسته CPU در پکیج شما",
      enamadGift: true,
      torobIntegration: true
    },
    VIP_ANNUAL: {
      planName: "VIP_ANNUAL",
      nameFa: "ویژه VIP سازمانی (سالانه)",
      salePrice: 3999000,
      priceToman: 3999000,
      originalValue: 8500000,
      discountPercentage: 53,
      savingsToman: 4501000,
      annualSavingVsMonthlyToman: 3189000,
      annualSavingVsMonthlyPercentage: 44,
      monthsFree: 4,
      hostingLabel: "هاست ابری اختصاصی ۳۰ گیگابایت با ۹ هسته CPU سالانه در پکیج شما",
      enamadGift: true,
      torobIntegration: true,
      discountBadge: "بیشترین صرفه‌جویی سالانه"
    },
    valueStackServices: [
      { id: "domain", name: "ثبت و تخصیص دامنه دات آی‌آر اختصاصی (.ir)", value: 150000, included: true, order: 1 },
      { id: "theme", name: "قالب اورجینال و اختصاصی وودمارت (لایسنس فعال)", value: 2500000, included: true, order: 2 },
      { id: "hosting", name: "میزبانی ابری فوق‌سریع NVMe (۱ ساله)", value: 3600000, included: true, order: 3 },
      { id: "postal", name: "اتصال به پنل پستی هوشمند تاپین و ملی", value: 1200000, included: true, order: 4 },
      { id: "plugins", name: "نصب و فعال‌سازی افزونه‌های ضروری سئو و بهینه‌سازی", value: 1800000, included: true, order: 5 },
      { id: "config", name: "راه‌اندازی، تنظیمات فنی و کانفیگ اولیه فروشگاه", value: 1500000, included: true, order: 6 },
      { id: "support", name: "پشتیبانی فنی اختصاصی VIP (پاسخ‌گویی سریع)", value: 2000000, included: true, order: 7 },
      { id: "academy", name: "دوره آموزشی صفر تا صد مدیریت و فروش آنلاین", value: 2400000, included: true, order: 8 }
    ],
    totalServiceValueToman: 15150000,
    promotionConfig: {
      text: "پیشنهاد ویژه پرتاب موشکی زوپیت - با ظرفیت محدود!",
      start: null,
      end: null,
      visible: true,
      featuredPlan: "PRO_ANNUAL",
      discountBadge: "پیشنهاد ویژه سالانه",
      isExpired: false
    }
  };

  const activeConfigs = configs || defaultConfigs;
  const promoConfig = activeConfigs.promotionConfig;
  const countdown = usePromoCountdown(promoConfig?.end);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fa-IR").format(num);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto font-sans text-right" dir="rtl">
      
      {/* ======================= HEADER & CONVERSION PROMPT ======================= */}
      <div className="text-center space-y-4 pt-4">
        {/* Subtle dynamic feature pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>ارزش بی‌نظیر: خدمات مورد نیاز فروشگاه شما به صورت یکپارچه و هدیه</span>
        </div>

        {/* Catchy headline designed for high-conversion */}
        <div className="space-y-2 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            فروشگاه خود را با یک دهم هزینه‌های بازار راه‌اندازی کنید
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            زوپیت فقط یک فروشگاه‌ساز ساده نیست؛ ما تمام پیش‌نیازهای فنی، میزبانی ابری، درگاه‌های بانکی، ای‌نماد و قالب‌های ارزشمند تجاری را به صورت یکجا و هدیه روی پلن انتخابی شما تقدیم می‌کنیم.
          </p>
        </div>

        {/* Interactive Billing Toggle */}
        <div className="pt-2 flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 inline-flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => handleToggleBilling("MONTHLY")}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingCycle === "MONTHLY"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              پرداخت ماهانه
            </button>

            <button
              type="button"
              onClick={() => handleToggleBilling("ANNUAL")}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === "ANNUAL"
                  ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>پرداخت سالانه (پیشنهادی)</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {activeConfigs.PRO_ANNUAL?.discountBadge || "تخفیف ویژه"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================= DYNAMIC PROMOTIONAL COUNTDOWN BANNER ======================= */}
      {promoConfig?.visible && !countdown.isExpired && (
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-amber-500/10 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
            <div className="space-y-1.5 text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-amber-600" />
                  <span>{promoConfig.text}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed max-w-2xl font-normal">
                {promoConfig.end 
                  ? "این پیشنهاد تکرارنشدنی صرفاً تا زمان باقیمانده معتبر است و قیمت‌ها به حالت عادی باز خواهند گشت."
                  : "این تعرفه استثنایی صرفاً با پوشش حداقل هزینه‌های هاست ابری ارائه شده است. پیشنهاد ویژه را از دست ندهید."}
              </p>
            </div>

            {/* Live Countdown Display */}
            <div className="flex items-center gap-2 bg-white border border-amber-200 px-4 py-2.5 rounded-xl shadow-xs shrink-0" dir="ltr">
              <div className="text-center min-w-[2.4rem]">
                <div className="text-base sm:text-lg font-black font-mono text-slate-900 leading-tight">
                  {String(countdown.hours).padStart(2, '0')}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ساعت</div>
              </div>
              <span className="text-amber-500 font-bold text-sm animate-pulse">:</span>
              <div className="text-center min-w-[2.4rem]">
                <div className="text-base sm:text-lg font-black font-mono text-slate-900 leading-tight">
                  {String(countdown.minutes).padStart(2, '0')}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">دقیقه</div>
              </div>
              <span className="text-amber-500 font-bold text-sm animate-pulse">:</span>
              <div className="text-center min-w-[2.4rem]">
                <div className="text-base sm:text-lg font-black font-mono text-amber-600 leading-tight">
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
                <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">ثانیه</div>
              </div>
            </div>
          </div>

          {/* Strict Non-Misleading Disclaimer */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/50 flex items-start gap-1.5 text-[10px] text-slate-500 leading-relaxed font-normal">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>شفاف‌سازی قانونی:</strong> این شمارشگر صرفاً نمایانگر مدت اعتبار این کمپین تخفیفی راه‌اندازی است. خرید هر یک از اشتراک‌ها به صورت پرداخت اختیاری یکبارمصرف بوده و به هیچ‌وجه تمدید خودکار، تسویه اجباری یا برداشت اتوماتیک از کارت بانکی شما پس از سررسید انجام نخواهد شد.
            </span>
          </div>
        </div>
      )}

      {/* ======================= VALUE STACK VISUALIZATION (HERO CONVERSION) ======================= */}
      <div className="max-w-5xl mx-auto bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-8 relative overflow-hidden">
        {/* Subtle neon glow for luxury feel */}
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
            <Gem className="w-3.5 h-3.5 text-indigo-400" />
            <span>ارزش انباشته خدمات هدیه زوپیت</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">چرا خرید اشتراک زوپیت، سود محض است؟</h3>
          <p className="text-slate-400 text-xs max-w-2xl mx-auto leading-relaxed">
            در صورت خرید اشتراک حرفه‌ای زوپیت، تمام ملزومات ارزشمند زیر را به صورت کاملاً هدیه دریافت می‌کنید، بدون اینکه ریالی در خارج از زوپیت هزینه کنید:
          </p>
        </div>

        {/* Dynamic Service Value Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {activeConfigs.valueStackServices?.map((srv: any, idx: number) => (
            <div key={srv.id || idx} className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-colors duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                    ✓ رایگان روی اشتراک
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 leading-relaxed min-h-[2.5rem]">
                  {srv.name}
                </h4>
              </div>
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-normal">ارزش بازار:</span>
                <span className="font-extrabold text-slate-300">{formatNumber(srv.value)} تومان</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Math Summary */}
        <div className="bg-slate-800/90 border border-slate-700 p-5 sm:p-7 rounded-2xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <p className="text-xs text-slate-400">محاسبه نهایی سود شما:</p>
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-300">
                ارزش واقعی بازار برای خدمات فوق: <span className="line-through text-rose-500 font-bold">{formatNumber(activeConfigs.totalServiceValueToman)} تومان</span>
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-400 flex items-center justify-center md:justify-start gap-1">
                <span>مبلغ پرداختی شما:</span>
                <span className="text-2xl sm:text-3xl">
                  {billingCycle === "ANNUAL" 
                    ? formatNumber(activeConfigs.PRO_ANNUAL?.priceToman)
                    : formatNumber(activeConfigs.PRO_MONTHLY?.priceToman)}
                </span>
                <span className="text-xs">تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}</span>
              </div>
            </div>
          </div>

          <div className="text-center md:text-left shrink-0">
            <div className="bg-indigo-600 text-white p-4 rounded-xl space-y-1 border border-indigo-400/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-200">میزان سود و صرفه‌جویی شما:</div>
              <div className="text-2xl font-black text-white" dir="ltr">
                +{billingCycle === "ANNUAL" 
                  ? formatNumber(activeConfigs.PRO_ANNUAL?.savingsToman)
                  : formatNumber(activeConfigs.PRO_MONTHLY?.savingsToman)} تومان
              </div>
              <div className="text-[10px] text-emerald-300 font-bold">
                (کاهش هزینه تا {billingCycle === "ANNUAL" ? activeConfigs.PRO_ANNUAL?.discountPercentage : activeConfigs.PRO_MONTHLY?.discountPercentage} درصد در هزینه‌های شروع کار)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= PRICING CARDS ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
        
        {/* CARD 1: STARTUP PLAN (Only monthly, designed for absolute low barrier) */}
        <div
          onClick={() => handleSelect("STARTUP", "MONTHLY")}
          className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-white ${
            selectedPlan === "STARTUP"
              ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-500/5"
              : "border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md"
          }`}
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  کف قیمت بازار
                </span>
                {activeConfigs.STARTUP?.discountPercentage > 0 && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {activeConfigs.STARTUP.discountPercentage}٪ تخفیف
                  </span>
                )}
                {selectedPlan === "STARTUP" && (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    <Check className="w-3 h-3" /> انتخاب شده
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900">استارتاپ (تست اولیه)</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                پلن اقتصادی و ساده با تمرکز بر حداقل هزینه جهت تست بازار و راه‌اندازی سریع.
              </p>
            </div>

            {/* Price section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-2">
              {activeConfigs.STARTUP?.originalValue > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ارزش واقعی خدمات:</span>
                  <span className="line-through font-mono">{formatNumber(activeConfigs.STARTUP.originalValue)} تومان</span>
                </div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatNumber(activeConfigs.STARTUP?.salePrice || activeConfigs.STARTUP?.priceToman || 259000)}
                </span>
                <span className="text-xs font-bold text-slate-500">تومان / ماهانه</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{activeConfigs.STARTUP?.hostingLabel || "هاست ابری ۱۰ گیگابایت NVMe اختصاصی فروشگاه در پکیج شما"}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                فاقد دوره‌ی پرداخت سالانه؛ تمدید اختیاری ماهانه بدون کسر اتوماتیک.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-slate-800">مشخصات اصلی پلن استارتاپ:</p>
              <FeatureItem active>۱۰ گیگابایت هاست ابری پرسرعت NVMe</FeatureItem>
              <FeatureItem active>۳.۵ هسته پردازنده CPU و ۳ گیگابایت RAM</FeatureItem>
              <FeatureItem active>درگاه پرداخت مستقیم بانکی به نام خودتان</FeatureItem>
              <FeatureItem active>تشکیل پرونده مالیاتی سریع و اتوماتیک</FeatureItem>
              
              {/* Enamad separate charge disclosure */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-950 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    اخذ ای‌نماد توسط زوپیت
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                    + ۵۰,۰۰۰ تومان
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed font-normal">
                  با توجه به محاسبه استارتاپ در محدوده کف هزینه، ثبت نماد منوط به پرداخت ۵۰ هزار تومان تعرفه مصوب سامانه دولتی اینماد می‌باشد.
                </p>
              </div>

              <FeatureItem active>فروشگاه‌ساز استاندارد وودمارت</FeatureItem>
              <FeatureItem active>پشتیبانی تیکتی پاسخگویی عادی</FeatureItem>
              <FeatureItem active={false}>سیستم بکاپ‌گیری دوره‌ای منظم</FeatureItem>
              <FeatureItem active={false}>گرافیک و بنرهای تولیدی با هوش مصنوعی</FeatureItem>
              <FeatureItem active={false}>اتصال و همگام‌سازی رسمی به ترب</FeatureItem>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleProceed("STARTUP", "MONTHLY");
              }}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                selectedPlan === "STARTUP"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              <span>انتخاب پلن استارتاپ</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 2: PRO PLAN (HIGH CONVERSION HERO) */}
        <div
          onClick={() => handleSelect("PRO", billingCycle)}
          className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer bg-white lg:-translate-y-3 ${
            selectedPlan === "PRO"
              ? "border-2 border-indigo-600 shadow-xl ring-4 ring-indigo-500/10"
              : "border-2 border-indigo-200 hover:border-indigo-400 shadow-sm hover:shadow-lg"
          }`}
        >
          {/* Eye catching golden badge */}
          <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span>پیشنهاد پرطرفدار (بالاترین ارزش رشد)</span>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  کامل‌ترین پکیج فنی زوپیت
                </span>
                {selectedPlan === "PRO" && (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                    <Check className="w-3 h-3" /> انتخاب شده
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>پلن حرفه‌ای رشد</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-mono">PRO</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                سرعت لود سرسام‌آور، ربات‌های تولید هوشمند محتوا، بکاپ‌گیری دوره‌ای و ای‌نماد ۱۰۰٪ هدیه و رایگان.
              </p>
            </div>

            {/* Price container showing dynamic calculations */}
            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-2">
              {((billingCycle === "ANNUAL" ? activeConfigs.PRO_ANNUAL?.originalValue : activeConfigs.PRO_MONTHLY?.originalValue) || 0) > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ارزش واقعی خدمات:</span>
                  <span className="line-through font-mono">
                    {formatNumber(billingCycle === "ANNUAL" ? activeConfigs.PRO_ANNUAL?.originalValue : activeConfigs.PRO_MONTHLY?.originalValue)} تومان
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-950">
                  {billingCycle === "ANNUAL" 
                    ? formatNumber(activeConfigs.PRO_ANNUAL?.salePrice || activeConfigs.PRO_ANNUAL?.priceToman)
                    : formatNumber(activeConfigs.PRO_MONTHLY?.salePrice || activeConfigs.PRO_MONTHLY?.priceToman)}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}
                </span>
              </div>
              <div className="pt-1 border-t border-indigo-100 text-[10px] text-indigo-700 font-bold flex items-center gap-1">
                <Server className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>
                  {billingCycle === "ANNUAL"
                    ? (activeConfigs.PRO_ANNUAL?.hostingLabel || "هاست ابری فوق‌سریع ۱۵ گیگابایت NVMe سالانه در پکیج شما")
                    : (activeConfigs.PRO_MONTHLY?.hostingLabel || "هاست ابری فوق‌سریع ۱۵ گیگابایت NVMe در پکیج شما")}
                </span>
              </div>
              {billingCycle === "ANNUAL" ? (
                <div className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100/80 px-2.5 py-1.5 rounded-lg flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>مجموع قیمت سالانه به شدت کاهش یافته است!</span>
                  </div>
                  {activeConfigs.PRO_ANNUAL?.annualSavingVsMonthlyToman > 0 && (
                    <span className="text-[10px] text-emerald-700">
                      (کاهش واقعی {formatNumber(activeConfigs.PRO_ANNUAL.annualSavingVsMonthlyToman)} تومانی معادل {activeConfigs.PRO_ANNUAL.monthsFree} ماه استفاده کاملاً رایگان)
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  پرداخت ماهانه بدون تعهد بلندمدت؛ با قابلیت مهاجرت یا ارتقا به سالانه در هر زمان.
                </div>
              )}
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-indigo-950">خدمات و ملزومات هدیه روی پلن پرو:</p>
              <FeatureItem active highlight>۱۵ گیگابایت هاست ابری فوق‌سریع NVMe</FeatureItem>
              <FeatureItem active highlight>۵ هسته قدرتمند CPU و ۵ گیگابایت RAM</FeatureItem>
              <FeatureItem active highlight>ثبت و اخذ نماد اعتماد الکترونیکی (کاملاً رایگان و هدیه)</FeatureItem>
              <FeatureItem active highlight>سیستم پشتیبان‌گیری منظم اتوماتیک از هسته دیتابیس</FeatureItem>
              <FeatureItem active highlight>لوگوی اختصاصی + ۱۰ ویدیوی تیزر مارکتینگ تولیدی با هوش مصنوعی</FeatureItem>
              <FeatureItem active highlight>اتصال سریع به پنل‌های پیامکی و ارسال پیام تایید ورود</FeatureItem>
              <FeatureItem active highlight>پشتیبانی VIP تیکتی اولویت‌دار (زیر ۶ ساعت)</FeatureItem>
              <FeatureItem active={false}>اتصال اتوماتیک به ترب و بروزرسانی قیمت‌ها با وب‌سرویس</FeatureItem>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleProceed("PRO", billingCycle);
              }}
              className="w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.99]"
            >
              <span>انتخاب پلن حرفه‌ای Pro</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 3: VIP PLAN */}
        <div
          onClick={() => handleSelect("VIP", billingCycle)}
          className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-white ${
            selectedPlan === "VIP"
              ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-500/5"
              : "border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md"
          }`}
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-600" /> سازمانی و پربازدید
                </span>
                {selectedPlan === "VIP" && (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    <Check className="w-3 h-3" /> انتخاب شده
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>ویژه VIP</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">سازمانی</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                برای برندهای تثبیت شده، ترافیک بالا، اتصال بومی به ترب و سیستم‌های حسابداری پیشرفته.
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-2">
              {((billingCycle === "ANNUAL" ? activeConfigs.VIP_ANNUAL?.originalValue : activeConfigs.VIP_MONTHLY?.originalValue) || 0) > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ارزش واقعی خدمات:</span>
                  <span className="line-through font-mono">
                    {formatNumber(billingCycle === "ANNUAL" ? activeConfigs.VIP_ANNUAL?.originalValue : activeConfigs.VIP_MONTHLY?.originalValue)} تومان
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {billingCycle === "ANNUAL" 
                    ? formatNumber(activeConfigs.VIP_ANNUAL?.salePrice || activeConfigs.VIP_ANNUAL?.priceToman || 3999000)
                    : formatNumber(activeConfigs.VIP_MONTHLY?.salePrice || activeConfigs.VIP_MONTHLY?.priceToman || 599000)}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200/60 text-[10px] text-purple-700 font-bold flex items-center gap-1">
                <Server className="w-3 h-3 text-purple-600 shrink-0" />
                <span>
                  {billingCycle === "ANNUAL"
                    ? (activeConfigs.VIP_ANNUAL?.hostingLabel || "هاست ابری اختصاصی ۳۰ گیگابایت با ۹ هسته CPU سالانه در پکیج شما")
                    : (activeConfigs.VIP_MONTHLY?.hostingLabel || "هاست ابری اختصاصی ۳۰ گیگابایت با ۹ هسته CPU در پکیج شما")}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {billingCycle === "ANNUAL" 
                  ? (activeConfigs.VIP_ANNUAL?.annualSavingVsMonthlyPercentage ? `${activeConfigs.VIP_ANNUAL.annualSavingVsMonthlyPercentage}٪ صرفه‌جویی در حالت پرداخت سالانه` : "بیش از ۴۰٪ صرفه‌جویی در حالت پرداخت یکجای سالانه")
                  : "پشتیبانی اولویت‌دار متمایز تلفنی و تلگرامی"}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-slate-800">مزایای منحصر به فرد پلن VIP:</p>
              <FeatureItem active highlight>۳۰ گیگابایت هاست اختصاصی پرسرعت (۷ تا ۹ هسته CPU)</FeatureItem>
              <FeatureItem active highlight>فول بکاپ کامل فایل‌ها هر ۳ روز + بکاپ دیتابیس هر ۲۴ ساعت</FeatureItem>
              <FeatureItem active highlight>طراحی نامحدود بنرها، تصاویر و ویدیوهای تبلیغاتی هوش مصنوعی</FeatureItem>
              <FeatureItem active highlight>اتصال بومی و وب‌سرویسی به موتورهای ترب و ایمالز</FeatureItem>
              <FeatureItem active highlight>ثبت دامنه اختصاصی ir کاملاً رایگان به نام شما</FeatureItem>
              <FeatureItem active highlight>قالب‌های حرفه‌ای لایسنس‌دار اورجینال به انتخاب شما</FeatureItem>
              <FeatureItem active highlight>پشتیبانی مستقیم در تلگرام + تماس تلفنی + پشتیبانی تیکتی فوری</FeatureItem>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleProceed("VIP", billingCycle);
              }}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                selectedPlan === "VIP"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              <span>انتخاب پلن VIP</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================= COMPREHENSIVE FEATURES COMPARISON MATRIX ======================= */}
      <div className="pt-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xs overflow-hidden">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">جدول مقایسه جامع مشخصات و امکانات</h3>
                <p className="text-xs text-slate-500 mt-0.5">جزئیات ریز سخت‌افزار، زیرساخت، ابزارها و خدمات هر سه سطح</p>
              </div>
            </div>
            <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 self-start sm:self-auto">
              همه پلن‌ها مجهز به درگاه پرداخت مستقیم و پرونده مالیاتی سریع هستند
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 w-1/4">دسته‌بندی و ویژگی</th>
                  <th className="py-4 px-4 w-1/4 text-slate-800 text-sm font-bold">
                    استارتاپ (پایه)
                  </th>
                  <th className="py-4 px-4 w-1/4 text-indigo-600 text-sm font-bold bg-indigo-50/50 rounded-t-xl">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
                      رشد / حرفه‌ای (Pro)
                    </span>
                  </th>
                  <th className="py-4 px-4 w-1/4 text-slate-900 text-sm font-bold">
                    ویژه (VIP سازمانی)
                  </th>
                </tr>
              </thead>

              <tbody className="text-xs sm:text-sm divide-y divide-slate-100 font-normal">
                {/* 1. قیمت و دوره‌های پرداخت */}
                <CategoryHeader title="هزینه و دوره‌های اشتراک" icon={<CreditCard className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="قیمت در حالت ماهانه"
                  v1={<span className="font-bold text-slate-800">{formatNumber(activeConfigs.STARTUP?.salePrice || activeConfigs.STARTUP?.priceToman || 259000)} تومان</span>}
                  v2={<span className="font-bold text-indigo-600">{formatNumber(activeConfigs.PRO_MONTHLY?.salePrice || activeConfigs.PRO_MONTHLY?.priceToman)} تومان</span>}
                  v3={<span className="font-bold text-slate-900">{formatNumber(activeConfigs.VIP_MONTHLY?.salePrice || activeConfigs.VIP_MONTHLY?.priceToman || 599000)} تومان</span>}
                  isFeaturedColumn
                />
                <TableRow
                  title="قیمت در حالت سالانه"
                  v1={<span className="text-slate-400">تنها پرداخت ماهانه دارد</span>}
                  v2={
                    <div className="space-y-0.5">
                      <span className="font-bold text-indigo-600">{formatNumber(activeConfigs.PRO_ANNUAL?.salePrice || activeConfigs.PRO_ANNUAL?.priceToman)} تومان</span>
                      {activeConfigs.PRO_ANNUAL?.annualSavingVsMonthlyPercentage > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-bold">{activeConfigs.PRO_ANNUAL.annualSavingVsMonthlyPercentage}٪ صرفه‌جویی ویژه سالانه</span>
                      )}
                    </div>
                  }
                  v3={
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900">{formatNumber(activeConfigs.VIP_ANNUAL?.salePrice || activeConfigs.VIP_ANNUAL?.priceToman || 3999000)} تومان</span>
                      {activeConfigs.VIP_ANNUAL?.annualSavingVsMonthlyPercentage > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-bold">{activeConfigs.VIP_ANNUAL.annualSavingVsMonthlyPercentage}٪ صرفه‌جویی ویژه سالانه</span>
                      )}
                    </div>
                  }
                  isFeaturedColumn
                />

                {/* 2. زیرساخت و منابع سرور */}
                <CategoryHeader title="زیرساخت فروشگاه و منابع سرور" icon={<Server className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="منابع سخت‌افزاری هاست ابری"
                  v1="۱۰ گیگ NVMe (۳.۵ هسته CPU، ۳ گیگ RAM)"
                  v2={<span className="font-semibold text-slate-800">۱۵ گیگ NVMe (۵ هسته CPU، ۵ گیگ RAM)</span>}
                  v3={<span className="font-semibold text-slate-900">۳۰ گیگ (۷ هسته) یا ۱۵ گیگ (۹ هسته اختصاصی)</span>}
                  isFeaturedColumn
                />
                <TableRow
                  title="دامنه اینترنتی اختصاصی (.ir)"
                  v1="دامنه اختصاصی با معرفی کاربر"
                  v2="دامنه اختصاصی با معرفی کاربر"
                  v3={
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ثبت رایگان دامنه به نام مالک واقعی
                    </span>
                  }
                  isFeaturedColumn
                />

                {/* 3. پرداخت، مالی و امور اداری */}
                <CategoryHeader title="پرداخت و امور اداری" icon={<Shield className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="درگاه مستقیم بانکی و پرداخت اینترنتی"
                  v1={<StatusBadge status={true} text="اخذ رایگان به نام شما" />}
                  v2={<StatusBadge status={true} text="اخذ رایگان به نام شما" />}
                  v3={<StatusBadge status={true} text="اخذ رایگان به نام شما" />}
                  isFeaturedColumn
                />
                <TableRow
                  title="دریافت نماد اعتماد الکترونیکی (ای‌نماد)"
                  v1={
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        ۵۰,۰۰۰ تومان (تعرفه دولتی)
                      </span>
                      <span className="block text-[11px] text-slate-500 font-medium">مازاد بر کف قیمت استارتاپ</span>
                    </div>
                  }
                  v2={
                    <div className="space-y-0.5">
                      <StatusBadge status={true} text="رایگان (۱۰۰٪ هدیه زوپیت)" />
                      <span className="block text-[11px] text-emerald-700 font-medium">بدون کوچکترین هزینه مازاد</span>
                    </div>
                  }
                  v3={
                    <div className="space-y-0.5">
                      <StatusBadge status={true} text="رایگان (۱۰۰٪ هدیه زوپیت)" />
                      <span className="block text-[11px] text-emerald-700 font-medium">بدون کوچکترین هزینه مازاد</span>
                    </div>
                  }
                  isFeaturedColumn
                />
                <TableRow
                  title="تشکیل پرونده مالیاتی کسب‌وکار"
                  v1={<StatusBadge status={true} text="ثبت و تنظیم رایگان" />}
                  v2={<StatusBadge status={true} text="ثبت و تنظیم رایگان" />}
                  v3={<StatusBadge status={true} text="ثبت و تنظیم رایگان" />}
                  isFeaturedColumn
                />

                {/* 4. طراحی، قالب و سرعت */}
                <CategoryHeader title="طراحی، قالب و زیرساخت سایت" icon={<Palette className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="قالب و امکانات فروشگاهی"
                  v1="وودمارت استاندارد"
                  v2={<span className="font-semibold text-slate-800">وودمارت کانفیگ‌شده + بهینه‌سازی سرعت</span>}
                  v3={<span className="font-semibold text-slate-900">قالب پریمیوم سفارشی + لایسنس افزونه‌های پیشرفته</span>}
                  isFeaturedColumn
                />

                {/* 5. محتوا، گرافیک و هوش مصنوعی */}
                <CategoryHeader title="محتوا، گرافیک و هوش مصنوعی" icon={<Bot className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="تولید محتوا و ویدیوهای تبلیغاتی AI"
                  v1={<StatusBadge status={false} text="ندارد" />}
                  v2={<span className="font-semibold text-slate-800">طراحی لوگو + ۱۰ تیزر ویدیویی هوشمند در ماه</span>}
                  v3={<span className="font-semibold text-slate-900">لوگو + بنر + فیلم‌های تبلیغاتی AI نامحدود</span>}
                  isFeaturedColumn
                />

                {/* 6. بازاریابی و اتصال به سرویس‌ها */}
                <CategoryHeader title="بازاریابی و اتصال به پلتفرم‌ها" icon={<Globe className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="اتصال خودکار به موتورهای ترب و ایمالز"
                  v1={<StatusBadge status={false} text="ندارد" />}
                  v2={<StatusBadge status={false} text="نیاز به تهیه جداگانه" />}
                  v3={
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      اتصال رسمی و خودکار به ترب + ایمالز
                    </span>
                  }
                  isFeaturedColumn
                />

                {/* 7. پشتیبانی و امنیت */}
                <CategoryHeader title="پشتیبانی، امنیت و بکاپ" icon={<LifeBuoy className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="سیستم بکاپ‌گیری خودکار"
                  v1={<StatusBadge status={false} text="بدون بکاپ دوره‌ای خودکار" />}
                  v2={<StatusBadge status={true} text="بکاپ استاندارد دوره‌ای" />}
                  v3={
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      فول بکاپ ۳ روزه + دیتابیس ۲۴ ساعته
                    </span>
                  }
                  isFeaturedColumn
                />
                <TableRow
                  title="کانال پشتیبانی و سرعت پاسخگویی"
                  v1="پشتیبانی تیکتی پاسخگویی عادی"
                  v2={<span className="font-semibold text-indigo-700">تیکت VIP اولویت‌دار (زیر ۶ ساعت)</span>}
                  v3={<span className="font-semibold text-slate-900">مدیر اختصاصی تلگرام + تماس تلفنی + تیکت فوری</span>}
                  isFeaturedColumn
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================= HELPER SUB-COMPONENTS ======================= */

function CategoryHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <tr className="bg-slate-50/80">
      <td colSpan={4} className="py-3.5 px-4 border-y border-slate-200/70">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
          {icon}
          <span>{title}</span>
        </div>
      </td>
    </tr>
  );
}

function FeatureItem({
  active,
  highlight,
  children
}: {
  active: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 text-xs leading-relaxed ${
        active
          ? highlight
            ? "text-slate-900 font-semibold"
            : "text-slate-700 font-normal"
          : "text-slate-400 line-through decoration-slate-300"
      }`}
    >
      {active ? (
        <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
          <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
        </div>
      ) : (
        <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
          <X className="w-2.5 h-2.5 text-slate-400 stroke-[2]" />
        </div>
      )}
      <span>{children}</span>
    </div>
  );
}

function TableRow({
  title,
  v1,
  v2,
  v3,
  isFeaturedColumn
}: {
  title: string;
  v1: React.ReactNode;
  v2: React.ReactNode;
  v3: React.ReactNode;
  isFeaturedColumn?: boolean;
}) {
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="py-3.5 px-4 font-bold text-slate-700 text-xs sm:text-sm">{title}</td>
      <td className="py-3.5 px-4 text-slate-600 font-normal text-xs sm:text-sm">{v1}</td>
      <td
        className={`py-3.5 px-4 font-normal text-xs sm:text-sm ${
          isFeaturedColumn ? "bg-indigo-50/20 text-slate-800" : "text-slate-600"
        }`}
      >
        {v2}
      </td>
      <td className="py-3.5 px-4 text-slate-700 font-normal text-xs sm:text-sm">{v3}</td>
    </tr>
  );
}

function StatusBadge({ status, text }: { status: boolean; text: string }) {
  if (status) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
        <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
        </div>
        <span>{text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400 font-normal">
      <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        <X className="w-2.5 h-2.5 text-slate-400 stroke-[2]" />
      </div>
      <span>{text}</span>
    </span>
  );
}
