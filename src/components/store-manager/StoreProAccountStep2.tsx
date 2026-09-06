import React, { useState, useEffect } from "react";
import { 
  ChevronRight, 
  Server, 
  ShieldCheck, 
  Zap, 
  Star, 
  Clock, 
  Lock, 
  CreditCard, 
  CheckCircle2,
  Gift,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag
} from "lucide-react";

interface StoreProAccountStep2Props {
  fullName: string;
  mobile: string;
  setFormStep: (step: 1 | 2) => void;
  settings: any;
  hasEnamad: boolean;
  discountCodeText: string;
  setDiscountCodeText: (val: string) => void;
  isDiscountApplied: boolean;
  setIsDiscountApplied: (val: boolean) => void;
  applyDiscount: () => void;
  appliedDiscount: number;
  calculatedAmount: number;
  handleRegisterPro: () => void;
  submitting: boolean;
}

export function StoreProAccountStep2({
  fullName,
  mobile,
  setFormStep,
  settings,
  hasEnamad,
  discountCodeText,
  setDiscountCodeText,
  isDiscountApplied,
  setIsDiscountApplied,
  applyDiscount,
  appliedDiscount,
  calculatedAmount,
  handleRegisterPro,
  submitting
}: StoreProAccountStep2Props) {
  // 24-hour visual countdown for urgency
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 - 1);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const realHostPrice = parseInt(settings?.hostRenewalPrice || "900000", 10);
  const discountedHostPrice = parseInt(settings?.promaxAccountPrice || "299000", 10);
  const hostDiscountSavings = Math.max(0, realHostPrice - discountedHostPrice);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400 text-slate-100" dir="rtl">
      {/* EXCLUSIVE HERO SECTION */}
      <div className="relative rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden pt-8 pb-10 px-5 md:px-10 flex flex-col items-center text-center">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 inset-x-0 h-px w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4 max-w-3xl w-full">
          {/* Top Bar with Back Button & Applicant Name */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full border-b border-slate-800/80 pb-5 mb-6 gap-3">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-900/70 border border-slate-800 px-3.5 py-2 rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
              <span>بازگشت به ویرایش مشخصات متقاضی</span>
            </button>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>متقاضی تایید شده: <strong className="text-white font-bold">{fullName}</strong></span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black tracking-wider uppercase border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>گام دوم: صدور فاکتور و فعال‌سازی هاست ابری اختصاصی</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
            میزبانی ابری فوق‌سریع NVMe با ۶۷٪ تخفیف ویژه زوپیت
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            هزینه هاست اختصاصی ابری <strong className="text-slate-200">۹۰۰,۰۰۰ تومان</strong> است که در این مرحله با تخفیف ویژه فقط با <strong className="text-amber-400 font-bold">۲۹۹,۰۰۰ تومان</strong> برای فروشگاه شما فعال و تحویل می‌گردد.
          </p>

          {/* Countdown Box */}
          <div className="pt-4">
            <div className="inline-flex flex-col items-center justify-center p-1 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/60 shadow-xl">
              <span className="text-[10px] text-amber-400 font-bold tracking-wider px-4 py-1 bg-amber-500/10 rounded-t-xl w-full text-center border-b border-amber-500/10">
                فرصت طلایی تخفیف ۶۷٪ هاستینگ
              </span>
              <div className="flex items-center gap-2 px-5 py-2.5 font-mono font-black text-2xl md:text-3xl text-white">
                <Clock className="w-5 h-5 text-amber-400 mr-1" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: INFRASTRUCTURE INFO & CHECKOUT INVOICE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 px-2 md:px-4">
        
        {/* RIGHT COLUMN: What You Get in Cloud Host & Pro Max */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Hosting Feature Card */}
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-amber-500/30 transition-colors shadow-xl space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">مشخصات هاستینگ ابری NVMe اختصاصی</h3>
                <span className="text-xs text-indigo-400 font-bold">کانفیگ ویژه وردپرس + وب‌سرور LiteSpeed سازمانی</span>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              هاستینگ پرسرعت ابری زوپیت با پردازنده‌های پرقدرت و حافظه‌های NVMe Enterprise، سرعت لود زیر ۲ ثانیه را حتی در ترافیک‌های سنگین کمپین‌های ترب و اینستاگرام تضمین می‌کند.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">۵ هسته پردازشی CPU</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">۵ گیگابایت رم اختصاصی</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">۱۵ گیگ دیسک NVMe</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">گواهی SSL امن رایگان</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">بکاپ‌گیری روزانه خودکار</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">کش هوشمند Redis</span>
              </div>
            </div>
          </div>

          {/* Complementary Services Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>اتصال مستقیم به ترب (Torob)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                همگام‌سازی خودکار قیمت‌ها و موجودی کالاها در موتور جستجوی ترب بدون نیاز به پلاگین‌های پیچیده.
              </p>
            </div>

            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>پشتیبانی و به‌روزرسانی زوپیت</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                تیم فنی زوپیت کلیه امور نگهداری سرور، آپدیت‌های امنیتی و مانیتورینگ را به صورت ۲۴ ساعته مدیریت می‌کند.
              </p>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Checkout & Final Payment */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 sticky top-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>صورتحساب و فعال‌سازی هاست</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  تحویل فوری
                </span>
              </div>

              {/* Discount Code Input */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="کد تخفیف (در صورت داشتن)"
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-center tracking-widest text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 uppercase font-mono"
                    dir="ltr"
                    value={discountCodeText}
                    onChange={(e) => setDiscountCodeText(e.target.value.toUpperCase())}
                    disabled={isDiscountApplied}
                  />
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={isDiscountApplied || !discountCodeText.trim()}
                    className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isDiscountApplied ? "اعمال شد" : "اعمال کد"}
                  </button>
                </div>
                {isDiscountApplied && (
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5"/> کد با موفقیت اعمال شد
                    </span>
                    <button 
                      type="button" 
                      onClick={() => { setIsDiscountApplied(false); setDiscountCodeText(""); }} 
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      حذف کد
                    </button>
                  </div>
                )}
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">پکیج نرم‌افزاری وودمارت پرو (هدیه):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 line-through">۱۴,۸۰۰,۰۰۰</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">رایگان</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">هزینه واقعی هاستینگ ابری NVMe (ماهانه):</span>
                  <span className="text-slate-400 line-through">۹۰۰,۰۰۰ تومان</span>
                </div>

                <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-amber-300 font-bold">
                  <span>تخفیف ویژه زوپیت برای هاست (۶۷٪):</span>
                  <span>- ۶۰۱,۰۰۰ تومان</span>
                </div>

                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-200">هزینه نهایی هاستینگ با تخفیف:</span>
                  <span className="text-white font-bold">{discountedHostPrice.toLocaleString()} تومان</span>
                </div>

                {hasEnamad && (
                  <div className="flex justify-between items-center bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl text-indigo-300 font-medium">
                    <span>کارمزد اخذ ای‌نماد و درگاه بانکی:</span>
                    <span className="font-bold">+ ۵۰,۰۰۰ تومان</span>
                  </div>
                )}

                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-emerald-400 font-bold">
                    <span>تخفیف کوپن اختصاصی:</span>
                    <span>- {appliedDiscount.toLocaleString()} تومان</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Payable & Submit Button */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex justify-between items-baseline mb-5">
                <span className="text-slate-400 text-xs font-medium">مبلغ نهایی قابل پرداخت:</span>
                <div className="text-left">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                    {calculatedAmount.toLocaleString()}
                  </span>
                  <span className="text-xs text-amber-400/80 font-bold mr-1.5">تومان</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRegisterPro}
                disabled={submitting}
                className="w-full relative group bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال اتصال امن به درگاه شاپرک...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>پرداخت امن {calculatedAmount.toLocaleString()} تومان و تحویل آنی</span>
                  </>
                )}
              </button>

              <div className="text-center mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>پرداخت از طریق کلیه کارت‌های بانکی عضو شتاب در شبکه امن شاپرک</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
