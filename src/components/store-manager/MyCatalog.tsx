import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { getValidProductImageUrl } from "../../utils/productUtils";
import { HighContrastStatusBadge } from "../../utils/statusUtils";
import { toEnglishDigits } from "../../utils/numberUtils";
import { DigikalaProductModal } from "../DigikalaProductModal";
import MarketingKitModal from "./MarketingKitModal";
import { Sparkles, Edit, DollarSign, TrendingUp, Zap } from "lucide-react";
import { Layers, Trash2, X, Package, Info, Check, Plus, Loader2, ShoppingCart } from "lucide-react";

export default function MyCatalog() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  
  // Order state
  const [orderingProduct, setOrderingProduct] = useState<any | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderVariantId, setOrderVariantId] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Customization state
  const [customizingProduct, setCustomizingProduct] = useState<any | null>(null);
  const [marketingKitProduct, setMarketingKitProduct] = useState<any | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customPrice, setCustomPrice] = useState<number | string>("");
  const [submittingCustomization, setSubmittingCustomization] = useState(false);

  // Quick Price & Batch Markup state
  const [quickPricingProduct, setQuickPricingProduct] = useState<any | null>(null);
  const [quickSellingPrice, setQuickSellingPrice] = useState<string>("");
  const [quickProfit, setQuickProfit] = useState<string>("");
  const [submittingQuickPrice, setSubmittingQuickPrice] = useState(false);

  const [batchMarkupInput, setBatchMarkupInput] = useState<string>("20000");
  const [submittingBatchMarkup, setSubmittingBatchMarkup] = useState(false);

  const fetchCatalog = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/my-catalog", { 
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCatalog(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleBatchMarkup = async (amount: number) => {
    if (amount < 0) return;
    setSubmittingBatchMarkup(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/products/batch-markup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ markupAmount: amount })
      });
      const data = await res.json();
      if (res.ok) {
        toast(data.message || "سود دسته‌جمعی با موفقیت اعمال شد.", "success");
        fetchCatalog();
      } else {
        toast(data.error || "خطا در اعمال سود", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setSubmittingBatchMarkup(false);
    }
  };

  const handleOpenQuickPricing = (product: any) => {
    setQuickPricingProduct(product);
    const initialPrice = product.customPrice || product.finalPrice || product.wholesalePrice || 0;
    setQuickSellingPrice(initialPrice ? initialPrice.toString() : "");
    const initialProfit = product.calculatedProfit || (initialPrice - (product.wholesalePrice || 0));
    setQuickProfit(initialProfit > 0 ? initialProfit.toString() : "");
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPricingProduct) return;
    setSubmittingQuickPrice(true);
    try {
      const token = localStorage.getItem("token") || "";
      const normalizedPrice = quickSellingPrice ? Number(toEnglishDigits(quickSellingPrice)) : null;
      const normalizedProfit = quickProfit ? Number(toEnglishDigits(quickProfit)) : null;

      const res = await fetch(`/api/store-manager/products/${quickPricingProduct.id}/price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customPrice: normalizedPrice,
          customProfit: normalizedProfit
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast("قیمت فروش کالا با موفقیت ذخیره شد.", "success");
        setQuickPricingProduct(null);
        fetchCatalog();
      } else {
        toast(data.error || "خطا در تغییر قیمت", "error");
      }
    } catch (err) {
      toast("خطای شبکه در ذخیره قیمت", "error");
    } finally {
      setSubmittingQuickPrice(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingProduct) return;
    setSubmittingOrder(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: orderingProduct.id,
          variantId: orderVariantId ? parseInt(orderVariantId) : null,
          quantity: orderQuantity,
          notes: orderNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast("سفارش با موفقیت ثبت شد و برای تایید به تامین‌کننده ارسال گردید.", "success");
        setOrderingProduct(null);
        setOrderQuantity(1);
        setOrderVariantId("");
        setOrderNotes("");
      } else {
        toast(data.error || "خطا در ثبت سفارش", "error");
      }
    } catch (err) {
      toast("خطای شبکه در ثبت سفارش", "error");
    } finally {
      setSubmittingOrder(false);
    }
  };
  const handleRemove = async (productId: number) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/store-manager/my-catalog/${productId}`, { credentials: "include",
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchCatalog();
        setShowConfirmDelete(null);
        setSelectedProduct(null);
      } else {
        const data = await res.json();
        toast(data.error || "خطا در حذف محصول", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };

  const handleOpenCustomization = (product: any) => {
    setCustomizingProduct(product);
    setCustomTitle(product.customization?.customTitle || product.name || "");
    setCustomDescription(product.customization?.customDescription || product.description || product.shortDescription || "");
    setCustomVideoUrl(product.customization?.customVideoUrl || "");
    setCustomImageUrl(product.customization?.customImageUrl || "");
    setCustomPrice(product.finalPrice || product.customization?.customPrice || "");
  };

  const handleSaveCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customizingProduct) return;
    setSubmittingCustomization(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/store-manager/products/${customizingProduct.id}/customization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customTitle: customTitle.trim(),
          customDescription: customDescription.trim(),
          customVideoUrl: customVideoUrl.trim(),
          customImageUrl: customImageUrl.trim(),
          customPrice: customPrice ? Number(customPrice) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast("تنظیمات اختصاصی با موفقیت ذخیره شد.", "success");
        setCustomizingProduct(null);
        fetchCatalog();
      } else {
        toast(data.error || "خطا در ذخیره اطلاعات", "error");
      }
    } catch (err) {
      console.error(err);
      toast("خطای شبکه در ذخیره اطلاعات", "error");
    } finally {
      setSubmittingCustomization(false);
    }
  };

  const handleResetCustomization = async () => {
    if (!customizingProduct) return;
    setSubmittingCustomization(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/store-manager/products/${customizingProduct.id}/customization`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast("اطلاعات محصول به نسخه اصلی بازنشانی شد.", "success");
        setCustomizingProduct(null);
        fetchCatalog();
      } else {
        toast(data.error || "خطا در بازنشانی اطلاعات", "error");
      }
    } catch (err) {
      console.error(err);
      toast("خطای شبکه در بازنشانی اطلاعات", "error");
    } finally {
      setSubmittingCustomization(false);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      
      
      {/* Marketing Kit Modal */}
      {marketingKitProduct && (
        <MarketingKitModal
          product={marketingKitProduct}
          onClose={() => setMarketingKitProduct(null)}
        />
      )}

      {/* Digikala Style Product Detail Modal */}
      {selectedProduct && (
        <DigikalaProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          mode="my-catalog"
          onRemoveFromCatalog={(prod) => setShowConfirmDelete(prod.id)}
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-default" />
            <span>زوپیتی من (کاتالوگ اختصاصی شما)</span>
          </h2>
          <p className="text-muted text-xs md:text-sm mt-1">
            محصولاتی که برای فروشگاه خود انتخاب کرده‌اید. قیمت‌های فروش مشخص‌شده مستقیماً در اتصال به سایت ووکامرس شما اعمال می‌گردند.
          </p>
        </div>
      </div>

      {/* Quick Batch Profit Markup Toolbar */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-4 sm:p-5 rounded-2xl border border-blue-500/20 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span>تنظیم سریع و دسته‌جمعی سود فروشگاه روی تمام کالاها</span>
          </div>
          <span className="text-xs text-muted">اعمال مستقیم روی اتصال ووکامرس</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          با انتخاب یکی از مبالغ زیر، سود ثابت دلخواه شما به تمام محصولات زوپیتی‌تان اضافه می‌شود (قیمت خرید زوپیتی شما ثابت باقی می‌ماند):
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[10000, 20000, 30000, 50000, 90000, 100000, 150000].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={submittingBatchMarkup}
              onClick={() => handleBatchMarkup(amt)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              +{amt.toLocaleString("fa-IR")} تومان سود
            </button>
          ))}

          <div className="flex items-center gap-1.5 mr-auto">
            <input
              type="text"
              placeholder="سود دلخواه (تومان)"
              value={batchMarkupInput}
              onChange={(e) => setBatchMarkupInput(toEnglishDigits(e.target.value))}
              className="w-32 bg-white dark:bg-zinc-900 border border-subtle rounded-xl px-3 py-1.5 text-xs text-primary outline-none focus:border-blue-500 font-bold"
            />
            <button
              type="button"
              disabled={submittingBatchMarkup}
              onClick={() => handleBatchMarkup(Number(toEnglishDigits(batchMarkupInput)) || 0)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {submittingBatchMarkup ? "..." : "اعمال سود"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-muted">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {catalog.map((item) => {
            const product = item.product;
            const wholesale = product.wholesalePrice || product.supplierBasePrice || 0;
            const selling = product.finalPrice || wholesale;
            const profit = product.calculatedProfit || Math.max(0, selling - wholesale);

            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative cursor-pointer"
                onClick={(e) => {
                  if ((e.target as any).closest("button") || (e.target as any).closest("input")) return;
                  setSelectedProduct(product);
                }}
              >
                <div className="h-48 bg-surface relative overflow-hidden flex flex-col items-center justify-center text-inverse">
                  {getValidProductImageUrl(product) ? (
                    <img referrerPolicy="no-referrer"
                      src={getValidProductImageUrl(product)}
                      className="w-full h-full object-cover"
                      alt={product.name}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted">
                      <Layers className="w-10 h-10 opacity-40" />
                      <span className="text-[11px] font-bold">بدون تصویر</span>
                    </div>
                  )}

                  {product.customization && (
                    <span className="absolute top-3 left-3 bg-primary-default text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                      نمایش شخصی‌سازی شده
                    </span>
                  )}

                  {profit > 0 && (
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{profit.toLocaleString("fa-IR")} تومان سود
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">
                      {product.category?.name}
                    </p>
                  </div>
                  <h3 className="font-bold text-primary text-lg mb-2 leading-tight">
                    {product.customization?.customTitle || product.name}
                  </h3>
                  <p className="text-xs text-muted mb-3 line-clamp-2">
                    {product.customization?.customDescription || product.description || product.shortDescription || "بدون توضیحات"}
                  </p>
                  <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-subtle">
                    {/* Price Breakdown */}
                    <div className="space-y-1 bg-surface p-2.5 rounded-xl border border-subtle text-xs">
                      <div className="flex justify-between items-center text-muted">
                        <span>قیمت زوپیتی:</span>
                        <span className="font-bold text-primary">{wholesale.toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-subtle/50">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">قیمت فروش سایت:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {selling.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted text-[11px]">وضعیت:</span>
                        <HighContrastStatusBadge status={item.status || "SYNCED"} size="sm" />
                      </div>
                      <span className="text-muted text-[11px]">
                        {new Date(item.selected_at).toLocaleDateString("fa-IR")}
                      </span>
                    </div>

                    <div className="space-y-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQuickPricing(product);
                        }}
                        className="w-full py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        تنظیم سریع قیمت و سود
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarketingKitProduct(product);
                          }}
                          className="py-2 px-2 rounded-xl flex items-center justify-center gap-1 text-[11px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          پک بازاریابی
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomization(product);
                          }}
                          className="py-2 px-2 rounded-xl flex items-center justify-center gap-1 text-[11px] font-black bg-surface text-secondary hover:text-primary border border-subtle transition-all cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          شخصی‌سازی
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderingProduct(product);
                            setOrderQuantity(1);
                            setOrderVariantId(product.variants?.[0]?.id?.toString() || "");
                          }}
                          className="py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black bg-primary-default hover:bg-primary-hover text-white transition-all cursor-pointer shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          ثبت سفارش
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDelete(product.id);
                          }}
                          className="py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-xs font-black bg-danger/10 text-danger hover:bg-danger/20 transition-all cursor-pointer"
                        >
                          حذف کالا
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {catalog.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted bg-card rounded-2xl border border-subtle">
              شما هنوز هیچ محصولی به زوپیتی خود اضافه نکرده‌اید.
            </div>
          )}
        </div>
      )}
      {showConfirmDelete !== null && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl p-6 text-right">
            
            <h3 className="text-lg font-bold text-primary mb-2">
              حذف محصول از زوپیتی من
            </h3>
            <p className="text-sm text-muted leading-relaxed mb-6">
              
              آیا از حذف این محصول از زوپیتی خود اطمینان دارید؟ تمامی
              سفارشات در حال بررسی مرتبط با این محصول نیز حذف خواهند شد.
            </p>
            <div className="flex gap-3 justify-end">
              
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-muted bg-surface hover:bg-surface transition-colors text-sm cursor-pointer"
              >
                
                انصراف
              </button>
              <button
                onClick={() => handleRemove(showConfirmDelete)}
                className="px-4 py-2.5 rounded-xl font-bold text-inverse bg-danger hover:bg-rose-700 transition-colors text-sm cursor-pointer"
              >
                
                تایید و حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Display Customization Modal */}
      {customizingProduct !== null && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-right" dir="rtl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-border-subtle bg-surface/40">
              <h3 className="text-base font-black text-text-primary">
                📝 شخصی‌سازی نمایش کالا در ویترین شما
              </h3>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 hover:bg-surface rounded-full text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomization} className="p-6 space-y-4">
              <div className="bg-primary-default/5 p-4 rounded-xl border border-primary-default/10 mb-2">
                <p className="text-xs text-primary-default leading-relaxed font-bold">
                  💡 این تغییرات صرفاً در ویترین فروشگاه شما (اکسپلور) اعمال می‌شود و اطلاعات تامین‌کننده اصلی به هیچ وجه تغییر نمی‌کند.
                </p>
              </div>

              {/* Original Item Info (for reference) */}
              <div className="text-xs text-text-muted bg-surface/50 p-3 rounded-lg border border-border-default flex items-center gap-2">
                <span className="font-bold">کالای مرجع:</span>
                <span className="truncate">{customizingProduct.name}</span>
              </div>

              {/* Custom Title */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-text-secondary">عنوان اختصاصی کالا</label>
                <input
                  type="text"
                  placeholder="عنوانی که دوست دارید مشتری در ویترین شما ببیند..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-surface border border-border-default rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary-default font-bold"
                />
              </div>

              {/* Custom Price */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-text-secondary">قیمت فروش اختصاصی (تومان)</label>
                <input
                  type="number"
                  placeholder="قیمت پیشنهادی شما برای فروش به مشتری..."
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full bg-surface border border-border-default rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary-default font-mono font-bold"
                />
                <p className="text-[10px] text-text-muted mt-0.5">قیمت مدنظر خود را برای نمایش به خریداران در سایت اختصاصی‌تان تعیین کنید</p>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-text-secondary">لینک تصویر اختصاصی (آدرس عکس)</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="w-full bg-surface border border-border-default rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary-default font-mono text-left"
                  dir="ltr"
                />
                <p className="text-[10px] text-text-muted mt-0.5">آدرس اینترنتی یک عکس باکیفیت برای جایگزینی تصویر اصلی کالا</p>
              </div>

              {/* Custom Video URL */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-text-secondary">لینک ویدیو معرفی (آپارات، یوتیوب، مستقیم)</label>
                <input
                  type="url"
                  placeholder="https://aparat.com/v/..."
                  value={customVideoUrl}
                  onChange={(e) => setCustomVideoUrl(e.target.value)}
                  className="w-full bg-surface border border-border-default rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary-default font-mono text-left"
                  dir="ltr"
                />
                <p className="text-[10px] text-text-muted mt-0.5">ویدیو معرفی کالا جهت نمایش به مشتریان در جزئیات محصول</p>
              </div>

              {/* Custom Description */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-text-secondary">توضیحات اختصاصی کالا</label>
                <textarea
                  rows={4}
                  placeholder="توضیحات جذاب و اختصاصی خود برای ترغیب مشتریان به خرید..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full bg-surface border border-border-default rounded-xl p-3.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary-default font-bold resize-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border-subtle flex flex-wrap gap-2 justify-between items-center">
                
                {/* Reset button */}
                {customizingProduct.customization ? (
                  <button
                    type="button"
                    onClick={handleResetCustomization}
                    disabled={submittingCustomization}
                    className="px-4 py-2.5 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف شخصی‌سازی و بازگشت به اطلاعات مرجع</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomizingProduct(null)}
                    disabled={submittingCustomization}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCustomization}
                    className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submittingCustomization ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>ذخیره تغییرات نمایش</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Order Modal */}
      {orderingProduct && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl p-6 text-right border border-subtle animate-scale-up">
            <div className="flex justify-between items-center border-b border-subtle pb-4 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <ShoppingCart className="w-5 h-5 text-primary-default" />
                <h3 className="text-lg font-bold">ثبت سفارش کالا</h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderingProduct(null)}
                className="p-1 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-subtle">
                <img
                  referrerPolicy="no-referrer"
                  src={getValidProductImageUrl(orderingProduct)}
                  className="w-14 h-14 object-cover rounded-lg border border-subtle"
                  alt={orderingProduct.name}
                />
                <div>
                  <h4 className="font-bold text-sm text-primary">{orderingProduct.name}</h4>
                  <p className="text-xs text-muted mt-0.5">
                    تامین‌کننده: <span className="font-medium text-secondary">{orderingProduct.supplier?.brandName || orderingProduct.supplier?.username || "تامین‌کننده معتبر"}</span>
                  </p>
                  <p className="text-xs font-bold text-success mt-1">
                    قیمت: {orderingProduct.finalPrice?.toLocaleString()} تومان
                  </p>
                </div>
              </div>

              {/* Variants Selector */}
              {orderingProduct.variants && orderingProduct.variants.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-muted mb-1.5">تنوع / رنگ / سایز کالا</label>
                  <select
                    value={orderVariantId}
                    onChange={(e) => setOrderVariantId(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl px-3 py-2.5 text-xs text-primary outline-none focus:border-primary-default"
                  >
                    <option value="">انتخاب تنوع...</option>
                    {orderingProduct.variants.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.color ? `(${v.color})` : ''} {v.size ? `[${v.size}]` : ''} - {v.finalPrice?.toLocaleString() || orderingProduct.finalPrice?.toLocaleString()} تومان
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">تعداد سفارش</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="w-10 h-10 rounded-xl bg-surface hover:bg-subtle text-primary font-black flex items-center justify-center text-lg cursor-pointer border border-subtle"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center bg-surface border border-subtle rounded-xl py-2 text-sm font-bold text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(orderQuantity + 1)}
                    className="w-10 h-10 rounded-xl bg-surface hover:bg-subtle text-primary font-black flex items-center justify-center text-lg cursor-pointer border border-subtle"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">توضیحات یا یادداشت سفارش (اختیاری)</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="توضیحات برای تامین‌کننده..."
                  className="w-full bg-surface border border-subtle rounded-xl p-3 text-xs text-primary outline-none focus:border-primary-default resize-none"
                />
              </div>

              {/* Notice about supplier auto-approval workflow */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  این سفارش مستقیماً برای تایید به تامین‌کننده مربوطه ارسال می‌شود. پس از تایید، هزینه ارسال محاسبه شده و جهت ارسال آماده می‌گردد.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-2 border-t border-subtle justify-end">
                <button
                  type="button"
                  onClick={() => setOrderingProduct(null)}
                  disabled={submittingOrder}
                  className="px-4 py-2.5 bg-surface hover:bg-subtle text-muted rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت سفارش...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>ارسال برای تایید تامین‌کننده</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Price & Profit Setting Modal */}
      {quickPricingProduct && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl p-6 text-right border border-subtle animate-scale-up space-y-5">
            <div className="flex justify-between items-center border-b border-subtle pb-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <DollarSign className="w-5 h-5" />
                <h3 className="text-lg">تنظیم سریع قیمت و سود کالا</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickPricingProduct(null)}
                className="p-1 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPrice} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-subtle">
                <img
                  referrerPolicy="no-referrer"
                  src={getValidProductImageUrl(quickPricingProduct)}
                  className="w-12 h-12 object-cover rounded-xl border border-subtle"
                  alt={quickPricingProduct.name}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-primary truncate">{quickPricingProduct.name}</h4>
                  <p className="text-[11px] text-muted mt-0.5">
                    قیمت زوپیتی: <span className="font-bold text-primary">{(quickPricingProduct.wholesalePrice || quickPricingProduct.supplierBasePrice || 0).toLocaleString("fa-IR")} تومان</span>
                  </p>
                </div>
              </div>

              {/* Quick Preset Margin Buttons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted">انتخاب سریع سود پیشنهادی روی این کالا:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10000, 20000, 30000, 50000, 100000, 150000].map((preset) => {
                    const wholesale = quickPricingProduct.wholesalePrice || quickPricingProduct.supplierBasePrice || 0;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setQuickProfit(preset.toString());
                          setQuickSellingPrice((wholesale + preset).toString());
                        }}
                        className="py-1.5 px-2 rounded-xl text-[11px] font-black bg-surface hover:bg-emerald-500/10 hover:text-emerald-600 border border-subtle hover:border-emerald-500/30 transition-all cursor-pointer text-center"
                      >
                        +{preset.toLocaleString("fa-IR")} تومان
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Selling Price Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-primary">قیمت فروش نهایی در سایت (تومان):</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: ۱۲۰,۰۰۰"
                    value={quickSellingPrice}
                    onChange={(e) => {
                      const engVal = toEnglishDigits(e.target.value);
                      setQuickSellingPrice(engVal);
                      const numVal = Number(engVal) || 0;
                      const wholesale = quickPricingProduct.wholesalePrice || quickPricingProduct.supplierBasePrice || 0;
                      if (numVal > wholesale) {
                        setQuickProfit((numVal - wholesale).toString());
                      } else {
                        setQuickProfit("0");
                      }
                    }}
                    className="w-full bg-surface border border-subtle rounded-xl px-4 py-3 text-sm font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-muted font-bold">تومان</span>
                </div>
              </div>

              {/* Estimated Profit Display */}
              {Number(toEnglishDigits(quickProfit)) > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    سود خالص شما از این کالا:
                  </span>
                  <span className="text-sm font-black">
                    {Number(toEnglishDigits(quickProfit)).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-subtle justify-end">
                <button
                  type="button"
                  onClick={() => setQuickPricingProduct(null)}
                  disabled={submittingQuickPrice}
                  className="px-4 py-2.5 bg-surface hover:bg-subtle text-muted rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submittingQuickPrice}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submittingQuickPrice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>اعمال و بروزرسانی قیمت</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
