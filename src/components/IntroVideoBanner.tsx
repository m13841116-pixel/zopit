import React, { useState } from "react";
import { Play, Sparkles, X, Truck, ShieldCheck, Layers, Store, Building2 } from "lucide-react";
import heroImage from "../assets/images/zopit_b2b_hero_1785266004043.jpg";

interface IntroVideoBannerProps {
  onOpenStoreLogin?: () => void;
  videoUrl?: string; // Optional custom video URL (MP4 or embed)
  className?: string;
}

export const IntroVideoBanner: React.FC<IntroVideoBannerProps> = ({
  onOpenStoreLogin,
  videoUrl,
  className = "",
}) => {
  const [isPlayingModalOpen, setIsPlayingModalOpen] = useState(false);

  return (
    <>
      {/* Intro Teaser Card */}
      <div 
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-slate-900 to-indigo-950 border border-white/10 shadow-2xl p-4 md:p-6 my-4 mx-4 md:mx-6 group ${className}`}
        dir="rtl"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Text & B2B Benefits for Store Managers */}
          <div className="lg:col-span-7 space-y-3.5 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ویدئوی معرفی پلتفرم B2B زوپیت</span>
            </div>

            <h2 className="text-lg md:text-xl font-black text-white leading-snug">
              اتصال فروشگاه شما به صدها تامین‌کننده دست اول کالا
            </h2>

            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
              تامین مستقیم، قیمت عمده و رقابتی، بدون خواب سرمایه و ارسال خودکار بسته‌ها به آدرس خریداران فروشگاه شما.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/5 text-[11px] font-bold text-zinc-300">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                ویژه مدیران فروشگاه و پیج‌ها
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/5 text-[11px] font-bold text-zinc-300">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                ارسال مستقیم با نام فروشگاه شما
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/5 text-[11px] font-bold text-zinc-300">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                تنوع بیش از ده‌ها هزار قلم کالا
              </span>
            </div>
          </div>

          {/* Video Preview Thumbnail / Player Trigger */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div 
              onClick={() => setIsPlayingModalOpen(true)}
              className="relative w-full max-w-[340px] h-44 rounded-2xl overflow-hidden border border-white/15 shadow-xl cursor-pointer group/thumb transform group-hover/thumb:scale-[1.02] transition-all duration-300"
            >
              {/* Poster image */}
              <img 
                src={heroImage} 
                alt="زوپیت - پلتفرم B2B تامین کالا" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-700 brightness-90"
              />

              {/* Dark overlay & Play Button */}
              <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg shadow-rose-600/50 group-hover/thumb:scale-115 transition-transform duration-300 border-2 border-white/40">
                  <Play className="w-6 h-6 fill-current text-white translate-x-[-1px]" />
                </div>
              </div>

              {/* Bottom Badge */}
              <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-bold text-white border border-white/10">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  پیش‌نمایش معرفی زوپیت
                </span>
                <span className="text-zinc-400">۱ دقیقه</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Player */}
      {isPlayingModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsPlayingModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl bg-zinc-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <h3 className="text-sm font-black text-white">معرفی نحوه همکاری و تامین کالا برای فروشگاه‌ها</h3>
              </div>
              <button 
                onClick={() => setIsPlayingModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player or Fallback Teaser */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              {videoUrl ? (
                <iframe
                  src={videoUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  title="ویدیو معرفی زوپیت"
                />
              ) : (
                <div className="relative w-full h-full">
                  <img 
                    src={heroImage} 
                    alt="معرفی زوپیت" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover brightness-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white space-y-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className="w-16 h-16 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center">
                      <Store className="w-8 h-8 text-rose-400" />
                    </div>
                    <div className="space-y-1.5 max-w-lg">
                      <h4 className="text-lg md:text-xl font-black">پلتفرم B2B تامین کالا برای فروشگاه‌داران</h4>
                      <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                        این ویدیو پس از تولید کامل جایگزین خواهد شد. شما می‌توانید از طریق پنل مدیریت فروشگاه، کاتالوگ محصولات عمده را به فروشگاه خود متصل کنید.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with quick actions */}
            <div className="p-4 bg-zinc-900/80 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-zinc-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>زوپیت؛ حلقه اتصال زنجیره تامین و فروشگاه‌های اینترنتی</span>
              </div>
              <button
                onClick={() => setIsPlayingModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all cursor-pointer"
              >
                بستن و مرور کاتالوگ کالاها
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
