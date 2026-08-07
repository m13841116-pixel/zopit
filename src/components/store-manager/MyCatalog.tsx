import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { Layers, Trash2, X, Package, Info, Check, Plus, Loader2 } from "lucide-react";
export default function MyCatalog() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(
    null,
  );
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
      
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          
          <div
            className="bg-card rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex justify-between items-center p-6 border-b border-subtle">
              
              <h3 className="text-xl font-bold text-primary">
                جزئیات محصول
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-surface rounded-full transition-colors text-muted"
              >
                
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Images */}
                <div className="space-y-4">
                  
                  <div className="aspect-square bg-surface rounded-2xl flex items-center justify-center overflow-hidden border border-subtle">
                    
                    {selectedProduct.images?.length > 0 ? (
                      <img referrerPolicy="no-referrer"
                        src={selectedProduct.images[0].url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-24 h-24 text-inverse" />
                    )}
                  </div>
                  {selectedProduct.images?.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      
                      {selectedProduct.images.slice(1).map((img: any) => (
                        <div
                          key={img.id}
                          className="aspect-square bg-surface rounded-xl overflow-hidden border border-subtle"
                        >
                          
                          <img referrerPolicy="no-referrer"
                            src={img.url}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Details */}
                <div className="flex flex-col">
                  
                  <div className="flex items-center gap-2 mb-3">
                    
                    <span className="text-xs font-bold text-success bg-success/10 px-3 py-1 rounded-full border border-emerald-100">
                      
                      {selectedProduct.category?.name || "بدون دسته‌بندی"}
                    </span>
                    <span className="text-xs font-bold text-muted bg-surface px-3 py-1 rounded-full border border-subtle">
                      
                      وضعیت:
                      {selectedProduct.status === "ACTIVE" ||
                      selectedProduct.status === "PUBLISHED"
                        ? "منتشر شده"
                        : selectedProduct.status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-muted text-sm mb-6 leading-relaxed">
                    
                    {selectedProduct.shortDescription ||
                      "بدون توضیحات کوتاه"}
                  </p>
                  <div className="bg-background rounded-2xl p-5 mb-6 border border-subtle space-y-4">
                    
                    <div className="flex justify-between items-center pb-4 border-b border-subtle">
                      
                      <span className="text-muted font-medium">
                        قیمت نهایی فروش برای شما
                      </span>
                      <div className="text-left">
                        
                        <span className="text-2xl font-bold text-success">
                          {selectedProduct.finalPrice?.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted mr-1">
                          تومان
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      
                      <div className="flex items-center gap-3">
                        
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-blue-600">
                          
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          
                          <p className="text-xs text-muted">موجودی فعلی</p>
                          <p className="font-bold text-primary">
                            {selectedProduct.inventory} عدد
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                          
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          
                          <p className="text-xs text-muted">
                            حداقل سفارش (MOQ)
                          </p>
                          <p className="font-bold text-primary">
                            {selectedProduct.minOrderQuantity} عدد
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6 flex-1">
                    <h4 className="font-bold text-primary flex items-center gap-2 text-sm border-b border-subtle pb-2">
                      <Info className="w-4 h-4 text-primary-default" /> مشخصات فنی و تخصصی کالا
                    </h4>
                    
                    {/* General Specs */}
                    <div className="grid grid-cols-2 gap-y-2.5 text-xs bg-background/60 p-3.5 rounded-xl border border-subtle">
                      <div className="text-muted">تامین‌کننده:</div>
                      <div className="font-bold text-primary">{selectedProduct.supplierName || "نامشخص"}</div>
                      <div className="text-muted">برند:</div>
                      <div className="font-bold text-primary">{selectedProduct.brand || "ندارد"}</div>
                      <div className="text-muted">کد کالا (SKU):</div>
                      <div className="font-bold text-primary font-mono">{selectedProduct.sku || "ندارد"}</div>
                      {selectedProduct.publishStartDate && (
                        <>
                          <div className="text-muted">تاریخ انتشار:</div>
                          <div className="font-bold text-primary">
                            {new Date(selectedProduct.publishStartDate).toLocaleDateString("fa-IR")}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Detailed Technical Specs */}
                    {(() => {
                      let specsList: Array<{ key: string; value: string }> = [];
                      if (selectedProduct.technicalSpecs) {
                        try {
                          const parsed = typeof selectedProduct.technicalSpecs === "string"
                            ? JSON.parse(selectedProduct.technicalSpecs)
                            : selectedProduct.technicalSpecs;
                          if (Array.isArray(parsed)) {
                            specsList = parsed;
                          } else if (typeof parsed === "object" && parsed !== null) {
                            specsList = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
                          }
                        } catch (e) {
                          // Not valid JSON
                        }
                      }
                      return (
                        <div>
                          {specsList.length > 0 ? (
                            <div className="space-y-2">
                              <span className="text-[11px] font-black text-secondary block">ویژگی‌های تخصصی و ساختاری:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {specsList.map((spec, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-background p-2.5 rounded-xl border border-subtle/80">
                                    <span className="text-muted font-medium">{spec.key}:</span>
                                    <span className="font-bold text-primary">{spec.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : typeof selectedProduct.technicalSpecs === "string" && selectedProduct.technicalSpecs.trim() ? (
                            <div className="space-y-1">
                              <span className="text-[11px] font-black text-secondary block">ویژگی‌های تخصصی:</span>
                              <p className="text-xs text-secondary leading-relaxed bg-background p-3 rounded-xl border border-subtle whitespace-pre-line">
                                {selectedProduct.technicalSpecs}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>

                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-3 mb-6 flex-1">
                      <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-muted" /> متغیرهای کالا و موجودی هر کدام
                      </h4>
                      <div className="space-y-2 border border-subtle p-4 rounded-xl bg-background/50">
                        {selectedProduct.variants.map((v: any) => {
                          let displayAttrs = "ساده / پیش‌فرض";
                          try {
                            const parsed = typeof v.attributes === "string" 
                              ? JSON.parse(v.attributes) 
                              : v.attributes;
                            if (parsed && Object.keys(parsed).length > 0) {
                              displayAttrs = Object.entries(parsed)
                                .map(([k, val]) => `${k}: ${val}`)
                                .join(" | ");
                            }
                          } catch (e) {}

                          return (
                            <div key={v.id} className="flex justify-between items-center text-xs py-2 border-b border-subtle last:border-none">
                              <span className="font-bold text-primary">{displayAttrs}</span>
                              <div className="flex items-center gap-4 font-sans">
                                <span className="font-semibold text-secondary bg-surface px-2 py-0.5 rounded border border-subtle">
                                  موجودی: {v.stock} عدد
                                </span>
                                <span className="font-bold text-success font-mono">{v.finalPrice?.toLocaleString()} تومان</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-subtle flex gap-3">
                    
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-6 py-4 rounded-xl text-base font-bold text-muted bg-surface hover:bg-surface transition-colors"
                    >
                      
                      بستن
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(selectedProduct.id)}
                      className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 text-base font-bold bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                    >
                      
                      <Trash2 className="w-5 h-5" /> حذف از زوپیتی من
                    </button>
                  </div>
                </div>
              </div>
              {selectedProduct.longDescription && (
                <div className="mt-12 pt-8 border-t border-subtle">
                  
                  <h4 className="text-lg font-bold text-primary mb-4">
                    توضیحات تکمیلی
                  </h4>
                  <div className="prose prose-slate max-w-none text-muted text-sm leading-loose">
                    
                    {selectedProduct.longDescription}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
                <div className="h-48 bg-surface relative overflow-hidden flex items-center justify-center text-inverse">
                  {product.images?.length > 0 ? (
                    <img referrerPolicy="no-referrer"
                      src={product.images[0].url}
                      className="w-full h-full object-cover"
                      alt={product.name}
                    />
                  ) : (
                    <Layers className="w-16 h-16" />
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
                    <div className="flex justify-between items-center text-xs text-muted font-medium">
                      <span>
                        وضعیت:{" "}
                        {item.status === "PENDING_SYNC"
                          ? "در انتظار سینک"
                          : "سینک شده"}
                      </span>
                      <span>
                        {new Date(item.selected_at).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <button
                        onClick={() => setShowConfirmDelete(product.id)}
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
    </div>
  );
}
