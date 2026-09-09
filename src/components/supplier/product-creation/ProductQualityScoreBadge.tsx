import React from "react";
import { CheckCircle2, Sparkles, HelpCircle, AlertTriangle, ArrowUpRight } from "lucide-react";

export interface QualityAnalysis {
  score: number;
  grade: "POOR" | "GOOD" | "EXCELLENT";
  completedCount: number;
  totalCheckpoints: number;
  remainingCount: number;
  tips: string[];
  checklist: Array<{
    id: string;
    label: string;
    isMet: boolean;
    weight: number;
    tip: string;
  }>;
}

export function computeProductQuality(formData: any, techSpecs: any[] = []): QualityAnalysis {
  const checklist = [
    {
      id: "name",
      label: "نام دقیق و مدل کالا (حداقل ۸ کاراکتر)",
      isMet: Boolean(formData.name && formData.name.trim().length >= 8),
      weight: 15,
      tip: "نام کالا را همراه با مدل و مشخصه اصلی بنویسید (مثال: هندزفری بلوتوثی هایلو T15).",
    },
    {
      id: "category",
      label: "انتخاب دسته‌بندی مناسب",
      isMet: Boolean(formData.categoryId && String(formData.categoryId).trim() !== ""),
      weight: 10,
      tip: "دسته‌بندی دقیق باعث نمایش در نتایج جستجوی مرتبط فروشگاه‌ها می‌شود.",
    },
    {
      id: "images_primary",
      label: "تصویر اصلی با کیفیت و زمینه روشن",
      isMet: Boolean(formData.mainImage || (formData.images && formData.images.length > 0)),
      weight: 10,
      tip: "تصویر اصلی اولین فاکتور در تصمیم‌گیری مدیران فروشگاه برای انتخاب محصول است.",
    },
    {
      id: "images_multiple",
      label: "حداقل ۳ تصویر از زوایای مختلف",
      isMet: Boolean(formData.images && formData.images.length >= 3),
      weight: 10,
      tip: "افزودن ۳ تصویر واضح شانس سفارش عمده توسط فروشگاه‌ها را تا ۴۰٪ افزایش می‌دهد.",
    },
    {
      id: "price_stock",
      label: "قیمت پایه و موجودی انبار معتبر",
      isMet: Boolean(
        formData.supplierBasePrice &&
        parseFloat(String(formData.supplierBasePrice).replace(/[,]/g, "")) > 0 &&
        (formData.variants?.length > 0 || parseInt(String(formData.stock || "0"), 10) > 0)
      ),
      weight: 15,
      tip: "قیمت رقابتی عمده‌فروشی و اعلام دقیق موجودی انبار، رضایت خریداران را تضمین می‌کند.",
    },
    {
      id: "description",
      label: "توضیحات معرفی و کاربرد (حداقل ۳۰ کاراکتر)",
      isMet: Boolean(
        (formData.shortDescription && formData.shortDescription.trim().length >= 20) ||
        (formData.longDescription && formData.longDescription.trim().length >= 30)
      ),
      weight: 15,
      tip: "توضیح کوتاه و جذاب بنویسید یا از هوش مصنوعی برای تولید توضیحات استفاده کنید.",
    },
    {
      id: "specs",
      label: "مشخصات فنی و ویژگی‌های ساختاری (حداقل ۲ مورد)",
      isMet: Boolean(
        (techSpecs && techSpecs.filter((s: any) => s.key?.trim() && s.value?.trim()).length >= 2) ||
        (formData.variants && formData.variants.length > 1)
      ),
      weight: 10,
      tip: "ابعاد، جنس، توان، پورت‌ها و سایر مشخصات فنی به فروشگاه‌ها در فروش به خریدار نهایی کمک می‌کند.",
    },
    {
      id: "warranty_auth",
      label: "تعیین شفاف گارانتی و اصالت کالا",
      isMet: Boolean(formData.warranty || formData.isAuthenticGuaranteed),
      weight: 10,
      tip: "مشخص کردن گارانتی و تایید اصالت کالا اعتماد خریداران عمده را دوچندان می‌کند.",
    },
    {
      id: "wholesale_tiers",
      label: "تخفیف پله‌ای خرید تعداد بالا",
      isMet: Boolean(
        formData.isWholesaleEnabled &&
        formData.wholesaleTiers &&
        formData.wholesaleTiers.length > 0 &&
        formData.wholesaleTiers.some((t: any) => parseFloat(t.unitPrice) > 0)
      ),
      weight: 5,
      tip: "تخفیف پله‌ای باعث می‌شود فروشگاه‌ها حجم سفارش خود را به جای ۱۰ عدد به ۵۰ یا ۱۰۰ عدد افزایش دهند.",
    },
  ];

  let totalScore = 0;
  let completedCount = 0;
  const tips: string[] = [];

  checklist.forEach((item) => {
    if (item.isMet) {
      totalScore += item.weight;
      completedCount += 1;
    } else {
      tips.push(item.tip);
    }
  });

  const cappedScore = Math.min(Math.max(totalScore, 0), 100);
  const grade: "POOR" | "GOOD" | "EXCELLENT" =
    cappedScore >= 80 ? "EXCELLENT" : cappedScore >= 50 ? "GOOD" : "POOR";

  return {
    score: cappedScore,
    grade,
    completedCount,
    totalCheckpoints: checklist.length,
    remainingCount: checklist.length - completedCount,
    tips,
    checklist,
  };
}

