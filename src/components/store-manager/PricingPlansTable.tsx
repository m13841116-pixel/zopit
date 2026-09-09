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
  ChevronDown,
  Info,
  Timer,
  Clock,
  Flame
} from "lucide-react";

export type PlanId = "STARTUP" | "PRO" | "VIP";
export type BillingCycle = "MONTHLY" | "ANNUAL";

// Custom hook to calculate remaining time until 24:00 (12 midnight) and auto-renew every midnight
export function useMidnightCountdown() {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59, 999);
      let diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        // Automatically renew for the next day's midnight (24:00)
        target.setDate(target.getDate() + 1);
        diff = target.getTime() - now.getTime();
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(externalBillingCycle || "MONTHLY");
  const countdown = useMidnightCountdown();

  useEffect(() => {
    if (externalBillingCycle && externalBillingCycle !== billingCycle) {
      setBillingCycle(externalBillingCycle);
    }
  }, [externalBillingCycle]);

  const handleToggleBilling = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    onSelectPlan(selectedPlan, cycle);
  };

  const handleSelect = (plan: PlanId, cycle: BillingCycle) => {
    onSelectPlan(plan, cycle);
  };

  const handleProceed = (plan: PlanId, cycle: BillingCycle) => {
    onSelectPlan(plan, cycle);
    onProceedToForm();
  };

  return (
    <div className="space-y-14 max-w-7xl mx-auto font-sans" dir="rtl">
      {/* ======================= HEADER & BILLING TOGGLE ======================= */}
      <div className="text-center space-y-5 pt-2">
        {/* Subtle Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>شفاف، بدون هزینه پنهان و آماده راه‌اندازی آنی</span>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            پلن‌های توسعه و زیرساخت اختصاصی فروشگاه
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-normal">
            از شروع کسب‌وکار نوپا تا تبدیل شدن به برند مطرح کشوری؛ هاست قدرتمند ابری NVMe، درگاه بانکی مستقیم، ای‌نماد و ابزارهای اختصاصی هوش مصنوعی.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="pt-2 flex justify-center">
          <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 inline-flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => handleToggleBilling("MONTHLY")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingCycle === "MONTHLY"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              پرداخت ماهانه
            </button>

            <button
              type="button"
              onClick={() => handleToggleBilling("ANNUAL")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === "ANNUAL"
                  ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>پرداخت سالانه</span>
              <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                تا ۸۰٪ صرفه‌جویی
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================= MIDNIGHT RESETTING COUNTDOWN BANNER ======================= */}
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-amber-500/10 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-amber-600" />
                ⚡ فرصت ویژه ثبت‌نام با نرخ پایه مصوب - مهلت استفاده از این تعرفه تا پایان امروز (ساعت ۲۴:۰۰)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">
              این تعرفه استثنایی صرفاً برای ثبت‌نام‌های امروز فعال بوده و پس از اتمام زمان باقیمانده، به پایان خواهد رسید.
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
            <span className="text-amber-500 font-bold text-sm">:</span>
            <div className="text-center min-w-[2.4rem]">
              <div className="text-base sm:text-lg font-black font-mono text-slate-900 leading-tight">
                {String(countdown.minutes).padStart(2, '0')}
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">دقیقه</div>
            </div>
            <span className="text-amber-500 font-bold text-sm">:</span>
            <div className="text-center min-w-[2.4rem]">
              <div className="text-base sm:text-lg font-black font-mono text-amber-600 leading-tight">
                {String(countdown.seconds).padStart(2, '0')}
              </div>
              <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">ثانیه</div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= PRICING CARDS ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        
        {/* CARD 1: STARTUP PLAN */}
        <div
          onClick={() => handleSelect("STARTUP", billingCycle)}
          className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-white ${
            selectedPlan === "STARTUP"
              ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-500/5"
              : "border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md"
          }`}
        >
          <div className="space-y-6">
            {/* Plan Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  شروع کسب‌وکار
                </span>
                {selectedPlan === "STARTUP" && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> انتخاب شده
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">استارتاپ</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                ویژه راه‌اندازی سریع فروشگاه برای افراد نوپا با حداقل هزینه تمام‌شده و امکانات پایه.
              </p>
            </div>

            {/* Price Box with Countdown */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {billingCycle === "ANNUAL" ? "۲,۴۹۰,۰۰۰" : "۲۵۹,۰۰۰"}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {billingCycle === "ANNUAL" ? "شامل ۲ ماه تخفیف رایگان (پرداخت سالانه)" : "پرداخت منعطف ماهانه با امکان تمدید یا ارتقا"}
              </p>
              <div className="flex items-center justify-between text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1 font-bold">
                  <Timer className="w-3 h-3 text-amber-600" />
                  <span>مهلت قیمت امروز:</span>
                </span>
                <span className="font-mono font-extrabold" dir="ltr">
                  {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-slate-700">امکانات اصلی پلن استارتاپ:</p>
              <FeatureItem active>۱۰ گیگابایت هاست ابری پرسرعت NVMe</FeatureItem>
              <FeatureItem active>۳.۵ هسته پردازنده CPU و ۳ گیگابایت RAM</FeatureItem>
              <FeatureItem active>درگاه مستقیم بانکی پرداخت (رایگان به نام شما)</FeatureItem>
              <FeatureItem active>تشکیل پرونده مالیاتی آنلاین (رایگان)</FeatureItem>
              
              {/* Enamad specific notice box */}
              <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs space-y-1 shadow-2xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    اخذ نماد اعتماد الکترونیکی (ای‌نماد)
                  </span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                    + ۵۰,۰۰۰ تومان
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  با توجه به محاسبه استارتاپ با <strong>کف قیمت</strong>، در صورت انتخاب ای‌نماد ۵۰ هزار تومان تعرفه مصوب سامانه دولتی اینماد دریافت شده و کلیه مراحل اداری توسط زوپیت پیگیری می‌شود.
                </p>
              </div>

              <FeatureItem active>فروشگاه‌ساز استاندارد وودمارت</FeatureItem>
              <FeatureItem active>پشتیبانی تیکتی استاندارد</FeatureItem>
              <FeatureItem active={false}>سیستم بکاپ‌گیری خودکار دوره‌ای</FeatureItem>
              <FeatureItem active={false}>خدمات طراحی لوگو و بنر با هوش مصنوعی</FeatureItem>
              <FeatureItem active={false}>اتصال خودکار به ترب و ایمالز</FeatureItem>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleProceed("STARTUP", billingCycle);
              }}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                selectedPlan === "STARTUP"
                  ? "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80"
              }`}
            >
              <span>انتخاب پلن استارتاپ</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 2: PRO PLAN (RECOMMENDED) */}
        <div
          onClick={() => handleSelect("PRO", billingCycle)}
          className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-white lg:-translate-y-2 ${
            selectedPlan === "PRO"
              ? "border-2 border-indigo-600 shadow-xl ring-4 ring-indigo-500/10"
              : "border-2 border-indigo-200 hover:border-indigo-400 shadow-md hover:shadow-lg"
          }`}
        >
          {/* Subtle Recommended Badge on Top */}
          <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
            <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm flex items-center gap-1.5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>پیشنهاد ویژه زوپیت</span>
            </div>
          </div>

          <div className="space-y-6 pt-1">
            {/* Plan Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  بالاترین ارزش خرید
                </span>
                {selectedPlan === "PRO" && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> انتخاب شده
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                رشد / حرفه‌ای <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">PRO</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                سرعت فوق‌العاده، ربات‌های هوش مصنوعی و اتوماسیون کامل برای جهش چشمگیر فروش.
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {billingCycle === "ANNUAL" ? "۳,۹۹۰,۰۰۰" : "۴۹۹,۰۰۰"}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}
                </span>
              </div>
              {billingCycle === "ANNUAL" ? (
                <div className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <BadgePercent className="w-3.5 h-3.5 text-indigo-600" />
                  <span>شامل تخفیف ویژه خرید سالانه (صرفه‌جویی چشمگیر)</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-medium">
                  پرداخت منعطف ماهانه با امکان تمدید یا ارتقا
                </div>
              )}
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-indigo-900">تمامی امکانات استارتاپ، به‌علاوه:</p>
              <FeatureItem active highlight>۱۵ گیگابایت هاست ابری فوق‌سریع NVMe</FeatureItem>
              <FeatureItem active highlight>۵ هسته قدرتمند CPU و ۵ گیگابایت RAM</FeatureItem>
              <FeatureItem active highlight>سیستم بکاپ استاندارد دوره‌ای دیتابیس و فایل</FeatureItem>
              <FeatureItem active highlight>طراحی هوشمند لوگو + ۱۰ ویدیوی تبلیغاتی AI در ماه</FeatureItem>
              <FeatureItem active highlight>قالب وودمارت کانفیگ‌شده + پکیج اختصاصی بهینه‌سازی سرعت</FeatureItem>
              <FeatureItem active highlight>سامانه پیامک هوشمند و ارسال کد تایید خودکار</FeatureItem>
              <FeatureItem active highlight>پشتیبانی ویژه تیکتی (پاسخ سریع زیر ۶ ساعت)</FeatureItem>
              <FeatureItem active={false}>اتصال مستقیم با وب‌سرویس به ترب و ایمالز</FeatureItem>
              
              <div className="mt-3 pt-2.5 border-t border-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>+ شامل تمامی امکانات و زیرساخت‌های پلن استارت‌آپ</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleProceed("PRO", billingCycle);
              }}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.99]"
            >
              <span>انتخاب پلن حرفه‌ای (Pro)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 3: VIP PLAN */}
        <div
          onClick={() => handleSelect("VIP", billingCycle)}
          className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer bg-white ${
            selectedPlan === "VIP"
              ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-500/5"
              : "border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md"
          }`}
        >
          <div className="space-y-6">
            {/* Plan Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-600" /> سازمانی و پرفروش
                </span>
                {selectedPlan === "VIP" && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> انتخاب شده
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                ویژه VIP <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">سازمانی</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                برای برندهای پرفروش، ترافیک میلیونی و فروشگاه‌های پیشرفته با پشتیبانی اختصاصی.
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {billingCycle === "ANNUAL" ? "۹,۹۰۰,۰۰۰" : "۱,۲۹۰,۰۰۰"}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  تومان / {billingCycle === "ANNUAL" ? "سالانه" : "ماهانه"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {billingCycle === "ANNUAL" ? "بیش از ۴۰٪ صرفه‌جویی در پرداخت یکجا" : "پشتیبانی اختصاصی و اولویت حداکثری"}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-slate-700">تمامی امکانات پلن رشد، به‌علاوه:</p>
              <FeatureItem active highlight>۳۰ گیگابایت هاست اختصاصی (۷ هسته) یا ۱۵ گیگابایت (۹ هسته)</FeatureItem>
              <FeatureItem active highlight>بکاپ خودکار کامل هر ۳ روز + بکاپ دیتابیس هر ۲۴ ساعت</FeatureItem>
              <FeatureItem active highlight>طراحی نامحدود بنر، لوگو و ویدیوهای تبلیغاتی هوش مصنوعی</FeatureItem>
              <FeatureItem active highlight>اتصال و یکپارچه‌سازی کامل به موتورهای ترب و ایمالز</FeatureItem>
              <FeatureItem active highlight>ثبت دامنه اختصاصی ir به نام مالک با هزینه رایگان</FeatureItem>
              <FeatureItem active highlight>قالب و افزونه‌های پریمیوم لایسنس‌دار نامحدود</FeatureItem>
              <FeatureItem active highlight>پشتیبانی مستقیم تلگرام + تماس + تیکت اولویت فوری</FeatureItem>
              
              <div className="mt-3 pt-2.5 border-t border-purple-100 text-purple-700 font-extrabold text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>+ شامل تمامی امکانات و امکانات پیشرفته پلن رشد</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleProceed("VIP", billingCycle);
              }}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                selectedPlan === "VIP"
                  ? "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80"
              }`}
            >
              <span>انتخاب پلن VIP سازمانی</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================= FEATURE COMPARISON TABLE ======================= */}
      <div className="pt-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs overflow-hidden">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">جدول مقایسه جامع مشخصات و امکانات</h3>
                <p className="text-xs text-slate-500 mt-0.5">جزئیات ریز سخت‌افزار، زیرساخت، ابزارها و خدمات هر سه سطح</p>
              </div>
            </div>
            <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-100 self-start sm:self-auto">
              همه پلن‌ها شامل درگاه بانکی مستقیم و ای‌نماد هستند
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
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
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
                  v1={<span className="font-bold text-slate-800">۲۵۹,۰۰۰ تومان</span>}
                  v2={<span className="font-bold text-indigo-600">۴۹۹,۰۰۰ تومان</span>}
                  v3={<span className="font-bold text-slate-900">۱,۲۹۰,۰۰۰ تومان</span>}
                  isFeaturedColumn
                />
                <TableRow
                  title="قیمت در حالت سالانه"
                  v1={<span className="font-bold text-slate-800">۲,۴۹۰,۰۰۰ تومان</span>}
                  v2={
                    <div className="space-y-0.5">
                      <span className="font-bold text-indigo-600">۳,۹۹۰,۰۰۰ تومان</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">۲ ماه رایگان (تخفیف ویژه)</span>
                    </div>
                  }
                  v3={<span className="font-bold text-slate-900">۹,۹۰۰,۰۰۰ تومان</span>}
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
                      دامنه اختصاصی + ثبت رایگان به نام مالک
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
                      <StatusBadge status={true} text="رایگان (تقبل ۱۰۰٪ توسط زوپیت)" />
                      <span className="block text-[11px] text-emerald-700 font-medium">بدون هیچ هزینه مازاد</span>
                    </div>
                  }
                  v3={
                    <div className="space-y-0.5">
                      <StatusBadge status={true} text="رایگان (تقبل ۱۰۰٪ توسط زوپیت)" />
                      <span className="block text-[11px] text-emerald-700 font-medium">بدون هیچ هزینه مازاد</span>
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
                  v2={<span className="font-semibold text-slate-800">وودمارت کانفیگ‌شده + پکیج افزایش سرعت</span>}
                  v3={<span className="font-semibold text-slate-900">قالب پریمیوم سفارشی + لایسنس افزونه‌های پیشرفته</span>}
                  isFeaturedColumn
                />

                {/* 5. محتوا، گرافیک و هوش مصنوعی */}
                <CategoryHeader title="محتوا، گرافیک و هوش مصنوعی" icon={<Bot className="w-4 h-4 text-slate-500" />} />
                <TableRow
                  title="تولید محتوا و ویدیوهای تبلیغاتی AI"
                  v1={<StatusBadge status={false} text="ندارد" />}
                  v2={<span className="font-semibold text-slate-800">طراحی لوگو + ۱۰ ویدیوی AI تبلیغاتی در ماه</span>}
                  v3={<span className="font-semibold text-slate-900">لوگو + بنر + ویدیوهای مارکتینگ AI نامحدود</span>}
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
                  v1="پشتیبانی تیکتی استاندارد"
                  v2={<span className="font-semibold text-indigo-700">تیکت VIP اولویت‌دار (پاسخ زیر ۶ ساعت)</span>}
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
      <td colSpan={4} className="py-3 px-4 border-y border-slate-200/70">
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
      <td className="py-3.5 px-4 font-medium text-slate-700">{title}</td>
      <td className="py-3.5 px-4 text-slate-600">{v1}</td>
      <td
        className={`py-3.5 px-4 ${
          isFeaturedColumn ? "bg-indigo-50/30 text-slate-800" : "text-slate-600"
        }`}
      >
        {v2}
      </td>
      <td className="py-3.5 px-4 text-slate-700">{v3}</td>
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
