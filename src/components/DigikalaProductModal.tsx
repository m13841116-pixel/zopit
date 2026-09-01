import React, { useState, useMemo } from "react";
import {
  X,
  Check,
  Building2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Layers,
  ChevronLeft,
  Share2,
  Package,
  Award,
  Sparkles,
  MapPin,
  CheckCircle,
  TrendingUp,
  Boxes,
  Info,
  DollarSign
} from "lucide-react";
import { getValidProductImageUrl } from "../utils/productUtils";
import { formatSupplierCode, formatSupplierLocation, HighContrastStatusBadge } from "../utils/statusUtils";

interface DigikalaProductModalProps {
  product: any;
  onClose: () => void;
  isOpen?: boolean;
  mode?: "store-marketplace" | "my-catalog" | "supplier-preview" | "admin-preview" | "explore";
  onAddToCatalog?: (product: any) => void;
  isInCatalog?: boolean;
  isAddingToCatalog?: boolean;
  onEditProduct?: (product: any) => void;
  onDeleteProduct?: (product: any) => void;
  onRemoveFromCatalog?: (product: any) => void;
}

export function DigikalaProductModal({
  product,
  onClose,
  isOpen = true,
  mode = "store-marketplace",
  onAddToCatalog,
  isInCatalog = false,
  isAddingToCatalog = false,
  onEditProduct,
  onDeleteProduct,
  onRemoveFromCatalog
}: DigikalaProductModalProps) {
  if (!product || !isOpen) return null;

  // Image Gallery State
  const rawImages = useMemo(() => {
    let list: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      list = product.images.map((img: any) => typeof img === "string" ? img : img.url).filter(Boolean);
    } else if (product.imageUrl) {
      list = [product.imageUrl];
    } else if (product.mainImage) {
      list = [product.mainImage];
    } else if (product.exploreContent?.customImageUrl) {
      list = [product.exploreContent.customImageUrl];
    }

    if (Array.isArray(product.variants)) {
      product.variants.forEach((v: any) => {
        const vImg = v.imageUrl || v.image || (v.images && v.images[0]);
        if (vImg && typeof vImg === "string" && !list.includes(vImg)) {
          list.push(vImg);
        }
      });
    }

    if (list.length === 0) {
      const validImg = getValidProductImageUrl(product);
      if (validImg) list = [validImg];
    }
    return list.filter(Boolean);
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"specs" | "desc" | "guarantee">("specs");
  const [copiedLink, setCopiedLink] = useState(false);

  // Variants handling
  const variants = useMemo(() => {
    return Array.isArray(product.variants) ? product.variants : [];
  }, [product]);

  const activeVariant = variants[selectedVariantIndex] || null;

  const handleSelectVariant = (idx: number) => {
    setSelectedVariantIndex(idx);
    const variant = variants[idx];
    if (variant) {
      const vImg = variant.imageUrl || variant.image || (variant.images && variant.images[0]);
      if (vImg) {
        const imgIdx = rawImages.findIndex((img) => img === vImg);
        if (imgIdx !== -1) {
          setActiveImageIndex(imgIdx);
        }
      }
    }
  };

  const currentPrice = useMemo(() => {
    if (activeVariant && activeVariant.supplierBasePrice) {
      return Number(activeVariant.supplierBasePrice);
    }
    return Number(product.supplierBasePrice || product.finalPrice || product.price || 0);
  }, [activeVariant, product]);

  const currentStock = useMemo(() => {
    if (activeVariant && activeVariant.stock !== undefined) {
      return Number(activeVariant.stock);
    }
    return Number(product.inventory || product.stock || 0);
  }, [activeVariant, product]);

  const specsList = useMemo(() => {
    let list: Array<{ key: string; value: string }> = [];
    if (product.technicalSpecs) {
      try {
        const parsed = typeof product.technicalSpecs === "string"
          ? JSON.parse(product.technicalSpecs)
          : product.technicalSpecs;
        if (Array.isArray(parsed)) {
          list = parsed.map((item: any) => ({
            key: String(item.key || item.name || item.title || "مشخصه"),
            value: String(item.value || item.val || "-")
          }));
        } else if (typeof parsed === "object" && parsed !== null) {
          list = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
        }
      } catch {
        // Fallback
      }
    }
    return list;
  }, [product]);

  const getColorHex = (colorName: string): string => {
    const map: Record<string, string> = {
      "مشکی": "#18181b",
      "سیاه": "#18181b",
      "سفید": "#ffffff",
      "نقره‌ای": "#d4d4d8",
      "طوسی": "#71717a",
      "خاکستری": "#71717a",
      "آبی": "#2563eb",
      "سرمه‌ای": "#1e3a8a",
      "قرمز": "#dc2626",
      "سبز": "#16a34a",
      "زرد": "#ca8a04",
      "طلایی": "#eab308",
      "بنفش": "#9333ea",
      "صورتی": "#ec4899",
      "کرم": "#fef08a",
      "قهوه‌ای": "#78350f"
    };
    for (const [key, hex] of Object.entries(map)) {
      if (colorName.includes(key)) return hex;
    }
    return "#3b82f6";
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  // Estimated suggested retail price (30% margin)
  const suggestedRetailPrice = Math.round(currentPrice * 1.3);
  const potentialProfit = suggestedRetailPrice - currentPrice;

  return (
    <div
      id="digikala-product-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        id="digikala-product-modal-container"
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-all"
      >
        {/* Top Bar: Breadcrumb + Share + Close */}
        <div
          id="product-modal-header"
          className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0"
        >
          <div className="flex items-center gap-2 text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-indigo-600 dark:text-indigo-400 font-black">بانک زوپیت</span>
            <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-700 dark:text-slate-300 font-bold">
              {product.category?.name || product.category?.title || "کالای عمومی"}
            </span>
            {product.brand && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="text-slate-600 dark:text-slate-400">برند {product.brand}</span>
              </>
            )}
            <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-900 dark:text-slate-100 font-black truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="product-share-btn"
              type="button"
              onClick={handleShare}
              title="اشتراک‌گذاری لینک کالا"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              id="product-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 flex-1">
          {/* Main 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* 1. Gallery Column (md: 1 col, lg: 4 cols) */}
            <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-4">
              {/* Main Image Display */}
              <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex items-center justify-center group shadow-xs">
                <img
                  src={rawImages[activeImageIndex] || getValidProductImageUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  onError={(e: any) => {
                    e.currentTarget.src = getValidProductImageUrl(null);
                  }}
                />

                {/* Status Badge Over Image */}
                <div className="absolute top-3 right-3">
                  <HighContrastStatusBadge status={product.status || "ACTIVE"} size="sm" />
                </div>

                {/* SKU Code Pill */}
                {product.sku && (
                  <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-lg">
                    کد SKU: {product.sku}
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {rawImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {rawImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all bg-slate-50 dark:bg-slate-800 cursor-pointer ${
                        activeImageIndex === idx
                          ? "border-indigo-600 ring-2 ring-indigo-600/20 scale-105"
                          : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`تصویر ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e: any) => {
                          e.currentTarget.src = getValidProductImageUrl(null);
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">ارسال مستقیم از انبار</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">تسویه حساب امانی امن</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                  <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">مهلت تست ۴۸ ساعته</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">تأمین دست اول و عمده</span>
                </div>
              </div>
            </div>

            {/* 2. Center Info Column (md: 1 col, lg: 5 cols) */}
            <div className="md:col-span-1 lg:col-span-5 flex flex-col gap-4 min-w-0 overflow-hidden">
              {/* Product Title & Brand */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[11px] font-black px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0">
                    کالای تایید شده زوپیت
                  </span>
                  {product.brand && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                      برند: {product.brand}
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed break-words">
                  {product.name}
                </h1>
              </div>

              {/* Rating & ID */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md shrink-0 border border-amber-200/50 dark:border-amber-800/50">
                  <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                  <span>۴.۸</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(رضایت ۹۸٪ فروشگاه‌داران)</span>
                </div>
                <span>•</span>
                <span className="shrink-0 font-mono text-slate-600 dark:text-slate-300 font-bold">شناسه: #{product.id}</span>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                    {product.shortDescription}
                  </p>
                </div>
              )}

              {/* Variant Selector */}
              {variants.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>تنوع رنگ / مدل / سایز کالا:</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {variants.length} تنوع موجود
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {variants.map((v: any, idx: number) => {
                      let attrs: Record<string, string> = {};
                      if (v.attributes) {
                        try {
                          attrs = typeof v.attributes === "string" ? JSON.parse(v.attributes) : v.attributes;
                        } catch {}
                      }
                      const label = Object.entries(attrs).map(([k, val]) => `${k}: ${val}`).join(" - ") || `تنوع شماره ${idx + 1}`;
                      const isSelected = selectedVariantIndex === idx;
                      const swatchColor = getColorHex(label);
                      const vImage = v.imageUrl || v.image || (v.images && v.images[0]);

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectVariant(idx)}
                          className={`p-2.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                            isSelected
                              ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-600/20"
                              : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {vImage ? (
                              <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                                <img
                                  src={vImage}
                                  alt={label}
                                  className="w-full h-full object-cover"
                                  onError={(e: any) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <span
                                className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
                                style={{ backgroundColor: swatchColor }}
                              />
                            )}
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                                {label}
                              </span>
                              {vImage && (
                                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold block">
                                  تصویر مجزا
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 block font-mono">
                              {Number(v.supplierBasePrice || product.supplierBasePrice || 0).toLocaleString()} ت
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400">
                              موجودی: {v.stock || 0}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Key Features Bullets */}
              {specsList.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    ویژگی‌های مهم کالا:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {specsList.slice(0, 4).map((spec, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                        <span className="font-semibold text-slate-500 dark:text-slate-400">{spec.key}:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{spec.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 3. Left Supplier & Buy Box (md: 2 cols, lg: 3 cols) */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="bg-slate-50 dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-sm sticky top-4">
                
                {/* Supplier Identity */}
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">تامین‌کننده اصلی:</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      احراز هویت شده
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{formatSupplierCode(product.supplierId || product.supplier?.id || product.id)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{formatSupplierLocation(product.supplierProvince || product.supplier?.province, product.supplierCity || product.supplier?.city)}</span>
                  </div>
                </div>

                {/* Stock & MOQ */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">وضعیت موجودی انبار:</span>
                    {currentStock > 0 ? (
                      <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> موجود ({currentStock} عدد)
                      </span>
                    ) : (
                      <span className="font-black text-rose-600 dark:text-rose-400">ناموجود</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">حداقل تعداد سفارش:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {product.minOrderQuantity || 1} عدد
                    </span>
                  </div>
                </div>

                {/* Wholesale Price Box */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">قیمت خرید عمده:</span>
                    {product.discount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                        {product.discount}٪ تخفیف
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                      {currentPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تومان</span>
                  </div>

                  {/* Profit Estimation Helper */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      تخمین سود فروش:
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{potentialProfit.toLocaleString()} ت
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-1">
                  {mode === "store-marketplace" && (
                    <button
                      type="button"
                      onClick={() => onAddToCatalog && onAddToCatalog(product)}
                      disabled={isInCatalog || isAddingToCatalog}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        isInCatalog
                          ? "bg-emerald-600 text-white cursor-default shadow-emerald-600/20"
                          : isAddingToCatalog
                          ? "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-wait"
                          : "bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-indigo-600/30"
                      }`}
                    >
                      {isAddingToCatalog ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isInCatalog ? (
                        <>
                          <Check className="w-4 h-4" />
                          در بانک زوپیتی شما موجود است
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4" />
                          افزودن به بانک زوپیت من
                        </>
                      )}
                    </button>
                  )}

                  {mode === "supplier-preview" && onEditProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditProduct(product);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      ویرایش مشخصات این محصول
                    </button>
                  )}

                  {mode === "my-catalog" && (onDeleteProduct || onRemoveFromCatalog) && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onRemoveFromCatalog) onRemoveFromCatalog(product);
                        else if (onDeleteProduct) onDeleteProduct(product);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <X className="w-4 h-4" />
                      حذف از زوپیتی من (کاتالوگ)
                    </button>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Tabs */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`pb-2 text-xs sm:text-sm font-black transition-colors cursor-pointer border-b-2 ${
                  activeTab === "specs"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                مشخصات فنی و ساختاری
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("desc")}
                className={`pb-2 text-xs sm:text-sm font-black transition-colors cursor-pointer border-b-2 ${
                  activeTab === "desc"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                توضیحات و معرفی جامع
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("guarantee")}
                className={`pb-2 text-xs sm:text-sm font-black transition-colors cursor-pointer border-b-2 ${
                  activeTab === "guarantee"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                قوانین ارسال و تسویه امن
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-5">
              {/* Specs */}
              {activeTab === "specs" && (
                <div className="space-y-4 min-w-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">دسته‌بندی کالا:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{product.category?.name || "عمومی"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">برند تجاری:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{product.brand || "بدون برند"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">کد انحصاری کالا (SKU):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate">{product.sku || "ثبت‌نشده"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">تعداد موجودی در دسترس:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentStock} عدد</span>
                    </div>
                  </div>

                  {specsList.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white mb-3">
                        مشخصات فنی تخصصی:
                      </h4>
                      <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden text-xs">
                        {specsList.map((item, idx) => (
                          <div
                            key={idx}
                            className={`grid grid-cols-1 sm:grid-cols-3 p-3.5 ${
                              idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"
                            }`}
                          >
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">{item.key}</span>
                            <span className="sm:col-span-2 font-bold text-slate-900 dark:text-slate-100 mt-1 sm:mt-0 break-words">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {activeTab === "desc" && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-4 min-w-0">
                  {product.longDescription || product.shortDescription ? (
                    <div className="whitespace-pre-line break-words">
                      {product.longDescription || product.shortDescription}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs text-center py-6">
                      توضیحات تکمیلی برای این محصول درج نشده است.
                    </p>
                  )}
                </div>
              )}

              {/* Guarantee */}
              {activeTab === "guarantee" && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 min-w-0">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                        تضمین پرداخت امن و تسویه امانی توسط پلتفرم واسط
                      </strong>
                      <span>
                        مبلغ سفارش تا زمان تحویل مرسوله به خریدار و پایان مهلت بررسی ۴۸ ساعته، در حساب امانی محفوظ مانده و پس از تایید تحویل، به کیف پول تامین‌کننده واریز خواهد شد.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 dark:text-slate-100 font-bold mb-1">
                        ارسال مستقیم و سریع از انبار تامین‌کننده
                      </strong>
                      <span>
                        سفارشات پس از تایید نهایی بلافاصله توسط تامین‌کننده بسته‌بندی شده و با برچسب استاندارد پستی از انبار به مقصد خریدار ارسال خواهند شد.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          id="product-modal-footer"
          className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>شناسه محصول در زوپیت:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{product.id}</span>
          </div>

          <button
            id="product-footer-close-btn"
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
}

export default DigikalaProductModal;