interface ProductQualityScoreBadgeProps {
  formData: any;
  techSpecs?: any[];
  compact?: boolean;
  onOpenDetails?: () => void;
}

export function ProductQualityScoreBadge({
  formData,
  techSpecs = [],
  compact = false,
  onOpenDetails,
}: ProductQualityScoreBadgeProps) {
  const analysis = computeProductQuality(formData, techSpecs);

  const getScoreColor = () => {
    if (analysis.grade === "EXCELLENT") {
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-600 dark:text-emerald-400",
        progressBg: "bg-emerald-500",
        badge: "کیفیت عالی (اولویت بالا در نمایش)",
      };
    }
    if (analysis.grade === "GOOD") {
      return {
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/30",
        text: "text-indigo-600 dark:text-indigo-400",
        progressBg: "bg-indigo-500",
        badge: "کیفیت مناسب",
      };
    }
    return {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      progressBg: "bg-amber-500",
      badge: "نیاز به تکمیل اطلاعات",
    };
  };

  const style = getScoreColor();

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${style.bg} ${style.border}`}
        dir="rtl"
      >
        <div className="relative flex items-center justify-center">
          <div className={`w-8 h-8 rounded-full border-2 ${style.border} flex items-center justify-center font-black text-xs ${style.text}`}>
            {analysis.score}٪
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black ${style.text}`}>
              کیفیت کالا: {analysis.score}٪
            </span>
            <span className="text-[10px] text-muted hidden sm:inline">
              ({analysis.completedCount} از {analysis.totalCheckpoints})
            </span>
          </div>
          {analysis.remainingCount > 0 ? (
            <p className="text-[10px] text-secondary truncate max-w-[200px]">
              {analysis.remainingCount} مورد تا حداکثر نمایش
            </p>
          ) : (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              اطلاعات کالا کامل و استاندارد است ✓
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${style.bg} ${style.border}`}
      dir="rtl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Circular score & title */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0 flex items-center justify-center">
            <div className={`w-14 h-14 rounded-2xl bg-surface border-2 ${style.border} flex flex-col items-center justify-center shadow-xs`}>
              <span className={`text-lg font-black leading-none ${style.text}`}>
                {analysis.score}٪
              </span>
              <span className="text-[9px] text-muted font-bold mt-0.5">شاخص کیفی</span>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-extrabold text-primary">
                امتیاز کیفیت ثبت محصول
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
                {style.badge}
              </span>
            </div>
            <p className="text-xs text-secondary mt-1">
              {analysis.remainingCount > 0
                ? `فقط ${analysis.remainingCount} مورد دیگر تا رسیدن به بالاترین اولویت معرفی به فروشگاه‌های Zopit باقی مانده.`
                : "عالی! تمامی اطلاعات با بالاترین استاندارد تکمیل شده‌اند و کالا آماده جذب فروشگاه‌هاست."}
            </p>
          </div>
        </div>

        {/* Right Side: Primary Tip */}
        {analysis.tips.length > 0 && (
          <div className="bg-surface/80 border border-subtle rounded-xl p-3 max-w-md text-right shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-primary-default mb-1">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>پیشنهاد هوشمند برای افزایش فروش:</span>
            </div>
            <p className="text-xs text-secondary font-medium leading-relaxed">
              💡 {analysis.tips[0]}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 pt-3 border-t border-subtle/50">
        <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${style.progressBg} transition-all duration-500 rounded-full`}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted font-bold mt-1.5">
          <span>{analysis.completedCount} از {analysis.totalCheckpoints} فاکتور کلیدی تکمیل شده</span>
          <span>این شاخص به بهبود کیفیت ثبت محصول کمک می‌کند و برای انتشار، تایید ناظر الزامی است.</span>
        </div>
      </div>
    </div>
  );
}
