import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { getValidProductImageUrl } from "../../utils/productUtils";
import { formatSupplierCode, formatSupplierLocation, HighContrastStatusBadge } from "../../utils/statusUtils";
import { DigikalaProductModal } from "../DigikalaProductModal";
import MarketingKitModal from "./MarketingKitModal";
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
        const result = await res.json(); // Since we changed the backend to return { data, pagination }, we need to handle it.
        // If the backend was old it might return an array, so handle both:
        if (Array.isArray(result)) {
          setProducts(result);
          const cats = Array.from(
            new Set(result.map((p: any) => p.category?.name)),
          ).filter(Boolean);
          setCategories(cats);
        } else if (result.data) {
          setProducts(result.data);
          setTotalPages(result.pagination.totalPages || 1);
          // Try to extract categories from data if we haven't already
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
  const handleAddToCatalog = async (product: any) => {
    if (limitData.current >= limitData.limit) {
      toast("شما به سقف مجاز انتخاب محصول در ۲۴ ساعت گذشته رسیده‌اید.", "error");
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
        toast(data.error, "error");
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
  const isLimitReached = limitData.current >= limitData.limit;
  return (
    <div className="space-y-6 animate-fade-in relative">
      
      
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
      <div className="flex justify-between items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle">
        
        <div>
          
          <h2 className="text-xl font-bold text-primary">
            پیشخوان بانک زوپیت (Zopit Bank)
          </h2>
          <p className="text-muted text-sm mt-1">
            
            سهمیه انتخاب فعلی:
            <span className="font-bold text-secondary">
              {limitData.current}
            </span>
            از
            <span className="font-bold text-secondary">{limitData.limit}</span>
            محصول
          </p>
        </div>
        {isLimitReached && (
          <div className="bg-danger/10 text-danger px-4 py-2 rounded-xl text-sm font-bold border border-rose-100">
            
            شما به حد نصاب انتخاب کالا رسیده‌اید
          </div>
        )}
      </div>
      {/* Quota rule explanation banner */}
      <div className="bg-surface border border-blue-100 text-blue-800 p-4 rounded-2xl flex items-start gap-3 text-sm leading-relaxed">
        
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          
          <span className="font-bold">
            قانون سهمیه افزودن به زوپیت:
          </span>
          <span>
            فروشگاه‌های تازه تاسیس در زوپیت می‌توانند در گام نخست مجموعاً
            تا
          </span>
          <span className="font-bold underline">۲۰ محصول (سهمیه اولیه کل)</span>
          <span>
            
            را بدون محدودیت زمانی انتخاب نمایند. پس از اتمام این سهمیه اولیه،
            سهمیه افزودن محصول شما به حداکثر
          </span>
          <span className="font-bold underline">
            ۳ محصول در هر ۲۴ ساعت
          </span>
          <span> تغییر خواهد کرد. وضعیت فعلی شما: </span>
          <span className="font-semibold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded text-xs inline-block mr-1">
            
            {limitData.reason ||
              (limitData.isNewStore
                ? "فروشگاه جدید (تا ۲۰ محصول)"
                : "محدودیت عادی (۳ محصول در روز)")}
          </span>
        </div>
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

                    <div className="space-y-1 mb-4 text-xs font-medium text-muted bg-background p-2 rounded-lg">
                      <div className="flex justify-between">
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
                          onClick={() => handleAddToCatalog(product)}
                          disabled={inCatalog || (isLimitReached && !inCatalog)}
                          className={`col-span-2 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${inCatalog ? "bg-surface text-success cursor-not-allowed" : isLimitReached ? "bg-surface text-muted cursor-not-allowed" : "bg-primary-default text-inverse hover:bg-primary-hover cursor-pointer"}`}
                        >
                        
                        {addingToCatalog === product.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : inCatalog ? (
                          <>
                            
                            <Check className="w-4 h-4" /> قبلاً انتخاب شده
                          </>
                        ) : (
                          <>
                            
                            <Plus className="w-4 h-4" /> افزودن به زوپیتی
                            من
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
