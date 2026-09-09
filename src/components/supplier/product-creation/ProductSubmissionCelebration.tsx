import React from "react";
import {
  Sparkles,
  CheckCircle2,
  Plus,
  Package,
  Store,
  Clock,
  ArrowLeft,
  ChevronLeft
} from "lucide-react";

interface ProductSubmissionCelebrationProps {
  isOpen: boolean;
  productName: string;
  onAddAnother: () => void;
  onViewProducts: () => void;
}

export function ProductSubmissionCelebration({
  isOpen,
  productName,
  onAddAnother,
  onViewProducts,
}: ProductSubmissionCelebrationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-card border border-subtle rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center space-y-6 shadow-2xl animate-scale-up text-right"
        dir="rtl"
      >
        {/* Animated Celebration Badge */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 bg-amber-400 text-slate-950 rounded-2xl animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-black text-primary">
            عالیه! محصول با موفقیت ثبت شد 🎉
          </h2>
          <p className="text-sm font-extrabold text-primary-default">
            «{productName || "محصول جدید شما"}»
          </p>
          <p className="text-xs text-secondary leading-relaxed max-w-md mx-auto pt-2">
            کالای شما در صف اول بررسی ناظران کیفیت زوپیت قرار گرفت. پس از تایید نهایی و تعیین مارجین رقابتی، به صدها فروشگاه فعال معرفی و در دسترس خریداران عمده قرار خواهد گرفت.
          </p>
        </div>

        {/* Timeline / Next Steps Card */}
        <div className="bg-surface border border-subtle rounded-2xl p-4 space-y-3 text-right">
          <div className="flex items-center gap-2 text-xs font-black text-primary">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>مراحل بعدی چیست؟</span>
          </div>

          <div className="space-y-2 text-xs text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black flex items-center justify-center shrink-0">
                ۱
              </span>
              <span>بررسی مشخصات و تصاویر توسط ناظر کاتالوگ (کمتر از ۲۴ ساعت)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">
                ۲
              </span>
              <span>تنظیم خودکار قیمت فروشگاهی و مارجین زوپیت</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-black flex items-center justify-center shrink-0">
                ۳
              </span>
              <span>انتشار در کاتالوگ و شروع دریافت سفارش‌های عمده</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onAddAnother}
            className="w-full py-3.5 bg-primary-default hover:bg-primary-hover text-inverse rounded-2xl text-sm font-black shadow-md shadow-primary-default/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ افزودن محصول بعدی</span>
          </button>

          <button
            type="button"
            onClick={onViewProducts}
            className="w-full py-3 bg-surface hover:bg-subtle text-secondary border border-subtle rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>مشاهده لیست و وضعیت محصولات من</span>
          </button>
        </div>
      </div>
    </div>
  );
}
