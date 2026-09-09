import React from "react";
import {
  ShieldCheck,
  Award,
  Truck,
  Box,
  Scale,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface ProductWarrantyAuthenticityProps {
  formData: {
    warranty: string;
    warrantyDuration: string;
    warrantyProvider?: string;
    warrantyType?: string;
    isAuthenticGuaranteed?: boolean;
    weight: string;
    dimensions: string;
    color?: string;
  };
  onChange: (fields: Partial<any>) => void;
}

const WARRANTY_OPTIONS = [
  { id: "NONE", label: "بدون گارانتی (فقط مهلت تست اولیه)", val: "بدون گارانتی" },
  { id: "OFFICIAL_COMPANY", label: "گارانتی رسمی شرکتی و معتبر", val: "گارانتی رسمی شرکتی" },
  { id: "PHYSICAL_HEALTH", label: "ضمانت سلامت فیزیکی و اصالت کالا", val: "ضمانت سلامت فیزیکی" },
  { id: "SUPPLIER_EXCLUSIVE", label: "گارانتی اختصاصی تامین‌کننده", val: "گارانتی اختصاصی تامین‌کننده" },
];

const WARRANTY_DURATIONS = [
  "۷ روز مهلت تست فنی",
  "۳۰ روز تعویض",
  "۳ ماهه",
  "۶ ماهه",
  "۱۲ ماهه",
  "۱۸ ماهه",
  "۲۴ ماهه",
  "۳۶ ماهه",
  "مادام‌العمر",
];

const WARRANTY_SERVICES = [
  "تعویض کالا در صورت خرابی",
  "تعمیر قطعات و خدمات پس از فروش",
  "بازگشت وجه در صورت عدم رضایت",
  "مهلت تست و عیب‌یابی",
];

export function ProductWarrantyAuthenticity({
  formData,
  onChange,
}: ProductWarrantyAuthenticityProps) {
  const hasWarranty = formData.warranty && formData.warranty !== "بدون گارانتی";

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* 1. Authenticity Guarantee Certificate Card */}
      <div
        className={`border rounded-2xl p-5 transition-all ${
          formData.isAuthenticGuaranteed
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-surface border-subtle"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={`w-5 h-5 ${
                  formData.isAuthenticGuaranteed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted"
                }`}
              />
              <h4 className="text-sm font-black text-primary">
                ضمانت اصالت و اورجینال بودن کالا
              </h4>
            </div>
            <p className="text-xs text-secondary leading-relaxed max-w-xl">
              کالاهایی که دارای تاییدیه اصالت باشند، نشان رسمی «ضمانت اصالت کالا» دریافت کرده و در لیست‌های برتر فروشگاه‌های زوپیت قرار می‌گیرند.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(formData.isAuthenticGuaranteed)}
              onChange={(e) => onChange({ isAuthenticGuaranteed: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ms-3 text-xs font-bold text-primary">
              {formData.isAuthenticGuaranteed ? "تایید و تضمین شد ✓" : "تضمین اصالت"}
            </span>
          </label>
        </div>

        {formData.isAuthenticGuaranteed && (
          <div className="mt-3 pt-3 border-t border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              اینجانب اصالت و تطابق فنی این محصول با کالای اصلی برند را تضمین می‌نمایم.
            </span>
          </div>
        )}
      </div>

      {/* 2. Structured Warranty Section */}
      <div className="bg-surface border border-subtle rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-subtle pb-3">
          <Award className="w-5 h-5 text-indigo-500" />
          <h4 className="text-sm font-black text-primary">
            اطلاعات و شرایط گارانتی محصول
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              وضعیت گارانتی *
            </label>
            <select
              value={formData.warranty || "بدون گارانتی"}
              onChange={(e) => onChange({ warranty: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary-default"
            >
              {WARRANTY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.val}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              مدت زمان گارانتی
            </label>
            <select
              value={formData.warrantyDuration || ""}
              onChange={(e) => onChange({ warrantyDuration: e.target.value })}
              disabled={!hasWarranty}
              className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary-default disabled:opacity-50"
            >
              <option value="">انتخاب مدت زمان...</option>
              {WARRANTY_DURATIONS.map((dur, idx) => (
                <option key={idx} value={dur}>
                  {dur}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasWarranty && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                نام شرکت یا مرجع گارانتی‌کننده
              </label>
              <input
                type="text"
                value={formData.warrantyProvider || ""}
                onChange={(e) => onChange({ warrantyProvider: e.target.value })}
                placeholder="مثال: گارانتی ۱۸ ماهه همراه سرویس خاورمیانه"
                className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                نوع پوشش گارانتی
              </label>
              <select
                value={formData.warrantyType || ""}
                onChange={(e) => onChange({ warrantyType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
              >
                <option value="">انتخاب نوع خدمات...</option>
                {WARRANTY_SERVICES.map((srv, idx) => (
                  <option key={idx} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. Shipping, Weight & Package Dimensions */}
      <div className="bg-surface border border-subtle rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-subtle pb-3">
          <Truck className="w-5 h-5 text-emerald-500" />
          <h4 className="text-sm font-black text-primary">
            مشخصات فیزیکی و بسته‌بندی جهت ارسال
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-muted" />
              <span>وزن تقریبی بسته (گرم یا کیلوگرم)</span>
            </label>
            <input
              type="text"
              value={formData.weight || ""}
              onChange={(e) => onChange({ weight: e.target.value })}
              placeholder="مثال: ۳۵۰ گرم یا ۱.۲ کیلوگرم"
              className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-muted" />
              <span>ابعاد بسته‌بندی (طول × عرض × ارتفاع)</span>
            </label>
            <input
              type="text"
              value={formData.dimensions || ""}
              onChange={(e) => onChange({ dimensions: e.target.value })}
              placeholder="مثال: ۲۰ × ۱۵ × ۱۰ سانتی‌متر"
              className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              رنگ اصلی محصول / تنوع پایه
            </label>
            <input
              type="text"
              value={formData.color || ""}
              onChange={(e) => onChange({ color: e.target.value })}
              placeholder="مثال: مشکی مات / نقره‌ای"
              className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
            />
          </div>
        </div>

        <p className="text-[11px] text-muted leading-relaxed">
          💡 وارد کردن دقیق وزن و ابعاد بسته‌بندی، محاسبه هزینه پست و باربری را برای خریداران عمده و فروشگاه‌های همکار شفاف و دقیق می‌سازد.
        </p>
      </div>
    </div>
  );
}
