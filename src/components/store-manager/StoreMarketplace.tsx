import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
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
  /* Product Detail Modal state */ const [selectedProduct, setSelectedProduct] =
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
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          
          <div
            className="bg-card rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
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
            <div className="p-6 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Images */}
                <div className="space-y-4">
                  
                  <div className="aspect-square bg-surface rounded-2xl flex items-center justify-center overflow-hidden border border-subtle">
                    
                    {selectedProduct.images?.length > 0 &&
                    selectedProduct.images[0].url ? (
                      <img
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
                          
                          <img
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
                  {/* Technical Specifications & Description */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-xs font-bold text-primary-default block mb-1">
                        معرفی کالا
                      </span>
                      <p className="text-muted text-sm leading-relaxed bg-background/80 border border-subtle p-4 rounded-xl">
                        {selectedProduct.shortDescription ||
                          selectedProduct.longDescription ||
                          "توضیحاتی برای این محصول ثبت نشده است."}
                      </p>
                    </div>
                    {selectedProduct.longDescription && selectedProduct.shortDescription && (
                      <div>
                        <span className="text-xs font-bold text-secondary block mb-1">
                          توضیحات تکمیلی
                        </span>
                        <p className="text-muted text-xs leading-relaxed bg-background/50 border border-subtle p-3 rounded-xl whitespace-pre-line">
                          {selectedProduct.longDescription}
                        </p>
                      </div>
                    )}
                  </div>
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
                    
                    {/* General Specifications Grid */}
                    <div className="grid grid-cols-2 gap-y-2.5 text-xs bg-background/60 p-3.5 rounded-xl border border-subtle">
                      <div className="text-muted">تامین‌کننده / شهر:</div>
                      <div className="font-bold text-primary">{selectedProduct.supplierName || selectedProduct.supplierCity || "تهران"}</div>
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

                    {/* Detailed Technical Specifications */}
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
                              <span className="text-[11px] font-black text-secondary block">ویژگی‌های ساختاری و فنی:</span>
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
                  <div className="mt-auto pt-4 border-t border-subtle flex gap-3">
                    
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-6 py-4 rounded-xl text-base font-bold text-muted bg-surface hover:bg-surface transition-colors"
                    >
                      
                      بستن
                    </button>
                    <button
                      onClick={() => handleAddToCatalog(selectedProduct)}
                      disabled={
                        myCatalogIds.has(selectedProduct.id) ||
                        (isLimitReached &&
                          !myCatalogIds.has(selectedProduct.id))
                      }
                      className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 text-base font-bold transition-colors ${myCatalogIds.has(selectedProduct.id) ? "bg-surface text-success cursor-not-allowed" : isLimitReached ? "bg-surface text-muted cursor-not-allowed" : "bg-primary-default text-inverse hover:bg-primary-hover shadow-lg hover:shadow-indigo-200"}`}
                    >
                      
                      {addingToCatalog === selectedProduct.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : myCatalogIds.has(selectedProduct.id) ? (
                        <>
                          
                          <Check className="w-5 h-5" /> این محصول در زوپیتی
                          شما موجود است
                        </>
                      ) : (
                        <>
                          
                          <Plus className="w-5 h-5" /> افزودن به زوپیتی
                          من
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {/* Variants Section */}
              {selectedProduct.variants &&
                selectedProduct.variants.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-subtle">
                    
                    <h4 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                      
                      <Layers className="w-5 h-5 text-primary-default" />
                      متغیرهای کالا (اندازه، رنگ و مشخصات فرعی)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {selectedProduct.variants.map((v: any) => {
                        let displayAttrs = "ساده / پیش‌فرض";
                        try {
                          const parsed =
                            typeof v.attributes === "string"
                              ? JSON.parse(v.attributes)
                              : v.attributes;
                          if (parsed && Object.keys(parsed).length > 0) {
                            displayAttrs = Object.entries(parsed)
                              .map(([key, val]) => `${key}: ${val}`)
                              .join(" |");
                          }
                        } catch (e) {}
                        return (
                          <div
                            key={v.id}
                            className="bg-background border border-slate-150 rounded-2xl p-4 flex justify-between items-center hover:border-default transition-all"
                          >
                            
                            <div>
                              
                              <span className="text-xs text-muted block mb-1 font-medium">
                                ویژگی
                              </span>
                              <span className="font-bold text-primary text-sm">
                                {displayAttrs}
                              </span>
                            </div>
                            <div className="text-left">
                              
                              <span className="text-xs text-muted block mb-1 font-medium">
                                کد SKU و موجودی
                              </span>
                              <span className="font-extrabold text-primary-default text-sm block">
                                {v.stock} عدد
                              </span>
                              {v.sku && (
                                <span
                                  className="text-muted text-[10px] block font-mono"
                                  dir="ltr"
                                >
                                  {v.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              {/* Detailed description */}
              <div className="mt-8 pt-6 border-t border-subtle">
                
                <h4 className="text-base font-bold text-primary mb-3">
                  توضیحات تکمیلی کالا
                </h4>
                <div className="prose prose-slate max-w-none text-muted text-sm leading-loose bg-background/50 p-5 rounded-2xl border border-subtle">
                  
                  {selectedProduct.longDescription ||
                    "توضیحات تکمیلی برای این محصول ثبت نشده است."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle">
        
        <div>
          
          <h2 className="text-xl font-bold text-primary">
            پیشخوان زوپیت (Marketplace Catalog)
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
                    
                    {product.images?.length > 0 && product.images[0].url ? (
                      <img
                        src={product.images[0].url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={product.name}
                      />
                    ) : (
                      <Layers className="w-16 h-16 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    
                    <div className="flex justify-between items-start mb-2">
                      
                      <p className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">
                        {product.category?.name}
                      </p>
                    </div>
                    <h3 className="font-bold text-primary text-lg mb-2 leading-tight group-hover:text-primary-hover transition-colors">
                      
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted mb-3 line-clamp-2">
                      {product.description ||
                        product.shortDescription ||
                        "بدون توضیحات"}
                    </p>
                    <div className="space-y-1 mb-4 text-xs font-medium text-muted bg-background p-2 rounded-lg">
                      
                      <div className="flex justify-between">
                        
                        <span>موجودی:</span>
                        <span
                          className={
                            product.inventory > 0
                              ? "text-primary"
                              : "text-danger"
                          }
                        >
                          
                          {product.inventory > 0
                            ? product.inventory
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
                      <button
                        onClick={() => handleAddToCatalog(product)}
                        disabled={inCatalog || (isLimitReached && !inCatalog)}
                        className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors ${inCatalog ? "bg-surface text-success cursor-not-allowed" : isLimitReached ? "bg-surface text-muted cursor-not-allowed" : "bg-primary-default text-inverse hover:bg-primary-hover"}`}
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
