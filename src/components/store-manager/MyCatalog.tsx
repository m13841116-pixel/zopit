import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { getValidProductImageUrl } from "../../utils/productUtils";
import { HighContrastStatusBadge } from "../../utils/statusUtils";
import { DigikalaProductModal } from "../DigikalaProductModal";
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

  const [customizingProduct, setCustomizingProduct] = useState<any | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [submittingCustomization, setSubmittingCustomization] = useState(false);

  const fetchCatalog = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/my-catalog", { credentials: "include",
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
          customImageUrl: customImageUrl.trim()
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
      
      {/* Digikala Style Product Detail Modal */}
      {selectedProduct && (
        <DigikalaProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          mode="my-catalog"
          onRemoveFromCatalog={(prod) => setShowConfirmDelete(prod.id)}
        />
      )}
      <div className="flex justify-between items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle">
        
        <div>
          
          <h2 className="text-xl font-bold text-primary">
            زوپیتی من (My Product Catalog)
          </h2>
          <p className="text-muted text-sm mt-1">
            
            محصولاتی که برای فروشگاه خود انتخاب کرده‌اید. این محصولات آماده
            اتصال به ووکامرس/شاپایفای شما هستند.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="text-center p-12 text-muted">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {catalog.map((item) => {
            const product = item.product;
            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative cursor-pointer"
                onClick={(e) => {
                  if ((e.target as any).closest("button")) return;
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
                    <div className="flex justify-between items-end">
                      <p className="text-xs text-muted">قیمت نهایی فروش</p>
                      <p className="font-bold text-success text-lg">
                        {product.finalPrice?.toLocaleString()}
                        <span className="text-[10px] font-normal text-muted mr-1">
                          تومان
                        </span>
                      </p>
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
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderingProduct(product);
                          setOrderQuantity(1);
                          setOrderVariantId(product.variants?.[0]?.id?.toString() || "");
                        }}
                        className="py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black bg-primary-default hover:bg-primary-hover text-white transition-all cursor-pointer shadow-sm"
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
                        className="py-2.5 px-1 rounded-xl flex items-center justify-center gap-1 text-xs font-black bg-danger/10 text-danger hover:bg-danger/20 transition-all cursor-pointer"
                      >
                        حذف کالا
                      </button>
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
    </div>
  );
}
