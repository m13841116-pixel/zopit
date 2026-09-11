import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { getValidProductImageUrl } from "../../utils/productUtils";
import { formatSupplierCode, formatSupplierLocation, HighContrastStatusBadge } from "../../utils/statusUtils";
import { DigikalaProductModal } from "../DigikalaProductModal";
import MarketingKitModal from "./MarketingKitModal";
import { Sparkles, AlertCircle, Zap, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import {
  Search,
  Layers,
  Check,
  Plus,
  X,
  Tag,
  Package,
  Calendar,
  Settings,
  Info,
  Building2,
  MapPin,
  Eye,
} from "lucide-react";

export default function StoreMarketplace({
  globalSearchTerm,
  onNavigateToPro,
}: {
  globalSearchTerm?: string;
  onNavigateToPro?: () => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitData, setLimitData] = useState({
    limit: 20,
    current: 0,
    reason: "",
    isNewStore: true,
  });
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [addingToCatalog, setAddingToCatalog] = useState<number | null>(null);
  const [myCatalogIds, setMyCatalogIds] = useState<Set<number>>(new Set());
  /* Product Detail Modal state */ const [marketingKitProduct, setMarketingKitProduct] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<any | null>(null);
  /* Filters */ const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setSearchTerm(globalSearchTerm);
      setPage(1);
    }
  }, [globalSearchTerm]);
  /* Pagination */ const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(searchTerm && { search: searchTerm }),
        ...(category && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      });
      const res = await fetch(
        `/api/store-manager/marketplace-products?${query.toString()}`, { credentials: "include", headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const result = await res.json();
        if (Array.isArray(result)) {
          setProducts(result);
          const cats = Array.from(
            new Set(result.map((p: any) => p.category?.name)),
          ).filter(Boolean);
          setCategories(cats);
        } else if (result.data) {
          setProducts(result.data);
          setTotalPages(result.pagination.totalPages || 1);
          if (categories.length === 0) {
            const cats = Array.from(
              new Set(result.data.map((p: any) => p.category?.name)),
            ).filter(Boolean);
            setCategories(cats);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchMyCatalogAndLimit = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const [catalogRes, limitRes] = await Promise.all([
        fetch("/api/store-manager/my-catalog", { credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/store-manager/daily-limit", { credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (catalogRes.ok) {
        const catalog = await catalogRes.json();
        setMyCatalogIds(new Set(catalog.map((c: any) => c.productId)));
      }
      if (limitRes.ok) setLimitData(await limitRes.json());
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, category, minPrice, maxPrice]);
  useEffect(() => {
    fetchMyCatalogAndLimit();
  }, []);

  const isLimitReached = limitData.current >= 20 || (limitData.limit > 0 && limitData.current >= limitData.limit);

  const handleAddToCatalog = async (product: any) => {
    if (isLimitReached) {
      setShowQuotaModal(true);
      return;
    }
    setAddingToCatalog(product.id);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/my-catalog", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("سهمیه") || data.error?.includes("سقف") || res.status === 403) {
          setShowQuotaModal(true);
        } else {
          toast(data.error, "error");
        }
      } else {
        setMyCatalogIds((prev) => new Set(prev).add(product.id));
        setLimitData((prev) => ({ ...prev, current: prev.current + 1 }));
        toast("محصول با موفقیت به زوپیتی شما اضافه شد.", "success");
      }
    } catch (err) {
      toast("Network error", "error");
    } finally {
      setAddingToCatalog(null);
    }
  };

  const navigateToPro = () => {
    if (onNavigateToPro) {
      onNavigateToPro();
    } else {
      window.location.href = "/store/pro_account";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Quota Exceeded Upgrade Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-fade-in text-center relative">
            <button
              type="button"
              onClick={() => setShowQuotaModal(false)}
              className="absolute top-4 left-4 p-2 text-muted hover:text-primary rounded-full hover:bg-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-primary mb-2">تکمیل سهمیه انتخاب محصول</h3>
            <p className="text-secondary text-sm leading-relaxed mb-6 font-medium">
              سهمیه افزودن محصول شما در پلن رایگان به پایان رسیده است. برای افزودن این محصول و نامحدودسازی سهمیه، اکانت خود را ارتقا دهید.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowQuotaModal(false);
                  navigateToPro();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-primary-default hover:bg-primary-hover text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-primary-default/20 transition-all cursor-pointer"
              >
                <span>مشاهده پلن‌های پرو</span>
                <span className="text-amber-300">⚡</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQuotaModal(false)}
                className="py-3 px-5 rounded-xl border border-subtle bg-surface hover:bg-card text-secondary font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

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
          mode="store-marketplace"
          isInCatalog={myCatalogIds.has(selectedProduct.id)}
          isAddingToCatalog={addingToCatalog === selectedProduct.id}
          onAddToCatalog={(prod) => {
            if (isLimitReached) {
              setShowQuotaModal(true);
            } else {
              handleAddToCatalog(prod);
            }
          }}
        />
      )}

      {/* Header & Active Quota Banner */}
      <div className="bg-card border border-subtle rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-default/10 border border-primary-default/20 text-primary-default flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-primary">
                سهمیه فعال شما:
              </h2>
              <span className="font-mono font-black text-base text-primary-default bg-primary-default/10 px-3 py-0.5 rounded-xl border border-primary-default/20">
                {Math.min(limitData.current, 20)} از ۲۰ محصول
              </span>
            </div>
            <p className="text-secondary text-xs sm:text-sm mt-2 leading-relaxed max-w-2xl font-medium">
              شما در حساب رایگان می‌توانید تا سهمیه ۲۰ محصول را به ویترین خود اضافه کنید (سهمیه روزانه: ۳ محصول). برای برداشتن محدودیت سهمیه، افزایش فروش و دسترسی نامحدود به کالاها، اکانت خود را به پرو ارتقا دهید.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={navigateToPro}
          className="shrink-0 w-full md:w-auto bg-primary-default hover:bg-primary-hover active:scale-95 text-white font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-primary-default/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>ارتقا به اکانت پرو</span>
          <span className="text-amber-300">⚡</span>
        </button>
      </div>
      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-subtle grid grid-cols-1 md:grid-cols-6 gap-4">
        
        <div className="md:col-span-2 relative">
          
          <input
            type="text"
            placeholder="جستجو در محصولات..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-subtle rounded-xl text-sm focus:ring-2 focus:ring-success"
          />
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="border border-subtle rounded-xl px-3 py-2 text-sm text-secondary"
        >
          
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map((c: any) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="حداقل قیمت"
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value);
            setPage(1);
          }}
          className="border border-subtle rounded-xl px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="حداکثر قیمت"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(1);
          }}
          className="border border-subtle rounded-xl px-3 py-2 text-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="border border-subtle rounded-xl px-3 py-2 text-sm text-secondary"
        >
          
          <option value="newest">جدیدترین</option>
          <option value="price_asc">ارزان‌ترین</option>
          <option value="price_desc">گران‌ترین</option>
        </select>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden flex flex-col animate-pulse"
            >
              
              <div className="h-48 bg-surface" />
              <div className="p-5 flex-1 flex flex-col space-y-4">
                
                <div className="h-4 bg-surface rounded w-1/3" />
                <div className="h-6 bg-surface rounded w-3/4" />
                <div className="space-y-2">
                  
                  <div className="h-3 bg-surface rounded" />
                  <div className="h-3 bg-surface rounded w-5/6" />
                </div>
                <div className="pt-4 border-t border-subtle flex flex-col gap-3 mt-auto">
                  
                  <div className="flex justify-between items-center">
                    
                    <div className="h-3 bg-surface rounded w-1/4" />
                    <div className="h-5 bg-surface rounded w-1/3" />
                  </div>
                  <div className="h-10 bg-surface rounded-xl w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            {products.map((product) => {
              const inCatalog = myCatalogIds.has(product.id);
              return (
                <div
                  key={product.id}
                  onClick={(e) => {
                    if ((e.target as any).closest("button")) return;
                    setSelectedProduct(product);
                  }}
                  className={`bg-card rounded-2xl shadow-sm border ${product.isPinned ? "border-amber-300" : "border-subtle"} overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative cursor-pointer`}
                >
                  
                  {product.isPinned && (
                    <div className="absolute top-2 right-2 bg-warning text-inverse text-xs font-bold px-2 py-1 rounded-lg z-10">
                      ویژه
                    </div>
                  )}
                  {product.inventory > 0 && product.inventory < 5 && (
                    <div className="absolute top-2 left-2 bg-rose-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg z-10 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>موجودی رو به اتمام</span>
                    </div>
                  )}
                  <div className="h-48 bg-surface relative overflow-hidden flex items-center justify-center text-inverse">
                    {(() => {
                      const img = getValidProductImageUrl(product);
                      if (img) {
                        return (
                          <img
                            src={img}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={product.name}
                          />
                        );
                      }
                      return (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted">
                          <Layers className="w-10 h-10 opacity-40" />
                          <span className="text-[11px] font-bold">تصویر ثبت نشده</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <p className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-lg border border-emerald-100">
                        {product.category?.name || "عمومی"}
                      </p>
                      {product.brand && (
                        <span className="text-[10px] font-bold text-secondary bg-surface px-2 py-0.5 rounded-lg border border-subtle">
                          {product.brand}
                        </span>
                      )}
                    </div>

                    
                    <h3 className="font-bold text-primary text-base mb-2 leading-tight group-hover:text-primary-hover transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Trust Badges & Supplier Quality */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {product.supplierInfo?.fulfillmentRate >= 95 && (
                        <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1 shadow-2xs" title={`تأمین‌کننده طلایی (نرخ تأمین موفق: ${product.supplierInfo?.fulfillmentRate || 95}٪)`}>
                          <Sparkles className="w-3 h-3 text-amber-500" /> طلایی ({product.supplierInfo?.fulfillmentRate || 95}٪)
                        </span>
                      )}
                      {product.supplierInfo?.avgProcessingTimeHours <= 24 && (
                        <span className="bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-blue-500/30 flex items-center gap-1 shadow-2xs" title={`ارسال سریع (میانگین زمان پردازش: ${product.supplierInfo?.avgProcessingTimeHours || 12} ساعت)`}>
                          <Zap className="w-3 h-3 text-blue-500" /> ارسال سریع ({product.supplierInfo?.avgProcessingTimeHours || 12}س)
                        </span>
                      )}
                      {(product.supplierInfo?.cancellationRate > 20 || (product.supplierInfo?.warningLevel && product.supplierInfo.warningLevel !== 'NONE')) && (
                        <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-rose-500/30 flex items-center gap-1 shadow-2xs" title="نیازمند بررسی: نرخ لغو بالا یا اخطار">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> نیازمند بررسی
                        </span>
                      )}
                    </div>


                    {/* Supplier Summary Badge on Card (Strict Identification ID & Location) */}
                    <div className="text-[11px] bg-surface/60 p-2.5 rounded-xl border border-subtle mb-3 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] text-primary font-bold">
                        {formatSupplierCode(product.supplierId || product.supplier?.id || product.id)}
                      </span>
                      <div className="text-[10px] text-muted flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-secondary" />
                        <span>{formatSupplierLocation(product.supplierProvince, product.supplierCity)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted mb-3 line-clamp-2">
                      {product.description ||
                        product.shortDescription ||
                        "بدون توضیحات"}
                    </p>

                    {/* Inventory Display & Low Stock Warning */}
                    <div className="space-y-1.5 mb-4 text-xs font-medium bg-surface/70 p-2.5 rounded-xl border border-subtle">
                      <div className="flex justify-between items-center">
                        <span className="text-muted">موجودی انبار تامین‌کننده:</span>
                        <span
                          className={
                            product.inventory > 0
                              ? "text-primary font-bold font-mono"
                              : "text-rose-600 dark:text-rose-400 font-bold"
                          }
                        >
                          {product.inventory > 0
                            ? `${product.inventory.toLocaleString("fa-IR")} عدد`
                            : "ناموجود"}
                        </span>
                      </div>
                      {product.inventory > 0 && product.inventory < 5 && (
                        <div className="pt-1.5 border-t border-rose-200/60 dark:border-rose-900/40">
                          <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center justify-center gap-1 w-full">
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>موجودی رو به اتمام ({product.inventory} عدد)</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-subtle">
                      <div className="flex justify-between items-end">
                        <p className="text-xs text-muted">
                          قیمت نهایی فروش
                        </p>
                        <p className="font-bold text-success text-lg">
                          {product.finalPrice?.toLocaleString()}
                          <span className="text-[10px] font-normal text-muted">
                            تومان
                          </span>
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarketingKitProduct(product);
                          }}
                          className="col-span-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1 text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
                          title="پک بازاریابی و استوری"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>پک تبلیغات</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (inCatalog) return;
                            if (isLimitReached) {
                              setShowQuotaModal(true);
                              return;
                            }
                            handleAddToCatalog(product);
                          }}
                          disabled={inCatalog}
                          className={`col-span-2 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                            inCatalog
                              ? "bg-surface text-muted cursor-not-allowed border border-subtle"
                              : isLimitReached
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer"
                              : "bg-primary-default text-inverse hover:bg-primary-hover active:scale-95 cursor-pointer shadow-xs"
                          }`}
                        >
                          {addingToCatalog === product.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : inCatalog ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-500" />
                              <span>قبلاً انتخاب شده</span>
                            </>
                          ) : isLimitReached ? (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              <span>افزودن (سقف سهمیه)</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>افزودن به زوپیتی من</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted">
                
                محصولی یافت نشد.
              </div>
            )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-subtle rounded-xl text-sm font-medium hover:bg-background disabled:opacity-50"
              >
                
                قبلی
              </button>
              <span className="px-4 py-2 flex items-center text-sm font-medium text-muted">
                
                صفحه {page} از {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-subtle rounded-xl text-sm font-medium hover:bg-background disabled:opacity-50"
              >
                
                بعدی
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
