import React, { useState } from "react";
import {
  ShieldCheck,
  Award,
  Truck,
  Box,
  Coins,
  Copy,
  Check,
  Eye,
  Info,
  Layers,
  Sparkles,
  Tag,
  CheckCircle2,
  Package
} from "lucide-react";
import { toast } from "../../GlobalToast";
import { toEnglishDigits } from "./ProductWholesalePricing";

interface ProductMarketplacePreviewProps {
  formData: any;
  techSpecs?: Array<{ key: string; value: string }>;
  categories?: any[];
}

export function ProductMarketplacePreview({
  formData,
  techSpecs = [],
  categories = [],
}: ProductMarketplacePreviewProps) {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const allImages = formData.images && formData.images.length > 0
    ? formData.images
    : formData.mainImage
    ? [formData.mainImage]
    : [];

  const activeImage = allImages[selectedImgIndex] || formData.mainImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600";

  const categoryObj = categories.find((c) => String(c.id) === String(formData.categoryId));
  const categoryName = categoryObj ? categoryObj.name : "عمومی";

  const basePriceNum = parseFloat(toEnglishDigits(formData.supplierBasePrice) || "0");
  const discountNum = parseFloat(toEnglishDigits(formData.discount) || "0");
  const finalCalculated = discountNum > 0 ? basePriceNum * (1 - discountNum / 100) : basePriceNum;

  const handleCopy = (key: string, content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    toast.success("کپی شد ✓");
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Live Preview Alert Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-indigo-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-primary">
                پیش‌نمایش نحوه نمایش کالا در مارکت‌پلیس زوپیت
              </h4>
              <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                پیش‌نمایش زنده
              </span>
            </div>
            <p className="text-xs text-secondary mt-1 leading-relaxed">
              این پیش‌نمایش به شما نشان می‌دهد که مدیران فروشگاه‌ها و خریداران عمده، کالا را چگونه در کاتالوگ خواهند دید.
              این محصول پس از ارسال و تایید ناظران زوپیت منتشر خواهد شد.
            </p>
          </div>
        </div>

        {/* Quick Copy Helpers in Header */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleCopy("all", `${formData.name || ''}\nبرند: ${formData.brand || 'عمومی'}\nقیمت عمده: ${Number(basePriceNum).toLocaleString('fa-IR')} تومان\n${formData.shortDescription || ''}`)}
            className="px-3 py-2 bg-surface hover:bg-subtle text-secondary border border-subtle rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            {copiedKey === "all" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === "all" ? "کپی شد ✓" : "کپی کل اطلاعات کالا"}</span>
          </button>
        </div>
      </div>

      {/* Main Marketplace Product Card Simulation */}
      <div className="bg-card border border-subtle rounded-3xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
          {/* Left / Gallery Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square rounded-2xl bg-surface border border-subtle overflow-hidden flex items-center justify-center">
              <img
                src={activeImage}
                alt={formData.name || "محصول"}
                className="w-full h-full object-cover"
              />

              {/* Status Ribbon */}
              <div className="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>در مرحله پیش‌نمایش</span>
              </div>

              {formData.isAuthenticGuaranteed && (
                <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ضمانت اصالت</span>
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {allImages.map((img: string, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                      selectedImgIndex === idx
                        ? "border-primary-default ring-2 ring-primary-default/20 scale-105"
                        : "border-subtle opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right / Details Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Category, Brand, SKU */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted pb-3 border-b border-subtle">
                <div className="flex items-center gap-2">
                  <span className="bg-surface px-2.5 py-1 rounded-lg border border-subtle font-bold text-secondary">
                    دسته‌بندی: {categoryName}
                  </span>
                  {formData.brand && (
                    <span className="bg-surface px-2.5 py-1 rounded-lg border border-subtle font-bold text-secondary">
                      برند: {formData.brand}
                    </span>
                  )}
                </div>
                {formData.sku && (
                  <button
                    type="button"
                    onClick={() => handleCopy("sku", formData.sku)}
                    className="flex items-center gap-1 text-[11px] font-mono hover:text-primary transition-colors"
                  >
                    <span>کد کالا: {formData.sku}</span>
                    {copiedKey === "sku" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Title & Copy */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-primary leading-snug">
                    {formData.name || "عنوان محصول وارد نشده است"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleCopy("title", formData.name)}
                    className="p-1.5 rounded-lg bg-surface hover:bg-subtle text-muted hover:text-primary transition-all shrink-0"
                    title="کپی عنوان"
                  >
                    {copiedKey === "title" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {formData.shortDescription && (
                  <p className="text-xs text-secondary leading-relaxed bg-surface/60 p-3 rounded-xl border border-subtle/60">
                    {formData.shortDescription}
                  </p>
                )}
              </div>

              {/* Badges Bar: Warranty & Authenticity */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {formData.warranty && formData.warranty !== "بدون گارانتی" && (
                  <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>{formData.warranty} {formData.warrantyDuration ? `(${formData.warrantyDuration})` : ""}</span>
                  </div>
                )}

                {formData.isAuthenticGuaranteed && (
                  <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ضمانت اصالت ۱۰۰٪ فیزیکی کالا</span>
                  </div>
                )}

                {formData.weight && (
                  <div className="bg-surface border border-subtle px-3 py-1.5 rounded-xl text-xs font-medium text-secondary flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-muted" />
                    <span>وزن: {formData.weight}</span>
                  </div>
                )}
              </div>

              {/* Price & Stock Box */}
              <div className="bg-surface border border-subtle rounded-2xl p-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-secondary">قیمت پایه تامین‌کننده:</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {Number(finalCalculated).toLocaleString("fa-IR")}
                    </span>
                    <span className="text-xs font-bold text-muted">تومان</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-subtle">
                  <span>موجودی اعلام‌شده:</span>
                  <span className="font-black text-primary">
                    {formData.variants?.length > 0
                      ? `${formData.variants.reduce((acc: number, v: any) => acc + (parseInt(v.stock, 10) || 0), 0)} عدد در ${formData.variants.length} تنوع`
                      : `${formData.stock || 0} عدد آماده ارسال`}
                  </span>
                </div>
              </div>

              {/* Wholesale Tiers Table (if enabled) */}
              {formData.isWholesaleEnabled && formData.wholesaleTiers?.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span>جدول قیمت سفارش عمده (تخفیف تیراژ):</span>
                  </div>
                  <div className="divide-y divide-amber-500/10">
                    {formData.wholesaleTiers.map((t: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 text-xs">
                        <span className="font-bold text-secondary">
                          از {t.minQuantity} عدد {t.maxQuantity ? `تا ${t.maxQuantity} عدد` : "به بالا"}:
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {Number(t.unitPrice || 0).toLocaleString("fa-IR")} تومان / واحد
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical Specs & Long Description Section */}
        <div className="border-t border-subtle p-6 sm:p-8 bg-surface/40 space-y-6">
          {/* Long Description */}
          {formData.longDescription && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-primary">توضیحات و مشخصات جامع کالا</h3>
                <button
                  type="button"
                  onClick={() => handleCopy("longDesc", formData.longDescription)}
                  className="text-xs text-muted hover:text-primary flex items-center gap-1 font-bold"
                >
                  {copiedKey === "longDesc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "longDesc" ? "کپی شد ✓" : "کپی توضیحات"}</span>
                </button>
              </div>
              <p className="text-xs text-secondary leading-relaxed whitespace-pre-line bg-card p-4 rounded-2xl border border-subtle">
                {formData.longDescription}
              </p>
            </div>
          )}

          {/* Technical Specs Table */}
          {techSpecs.filter((s) => s.key && s.value).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-primary">جدول مشخصات فنی</h3>
                <button
                  type="button"
                  onClick={() => handleCopy("specs", techSpecs.map(s => `${s.key}: ${s.value}`).join('\n'))}
                  className="text-xs text-muted hover:text-primary flex items-center gap-1 font-bold"
                >
                  {copiedKey === "specs" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "specs" ? "کپی شد ✓" : "کپی مشخصات"}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {techSpecs
                  .filter((s) => s.key && s.value)
                  .map((spec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-card rounded-xl border border-subtle text-xs"
                    >
                      <span className="font-bold text-secondary">{spec.key}</span>
                      <span className="font-medium text-primary">{spec.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
