import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { getValidProductImageUrl } from "../../utils/productUtils";
import { formatSupplierCode, formatSupplierLocation, HighContrastStatusBadge } from "../../utils/statusUtils";
import { DigikalaProductModal } from "../DigikalaProductModal";
import MarketingKitModal from "./MarketingKitModal";
import StoreRecommendationsHub from "./StoreRecommendationsHub";
import { Sparkles } from "lucide-react";
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
  CheckSquare,
  Square,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  ShoppingBag
} from "lucide-react";

export default function StoreMarketplace({
  globalSearchTerm,
}: {
  globalSearchTerm?: string;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitData, setLimitData] = useState({
    limit: 3,
    current: 0,
    reason: "",
    isNewStore: false,
  });
  const [addingToCatalog, setAddingToCatalog] = useState<number | null>(null);
  const [myCatalogIds, setMyCatalogIds] = useState<Set<number>>(new Set());

  // Bulk selection state
  const [selectedForBulk, setSelectedForBulk] = useState<Set<number>>(new Set());
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  /* Product Detail Modal state */
  const [marketingKitProduct, setMarketingKitProduct] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  /* Filters */
  const [searchTerm, setSearchTerm] = useState("");
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

  /* Pagination */
  const [page, setPage] = useState(1);
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
        `/api/store-manager/marketplace-products?${query.toString()}`,
        { credentials: "include", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const result = await res.json();
        if (Array.isArray(result)) {
          setProducts(result);
          const cats = Array.from(
            new Set(result.map((p: any) => p.category?.name))
          ).filter(Boolean);
          setCategories(cats);
        } else if (result.data) {
          setProducts(result.data);
          setTotalPages(result.pagination?.totalPages || 1);
          if (categories.length === 0) {
            const cats = Array.from(
              new Set(result.data.map((p: any) => p.category?.name))
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
        fetch("/api/store-manager/my-catalog", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/store-manager/daily-limit", {
          credentials: "include",
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

  const handleOpenProductDetails = (product: any) => {
    // Record view analytics
    const token = localStorage.getItem("token") || "";
    fetch(`/api/store-manager/products/${product.id}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ source: "MARKETPLACE" })
    }).catch(() => {});

    setSelectedProduct(product);
  };

  const handleAddToCatalog = async (product: any) => {
    if (myCatalogIds.has(product.id)) {
      toast("این محصول قبلاً در کاتالوگ فروشگاه شما موجود است.", "info");
      return;
    }

    if (limitData.current >= limitData.limit && !limitData.isNewStore) {
      toast("شما به سقف مجاز انتخاب محصول در ۲۴ ساعت گذشته رسیده‌اید.", "error");
      return;
    }
    setAddingToCatalog(product.id);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/my-catalog", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, source: "MARKETPLACE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "خطا در افزودن محصول", "error");
      } else {
        setMyCatalogIds((prev) => new Set(prev).add(product.id));
        setLimitData((prev) => ({ ...prev, current: prev.current + 1 }));
        toast(data.message || "محصول با موفقیت به کاتالوگ فروشگاه شما اضافه شد.", "success");
      }
    } catch (err) {
      toast("خطای شبکه در افزودن کالا", "error");
    } finally {
      setAddingToCatalog(null);
    }
  };

  const handleToggleBulkSelect = (productId: number) => {
    setSelectedForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    const importableOnPage = products
      .filter((p) => !myCatalogIds.has(p.id) && p.inventory > 0)
      .map((p) => p.id);

    if (selectedForBulk.size >= importableOnPage.length && importableOnPage.every(id => selectedForBulk.has(id))) {
      setSelectedForBulk(new Set());
    } else {
      setSelectedForBulk(new Set(importableOnPage));
    }
  };

  const handleBulkImport = async () => {
    if (selectedForBulk.size === 0) return;
    setIsBulkImporting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/my-catalog/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productIds: Array.from(selectedForBulk),
          source: "MARKETPLACE_BULK"
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast(data.message || `${data.importedCount} محصول با موفقیت اضافه شد.`, "success");
        if (data.importedIds && Array.isArray(data.importedIds)) {
          setMyCatalogIds((prev) => {
            const next = new Set(prev);
            data.importedIds.forEach((id: number) => next.add(id));
            return next;
          });
        }
        setSelectedForBulk(new Set());
        fetchMyCatalogAndLimit();
      } else {
        toast(data.error || "خطا در ورود دسته‌جمعی محصولات", "error");
      }
    } catch (err) {
      toast("خطای ارتباط با سرور در ورود دسته‌جمعی", "error");
    } finally {
      setIsBulkImporting(false);
    }
  };

  const isLimitReached = limitData.current >= limitData.limit && !limitData.isNewStore;

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
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
          onAddToCatalog={(prod) => handleAddToCatalog(prod)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle gap-4">
        <div>
          <h2 className="text-xl font-black text-primary flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary-default" />
            <span>پیشخوان بانک زوپیت (بانک تامین کالای فروشگاه)</span>
          </h2>
          <p className="text-muted text-xs sm:text-sm mt-1">
            کالاهای آماده فروش را بررسی، سود خود را تنظیم و به کاتالوگ فروشگاه خود اضافه کنید.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs bg-surface px-3 py-2 rounded-xl border border-subtle flex items-center gap-2">
            <span className="text-muted">سهمیه انتخابی:</span>
            <span className="font-black text-primary">{limitData.current} از {limitData.limit}</span>
          </div>
          {isLimitReached && (
            <div className="bg-danger/10 text-danger px-3 py-2 rounded-xl text-xs font-bold border border-rose-100">
              سقف انتخاب کالا پر شده است
            </div>
          )}
        </div>
      </div>

      {/* Smart Product Discovery & Recommendations Engine (Prompt 09) */}
      <StoreRecommendationsHub onProductAdded={() => fetchMyCatalogAndLimit()} />

      {/* Quota rule explanation banner */}
      <div className="bg-surface border border-blue-100 text-blue-900 dark:text-blue-200 dark:border-blue-900/50 p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm leading-relaxed">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">قانون سهمیه و انتخاب کالا: </span>
          <span>
            فروشگاه‌های تازه تاسیس در زوپیت می‌توانند در گام نخست مجموعاً تا{" "}
          </span>
          <span className="font-bold underline">۲۰ محصول (سهمیه اولیه کل)</span>
          <span>
            {" "}را بدون محدودیت زمانی انتخاب نمایند. پس از اتمام این سهمیه اولیه، سهمیه افزودن محصول شما روزانه{" "}
          </span>
          <span className="font-bold underline">۳ محصول در هر ۲۴ ساعت</span>
          <span> خواهد بود.</span>
        </div>
      </div>

      {/* Filters & Bulk Selector Actions */}
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-subtle space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="جستجو در نام و توضیحات کالا..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary-default outline-none text-primary"
            />
            <Search className="w-4 h-4 text-muted absolute left-3 top-3.5" />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="border border-subtle rounded-xl px-3 py-2.5 text-sm text-secondary bg-surface outline-none"
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
            className="border border-subtle rounded-xl px-3 py-2.5 text-sm bg-surface outline-none text-primary"
          />

          <input
            type="number"
            placeholder="حداکثر قیمت"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
            className="border border-subtle rounded-xl px-3 py-2.5 text-sm bg-surface outline-none text-primary"
          />

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="border border-subtle rounded-xl px-3 py-2.5 text-sm text-secondary bg-surface outline-none"
          >
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
          </select>
        </div>

        {/* Bulk Action Toggle Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-subtle flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectAllOnPage}
            className="flex items-center gap-1.5 text-primary-default font-bold hover:underline cursor-pointer"
          >
            {selectedForBulk.size > 0 ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4 text-muted" />
            )}
            <span>انتخاب همه محصولات قابل واردسازی در این صفحه</span>
          </button>

          {selectedForBulk.size > 0 && (
            <span className="text-muted font-medium">
              {selectedForBulk.size} محصول انتخاب شده برای ورود دسته‌جمعی
            </span>
          )}
        </div>
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
              const isSelected = selectedForBulk.has(product.id);
              const isOutOfStock = product.inventory <= 0;
              const wholesalePrice = product.finalPrice || product.supplierBasePrice || 0;
              const estimatedRetailPrice = Math.round(wholesalePrice * 1.2);
              const estimatedProfit = estimatedRetailPrice - wholesalePrice;

              return (
                <div
                  key={product.id}
                  onClick={(e) => {
                    if ((e.target as any).closest("button") || (e.target as any).closest("input")) return;
                    handleOpenProductDetails(product);
                  }}
                  className={`bg-card rounded-2xl shadow-sm border ${
                    isSelected
                      ? "border-primary-default ring-2 ring-primary-default/20"
                      : product.isPinned
                      ? "border-amber-300"
                      : "border-subtle"
                  } overflow-hidden flex flex-col group hover:shadow-md transition-all relative cursor-pointer`}
                >
                  {/* Bulk Select Checkbox */}
                  {!inCatalog && !isOutOfStock && (
                    <div
                      className="absolute top-2.5 left-2.5 z-20 bg-card/90 backdrop-blur-md p-1.5 rounded-lg border border-subtle shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleBulkSelect(product.id)}
                        className="w-4 h-4 rounded text-primary-default focus:ring-primary-default cursor-pointer accent-indigo-600"
                      />
                    </div>
                  )}

                  {product.isPinned && (
                    <div className="absolute top-2.5 right-2.5 bg-warning text-inverse text-xs font-bold px-2 py-0.5 rounded-lg z-10">
                      ویژه
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

                  <div className="p-4 flex-1 flex flex-col">
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

                    <h3 className="font-black text-primary text-sm mb-2 leading-tight group-hover:text-primary-hover transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Supplier Summary Badge on Card */}
                    <div className="text-[11px] bg-surface/60 p-2 rounded-xl border border-subtle mb-3 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] text-primary font-bold">
                        {formatSupplierCode(product.supplierId || product.supplier?.id || product.id)}
                      </span>
                      <div className="text-[10px] text-muted flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-secondary" />
                        <span>{formatSupplierLocation(product.supplierProvince, product.supplierCity)}</span>
                      </div>
                    </div>

                    {/* Stock & Availability Info */}
                    <div className="space-y-1 mb-3 text-xs font-medium text-muted bg-background p-2 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span>موجودی انبار:</span>
                        <span
                          className={
                            product.inventory > 0
                              ? "text-primary font-bold"
                              : "text-danger font-bold"
                          }
                        >
                          {product.inventory > 0
                            ? `${product.inventory} عدد`
                            : "ناموجود"}
                        </span>
                      </div>
                    </div>

                    {/* Profit Preview Badge */}
                    <div className="mb-3 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1 font-bold">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        تخمین سود فروش:
                      </span>
                      <span className="font-mono font-black">
                        +{estimatedProfit.toLocaleString()} ت (~۲۰٪)
                      </span>
                    </div>

                    <div className="mt-auto pt-3 flex flex-col gap-3 border-t border-subtle">
                      <div className="flex justify-between items-end">
                        <p className="text-xs text-muted">قیمت خرید عمده</p>
                        <p className="font-black text-success text-base">
                          {wholesalePrice.toLocaleString()}
                          <span className="text-[10px] font-normal text-muted mr-1">
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
                            handleAddToCatalog(product);
                          }}
                          disabled={inCatalog || isOutOfStock || (isLimitReached && !inCatalog)}
                          className={`col-span-2 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                            inCatalog
                              ? "bg-surface text-success border border-emerald-200 cursor-default"
                              : isOutOfStock
                              ? "bg-surface text-muted cursor-not-allowed"
                              : isLimitReached
                              ? "bg-surface text-muted cursor-not-allowed"
                              : "bg-primary-default text-inverse hover:bg-primary-hover shadow-sm cursor-pointer"
                          }`}
                        >
                          {addingToCatalog === product.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : inCatalog ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" /> در کاتالوگ شما
                            </>
                          ) : isOutOfStock ? (
                            "ناموجود"
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> افزودن به فروشگاه
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
              <div className="col-span-full py-12 text-center text-muted bg-card rounded-2xl border border-subtle">
                محصولی مطابق فیلترهای انتخابی یافت نشد.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-subtle rounded-xl text-sm font-medium hover:bg-background disabled:opacity-50 cursor-pointer"
              >
                قبلی
              </button>
              <span className="px-4 py-2 flex items-center text-sm font-medium text-muted">
                صفحه {page} از {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-subtle rounded-xl text-sm font-medium hover:bg-background disabled:opacity-50 cursor-pointer"
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}

      {/* Floating Bulk Import Action Bar */}
      {selectedForBulk.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6 max-w-xl w-[90%] justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white font-black text-sm w-7 h-7 rounded-full flex items-center justify-center">
              {selectedForBulk.size}
            </span>
            <div className="text-xs">
              <p className="font-bold">محصول انتخاب شده برای ورود دسته‌جمعی</p>
              <p className="text-slate-400 text-[11px]">مستقیماً به کاتالوگ و فروشگاه شما اضافه می‌شود</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedForBulk(new Set())}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={isBulkImporting}
              onClick={handleBulkImport}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isBulkImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال افزودن...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>افزودن دسته‌جمعی به کاتالوگ</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
