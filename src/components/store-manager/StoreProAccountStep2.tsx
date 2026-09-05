import React, { useState, useEffect } from "react";
import { ChevronRight, Server, ShieldCheck, Zap, Globe, Star, Clock, Lock, CreditCard, ChevronDown, CheckCircle2 } from "lucide-react";

export function StoreProAccountStep2({
  fullName,
  mobile,
  setFormStep,
  settings,
  hasDomainPriority,
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
}: any) {
  // New super premium dark UI
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60 - 1); // 24 hours countdown
  
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

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-slate-100" dir="rtl">
      {/* EXCLUSIVE BLACK/GOLD HERO SECTION */}
      <div className="relative rounded-[2.5rem] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden pt-8 pb-10 px-6 md:px-12 flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 inset-x-0 h-px w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4 max-w-4xl w-full">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full border-b border-slate-800/80 pb-6 mb-8 gap-4">
            <button
              onClick={() => setFormStep(1)}
              className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-900/50 px-4 py-2 rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
              بازگشت به ویرایش مشخصات
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-sm text-slate-300 font-medium">متقاضی: <strong className="text-white">{fullName}</strong></span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black tracking-widest uppercase border border-amber-500/20 mb-4">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            Zopit PRO MAX
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            ارتقاء به قدرتمندترین زیرساخت فروشگاهی
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mt-4">
            پکیج کامل نرم‌افزاری وودمارت پرو به همراه هاستینگ ابری NVMe و اتصال اختصاصی به ترب. در این مرحله، زیرساخت پرسرعت فروشگاه شما فعال می‌گردد.
          </p>

          {/* Countdown Timer (Visual urgency) */}
          <div className="mt-8 pt-6">
            <div className="inline-flex flex-col items-center justify-center p-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest px-4 py-1.5 bg-amber-500/10 rounded-t-xl w-full text-center border-b border-amber-500/10">
                فرصت طلایی با ۷۸٪ تخفیف
              </span>
              <div className="flex items-center gap-2 px-6 py-4 font-mono font-black text-3xl md:text-4xl text-white">
                <Clock className="w-6 h-6 text-slate-400 mr-2" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-20 -mt-8 px-4 md:px-8">
        
        {/* RIGHT COLUMN: The Features (Bento Grid) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 hover:border-amber-500/30 transition-colors shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">هاستینگ اختصاصی NVMe</h3>
                <span className="text-xs text-indigo-400 font-bold">معماری ابری LiteSpeed + Redis</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              سخت‌افزار قدرتمند کانفیگ‌شده اختصاصی برای وودمارت؛ لود زیر ۲ ثانیه را تجربه کنید. ۵ هسته پردازشی، ۵ گیگابایت رم و ۱۵ گیگابایت فضای ابری SSD.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-300 font-medium">پشتیبان‌گیری روزانه</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-300 font-medium">SSL رایگان</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl hover:border-amber-500/30 transition-colors">
              <Globe className="w-8 h-8 text-sky-400 mb-4" />
              <h4 className="font-black text-white mb-2">ثبت دامنه و هویت</h4>
              <p className="text-xs text-slate-400 leading-relaxed">دامنه اختصاصی با پسوند ir به نام خود شما ثبت شده و مالکیت ۱۰۰٪ فروشگاه به شما منتقل می‌گردد.</p>
            </div>
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl hover:border-amber-500/30 transition-colors">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
              <h4 className="font-black text-white mb-2">ای‌نماد و درگاه</h4>
              <p className="text-xs text-slate-400 leading-relaxed">انجام کلیه مراحل قانونی دریافت نماد اعتماد الکترونیک و درگاه مستقیم بانکی برای فروشگاه شما.</p>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Payment & Checkout */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 sm:p-8 sticky top-6 shadow-2xl flex flex-col h-full">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-amber-500" />
              صورتحساب و پرداخت
            </h3>

            {/* Discount Code */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="کد تخفیف (اختیاری)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-sm text-center tracking-widest text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all uppercase"
                  dir="ltr"
                  value={discountCodeText}
                  onChange={(e) => setDiscountCodeText(e.target.value.toUpperCase())}
                  disabled={isDiscountApplied}
                />
                <button
                  type="button"
                  onClick={applyDiscount}
                  disabled={isDiscountApplied || !discountCodeText.trim()}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-4 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isDiscountApplied ? "اعمال شد" : "اعمال کد"}
                </button>
              </div>
              {isDiscountApplied && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800 text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> تخفیف اعمال شد</span>
                  <button type="button" onClick={() => { setIsDiscountApplied(false); setDiscountCodeText(""); }} className="text-slate-500 hover:text-rose-400">حذف کد</button>
                </div>
              )}
            </div>

            {/* Invoice Line Items */}
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">نرم‌افزار پرو مکس (هدیه)</span>
                <span className="text-slate-500 line-through">۱۴,۸۰۰,۰۰۰</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium">سرویس هاستینگ NVMe (یکماهه)</span>
                <span className="text-white font-bold">{parseInt(settings?.promaxAccountPrice || "199000").toLocaleString()} <span className="text-[10px] text-slate-500">تومان</span></span>
              </div>
              {hasDomainPriority && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">ثبت دامنه اختصاصی (.ir)</span>
                  <span className="text-white font-bold">۸۰,۰۰۰ <span className="text-[10px] text-slate-500">تومان</span></span>
                </div>
              )}
              {hasEnamad && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">کارمزد اخذ ای‌نماد و درگاه</span>
                  <span className="text-white font-bold">۵۰,۰۰۰ <span className="text-[10px] text-slate-500">تومان</span></span>
                </div>
              )}
              
              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-sm text-amber-400 font-bold bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/10">
                  <span>تخفیف ویژه</span>
                  <span>- {appliedDiscount.toLocaleString()} <span className="text-[10px]">تومان</span></span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex justify-between items-end mb-6">
                <span className="text-slate-400 text-sm font-medium">مبلغ قابل پرداخت:</span>
                <div className="text-left">
                  <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">{calculatedAmount.toLocaleString()}</span>
                  <span className="text-xs text-amber-500/60 font-bold mr-1">تومان</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRegisterPro}
                disabled={submitting}
                className="w-full relative group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base md:text-lg py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"></div>
                
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال انتقال به درگاه...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>پرداخت امن و فعال‌سازی آنی</span>
                  </>
                )}
              </button>
              <div className="text-center mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                پرداخت شما توسط شبکه امن شاپرک و درگاه زرین‌پال تضمین می‌شود.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
