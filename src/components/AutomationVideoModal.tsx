import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Sparkles, 
  X, 
  Truck, 
  ShieldCheck, 
  Layers, 
  Store, 
  Building2, 
  CheckCircle2, 
  Zap, 
  Clock, 
  ExternalLink,
  RotateCcw
} from "lucide-react";
import heroImage from "../assets/images/zopit_b2b_hero_1785266004043.jpg";

interface AutomationVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "SUPPLIER" | "STORE_MANAGER" | "GUEST";
}

export const AutomationVideoModal: React.FC<AutomationVideoModalProps> = ({
  isOpen,
  onClose,
  role
}) => {
  const [videoConfig, setVideoConfig] = useState<{
    supplierVideoUrl: string;
    storeVideoUrl: string;
  }>({
    supplierVideoUrl: "",
    storeVideoUrl: ""
  });

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      fetch("/api/config")
        .then((res) => {
          if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
          return res.json();
        })
        .then((data) => {
          if (data && !data.error) {
            setVideoConfig({
              supplierVideoUrl: data.SUPPLIER_AUTOMATION_VIDEO || data.INTRO_VIDEO_URL || "",
              storeVideoUrl: data.STORE_AUTOMATION_VIDEO || data.INTRO_VIDEO_URL || ""
            });
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSupplier = role === "SUPPLIER";

  const videoSrc = isSupplier ? videoConfig.supplierVideoUrl : videoConfig.storeVideoUrl;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col text-right relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Zap className="w-5 h-5 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {isSupplier ? "آموزش ۱ دقیقه‌ای تأمین‌کنندگان" : "آموزش ۱ دقیقه‌ای مدیران فروشگاه"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ۶۰ ثانیه
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {isSupplier 
                  ? "چگونه سفارشات از صدها فروشگاه ثبت و مستقیماً به انبار شما متصل می‌شوند؟" 
                  : "چگونه بدون دغدغه انبارداری و ارسال، به صدها تامین‌کننده متصل شوید؟"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              autoPlay
              className="w-full h-full object-contain"
              poster={heroImage}
            />
          ) : (
            <div className="relative w-full h-full">
              <img
                src={heroImage}
                alt="Zopit Automation Overview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/40 to-transparent flex flex-col justify-between p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-black self-start">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>پرزنتر اتوماسیون زوپیت</span>
                </div>

                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center mx-auto shadow-xl shadow-rose-600/50 hover:scale-110 transition-transform cursor-pointer border-2 border-white/40">
                    <Play className="w-7 h-7 fill-current translate-x-[-2px]" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">
                      {isSupplier ? "فرآیند خودکار دریافت سفارش، صدور لیبل و تسویه" : "فرآیند خودکار ثبت سفارش در ووکامرس و ارسال به مشتری"}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium mt-1">
                      سیستم یکپارچه لجستیک، تسویه حساب بانکی و مدیریت زنجیره تامین
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <span>🎥 کیفیت Full HD</span>
                  <span>مدت زمان: ۶۰ ثانیه</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4 Pillars of Automation Breakdown */}
        <div className="p-5 bg-slate-950 space-y-3">
          <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isSupplier ? "۴ گام اتوماسیون برای تأمین‌کننده:" : "۴ گام اتوماسیون برای فروشگاه:"}
          </h4>

          {isSupplier ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">۱</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">ثبت محصولات با قیمت عمده</p>
                  <p className="text-[10px] text-slate-400">کالاهای شما در ویترین صدها فروشگاه قرار می‌گیرد.</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs shrink-0">۲</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">دریافت خودکار سفارشات</p>
                  <p className="text-[10px] text-slate-400">پیامک و اعلان سفارش جدید آنی برای شما ارسال می‌شود.</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">۳</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">چاپ برچسب پستی با یک کلیک</p>
                  <p className="text-[10px] text-slate-400">لیبل استاندارد پستی آماده الصاق روی کارتن کالا.</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">۴</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">واریز اتوماتیک وجه به شبا</p>
                  <p className="text-[10px] text-slate-400">مبلغ سفارش مستقیماً به شماره شبای شما واریز می‌گردد.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">۱</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">اتصال آسان به ووکامرس</p>
                  <p className="text-[10px] text-slate-400">همگام‌سازی موجودی و قیمت هزاران کالا در چند ثانیه.</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs shrink-0">۲</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">فروش بدون انبارداری</p>
                  <p className="text-[10px] text-slate-400">بدون نیاز به خرید عمده و بلوکه شدن سرمایه شخصی.</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">۳</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">ارسال با نام برند شما</p>
                  <p className="text-[10px] text-slate-400">بسته‌بندی و ارسال مستقیم به دست خریدار با برند شما.</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">۴</div>
                <div>
                  <p className="text-xs font-bold text-slate-200">سود خالص و تضمین تحویل</p>
                  <p className="text-[10px] text-slate-400">کد رهگیری پستی به خریدار پیامک و سفارش تحویل داده می‌شود.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
