import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  DollarSign,
  X,
  Calendar,
  Pin,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Package,
  Tag,
  Users,
  Layers,
  Shield,
  Sliders,
  Check,
  Search,
  Filter,
  RotateCcw,
  ArrowUpDown,
  Image as ImageIcon,
} from "lucide-react";
export default function ProductsList() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [pricingStatus, setPricingStatus] = useState<"ALL" | "PRICED" | "UNPRICED">("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");
  const [sortDate, setSortDate] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Explore states
  const [subTab, setSubTab] = useState<"all" | "explore">("all");
  const [exploreProducts, setExploreProducts] = useState<any[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [selectedExploreProduct, setSelectedExploreProduct] = useState<any>(null);
  const [exploreForm, setExploreForm] = useState({
    customTitle: "",
    customDescription: "",
    customImageUrl: "",
    customVideoUrl: "",
    isPublished: true,
  });
  const [submittingExplore, setSubmittingExplore] = useState(false);

  // Modals state
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  /* Pricing margin state */ const [publishData, setPublishData] = useState({
    marginType: "PERCENTAGE",
    marginValue: 10,
    publishStartDate: "",
    publishEndDate: "",
    isPinned: false,
  });
  /* Create/Edit product state */ const [productForm, setProductForm] =
    useState({
      id: "",
      name: "",
      categoryId: "",
      supplierId: "",
      shortDescription: "",
      longDescription: "",
      supplierBasePrice: "",
      finalPrice: "",
      sku: "",
      brand: "",
      inventory: "0",
      imageUrl: "",
    });
  const [techSpecs, setTechSpecs] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
  const fetchProducts = () => {
    const token = localStorage.getItem("token") || "";
    fetch("/api/admin/products", { credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const [catRes, supRes] = await Promise.all([
        fetch("/api/admin/categories", { credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/suppliers", { credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (catRes.ok && catRes.headers.get("content-type")?.includes("application/json")) {
        const cats = await catRes.json();
        setCategories(cats);
      }
      if (supRes.ok && supRes.headers.get("content-type")?.includes("application/json")) {
        const sups = await supRes.json();
        setSuppliers(sups);
      }
    } catch (err) {
      console.error("Error fetching admin metadata:", err);
    }
  };
  const fetchExploreProducts = async () => {
    setLoadingExplore(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/admin/explore-products", { credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExploreProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExplore(false);
    }
  };

  const handleExploreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExploreProduct) return;
    setSubmittingExplore(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/explore-products/${selectedExploreProduct.id}/publish`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customTitle: exploreForm.customTitle,
          customDescription: exploreForm.customDescription,
          customImageUrl: exploreForm.customImageUrl,
          customVideoUrl: exploreForm.customVideoUrl,
          isPublished: exploreForm.isPublished,
        }),
      });
      if (res.ok) {
        toast("سفارشی‌سازی اکسپلور با موفقیت ذخیره شد.", "success");
        setShowExploreModal(false);
        fetchExploreProducts();
      } else {
        toast("خطا در ذخیره‌سازی سفارشی‌سازی اکسپلور.", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور.", "error");
    } finally {
      setSubmittingExplore(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (subTab === "explore") {
      fetchExploreProducts();
    }
  }, [subTab]);
  const handlePublish = () => {
    if (!selectedProduct) return;
    /* calculate final price */ let finalPrice =
      selectedProduct.supplierBasePrice;
    if (publishData.marginType === "PERCENTAGE") {
      finalPrice =
        selectedProduct.supplierBasePrice * (1 + publishData.marginValue / 100);
    } else {
      finalPrice = selectedProduct.supplierBasePrice + publishData.marginValue;
    }
    fetch(`/api/admin/products/${selectedProduct.id}/publish`, { credentials: "include",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        ...publishData,
        finalPrice,
        publishStartDate: publishData.publishStartDate || null,
        publishEndDate: publishData.publishEndDate || null,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          toast(error.error || "خطا در انتشار محصول", "error");
          return;
        }
        setShowMarginModal(false);
        fetchProducts();
      })
      .catch((err) => {
        console.error(err);
        toast("خطا در ارتباط با سرور", "error");
      });
  };
  const handleChangeStatus = (id: number, status: string) => {
    fetch(`/api/admin/products/${id}/status`, { credentials: "include",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ status }),
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then(() => fetchProducts());
  };
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (
      !productForm.name ||
      !productForm.categoryId ||
      !productForm.supplierBasePrice
    ) {
      setFormError(
        "نام محصول، دسته‌بندی و قیمت پایه تامین‌کننده الزامی هستند.",
      );
      return;
    }
    try {
      const token = localStorage.getItem("token") || "";
      const url = isEditing
        ? `/api/admin/products/${productForm.id}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, { credentials: "include",
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productForm.name,
          categoryId: parseInt(productForm.categoryId),
          supplierId: productForm.supplierId
            ? parseInt(productForm.supplierId)
            : undefined,
          shortDescription: productForm.shortDescription || null,
          longDescription: productForm.longDescription || null,
          technicalSpecs: techSpecs.filter((s) => s.key.trim() && s.value.trim()),
          supplierBasePrice: parseFloat(productForm.supplierBasePrice),
          finalPrice: productForm.finalPrice
            ? parseFloat(productForm.finalPrice)
            : null,
          sku: productForm.sku || null,
          brand: productForm.brand || null,
          inventory: parseInt(productForm.inventory) || 0,
          imageUrl: productForm.imageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "خطا در ثبت اطلاعات محصول.");
        return;
      }
      setShowAddEditModal(false);
      fetchProducts();
    } catch (err) {
      setFormError("خطا در ارتباط با سرور.");
    }
  };
  const handleDeleteProduct = async (id: number) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/products/${id}`, { credentials: "include",
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProducts();
      } else {
        const data = await res.json();
        toast(data.error || "خطا در حذف محصول.", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور.", "error");
    }
  };
  const openAddModal = () => {
    setIsEditing(false);
    setFormError("");
    const randomSkuNum = Math.floor(100000 + Math.random() * 900000);
    setProductForm({
      id: "",
      name: "",
      categoryId: categories[0]?.id?.toString() || "",
      supplierId: suppliers[0]?.id?.toString() || "",
      shortDescription: "",
      longDescription: "",
      supplierBasePrice: "",
      finalPrice: "",
      sku: `BK-${randomSkuNum}`,
      brand: "",
      inventory: "0",
      imageUrl: "",
    });
    setTechSpecs([{ key: "", value: "" }]);
    setShowAddEditModal(true);
  };
  const openEditModal = (product: any) => {
    setIsEditing(true);
    setFormError("");
    const randomSkuNum = Math.floor(100000 + Math.random() * 900000);
    setProductForm({
      id: product.id,
      name: product.name || "",
      categoryId: product.categoryId?.toString() || "",
      supplierId: product.supplierId?.toString() || "",
      shortDescription: product.shortDescription || "",
      longDescription: product.longDescription || "",
      supplierBasePrice: product.supplierBasePrice?.toString() || "",
      finalPrice: product.finalPrice?.toString() || "",
      sku: product.sku || `BK-${randomSkuNum}`,
      brand: product.brand || "",
      inventory: product.inventory?.toString() || "0",
      imageUrl: product.images?.[0]?.url || "",
    });
    if (product.technicalSpecs) {
      try {
        const parsed = typeof product.technicalSpecs === "string" ? JSON.parse(product.technicalSpecs) : product.technicalSpecs;
        if (Array.isArray(parsed)) {
          setTechSpecs(parsed.length > 0 ? parsed : [{ key: "", value: "" }]);
        } else {
          setTechSpecs([{ key: "", value: "" }]);
        }
      } catch (e) {
        setTechSpecs([{ key: "", value: "" }]);
      }
    } else {
      setTechSpecs([{ key: "", value: "" }]);
    }
    setShowAddEditModal(true);
  };
  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "پیش‌نویس",
      PENDING_APPROVAL: "در انتظار تایید",
      ACTIVE: "فعال",
      PUBLISHED: "منتشر شده",
      REJECTED: "رد شده",
      OUT_OF_STOCK: "ناموجود",
      EXPIRED: "منقضی شده",
    };
    return map[status] || status;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-success/20 text-success";
      case "PENDING_APPROVAL":
        return "bg-warning/20 text-warning";
      case "REJECTED":
        return "bg-danger/20 text-danger";
      case "OUT_OF_STOCK":
        return "bg-surface text-secondary";
      default:
        return "bg-surface text-secondary";
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedSupplier("ALL");
    setPricingStatus("ALL");
    setMinPrice("");
    setMaxPrice("");
    setDateFilter("ALL");
    setSortDate("NEWEST");
  };

  const filteredProducts = products
    .filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (p.name || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        const supplierName = (
          p.supplier?.brandName ||
          `${p.supplier?.firstName || ""} ${p.supplier?.lastName || ""}`
        ).toLowerCase();
        if (!name.includes(q) && !sku.includes(q) && !supplierName.includes(q)) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== "ALL") {
        const catId = String(p.categoryId || p.category?.id || "");
        if (catId !== selectedCategory) {
          return false;
        }
      }

      // 3. Supplier
      if (selectedSupplier !== "ALL") {
        const supId = String(p.supplierId || p.supplier?.id || "");
        if (supId !== selectedSupplier) {
          return false;
        }
      }

      // 4. Pricing status
      if (pricingStatus === "PRICED" && (!p.finalPrice || p.finalPrice <= 0)) {
        return false;
      }
      if (pricingStatus === "UNPRICED" && p.finalPrice && p.finalPrice > 0) {
        return false;
      }

      // 5. Price range
      const activePrice = p.finalPrice || p.supplierBasePrice || 0;
      if (minPrice && activePrice < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && activePrice > parseFloat(maxPrice)) {
        return false;
      }

      // 6. Date Filter
      if (dateFilter !== "ALL" && p.createdAt) {
        const created = new Date(p.createdAt).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === "TODAY" && now - created > oneDay) {
          return false;
        }
        if (dateFilter === "WEEK" && now - created > 7 * oneDay) {
          return false;
        }
        if (dateFilter === "MONTH" && now - created > 30 * oneDay) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortDate === "NEWEST" ? dateB - dateA : dateA - dateB;
    });

  const isAnyFilterActive =
    searchQuery ||
    selectedCategory !== "ALL" ||
    selectedSupplier !== "ALL" ||
    pricingStatus !== "ALL" ||
    minPrice ||
    maxPrice ||
    dateFilter !== "ALL" ||
    sortDate !== "NEWEST";

  return (
    <div className="p-8 space-y-6 animate-fade-in text-right">
      
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-subtle shadow-sm">
        
        <div>
          
          <h2 className="text-2xl font-bold text-primary">
            مدیریت محصولات و قیمت‌گذاری
          </h2>
          <p className="text-muted mt-1 text-sm">
            بررسی کالاها، قیمت‌گذاری سود، مدیریت کدهای SKU و افزودن مستقیم کالا
            توسط مدیر کل
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary-default text-inverse rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-lg shadow-primary-default/10"
        >
          
          <Plus className="w-5 h-5" /> افزودن محصول جدید
        </button>
      </div>

      <div className="flex border-b border-subtle gap-4">
        <button
          onClick={() => setSubTab("all")}
          className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 cursor-pointer ${subTab === "all" ? "border-primary-default text-primary-default" : "border-transparent text-muted hover:text-primary"}`}
        >
          لیست کل محصولات
        </button>
        <button
          onClick={() => setSubTab("explore")}
          className={`pb-3 text-sm font-bold transition-all px-2 border-b-2 cursor-pointer ${subTab === "explore" ? "border-primary-default text-primary-default" : "border-transparent text-muted hover:text-primary"}`}
        >
          مدیریت محتوای سفارشی اکسپلور ({exploreProducts.length})
        </button>
      </div>

      {subTab === "all" ? (
        loading ? (
          <div className="text-center p-12 text-muted bg-card rounded-2xl border border-subtle shadow-sm">
            در حال بارگذاری کالاها...
          </div>
        ) : (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-card p-5 rounded-2xl border border-subtle shadow-sm space-y-4">
            {/* Top Bar: Search input & main controls */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full lg:w-96">
                <input
                  type="text"
                  placeholder="جستجو نام محصول، کد SKU، تامین‌کننده..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-8 py-2.5 bg-surface border border-subtle rounded-xl text-sm font-medium text-primary focus:outline-none focus:border-primary-default transition-all"
                />
                <Search className="w-5 h-5 text-muted absolute right-3 top-3" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-3 text-muted hover:text-primary text-xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Main Selects Row */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Category Select */}
                <div className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-xl border border-subtle text-xs">
                  <Layers className="w-4 h-4 text-muted" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">همه دسته‌بندی‌ها</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Select */}
                <div className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-xl border border-subtle text-xs">
                  <Users className="w-4 h-4 text-muted" />
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">همه تامین‌کنندگان</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.brandName || `${s.firstName || ""} ${s.lastName || ""}` || s.username}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pricing Status Select */}
                <div className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-xl border border-subtle text-xs">
                  <DollarSign className="w-4 h-4 text-muted" />
                  <select
                    value={pricingStatus}
                    onChange={(e) => setPricingStatus(e.target.value as any)}
                    className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">وضعیت قیمت‌گذاری (همه)</option>
                    <option value="PRICED">تعیین قیمت شده</option>
                    <option value="UNPRICED">تعیین قیمت نشده</option>
                  </select>
                </div>

                {/* Toggle Advanced Filters Button */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    showAdvancedFilters || minPrice || maxPrice || dateFilter !== "ALL"
                      ? "bg-primary-default/10 text-primary-default border-primary-default/30"
                      : "bg-surface text-muted border-subtle hover:text-primary"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>فیلترهای پیشرفته</span>
                </button>

                {/* Reset Filters */}
                {isAnyFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold border border-rose-500/20 transition-all cursor-pointer"
                    title="پاک کردن همه فیلترها"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>پاکسازی</span>
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {/* Min Price */}
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">
                    حداقل قیمت (تومان)
                  </label>
                  <input
                    type="number"
                    placeholder="مثلا ۱,۰۰۰,۰۰۰"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-xs font-medium text-primary focus:outline-none focus:border-primary-default"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">
                    حداکثر قیمت (تومان)
                  </label>
                  <input
                    type="number"
                    placeholder="مثلا ۵۰,۰۰۰,۰۰۰"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-xs font-medium text-primary focus:outline-none focus:border-primary-default"
                  />
                </div>

                {/* Registration Date Filter */}
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">
                    تاریخ ثبت محصول
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-xs font-medium text-primary focus:outline-none focus:border-primary-default cursor-pointer"
                  >
                    <option value="ALL">تمام زمان‌ها</option>
                    <option value="TODAY">ثبت شده در امروز</option>
                    <option value="WEEK">ثبت شده در ۷ روز اخیر</option>
                    <option value="MONTH">ثبت شده در ۳۰ روز اخیر</option>
                  </select>
                </div>

                {/* Date Sorting */}
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">
                    مرتب‌سازی بر اساس تاریخ
                  </label>
                  <select
                    value={sortDate}
                    onChange={(e) => setSortDate(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-xs font-medium text-primary focus:outline-none focus:border-primary-default cursor-pointer"
                  >
                    <option value="NEWEST">جدیدترین محصولات</option>
                    <option value="OLDEST">قدیمی‌ترین محصولات</option>
                  </select>
                </div>
              </div>
            )}

            {/* Results Count & Active Badges Summary */}
            <div className="flex items-center justify-between text-xs font-medium text-muted pt-2 border-t border-subtle/50">
              <div>
                نمایش <span className="font-extrabold text-primary">{filteredProducts.length}</span> محصول از مجموع{" "}
                <span className="font-extrabold text-primary">{products.length}</span> کالا
              </div>
              {isAnyFilterActive && (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    فیلتر فعال است
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm min-w-[950px]">
                <thead className="bg-background border-b border-subtle text-muted font-bold">
                  <tr>
                    <th className="px-6 py-4">شناسه</th>
                    <th className="px-6 py-4">نام محصول</th>
                    <th className="px-6 py-4 text-xs font-mono">کد (SKU)</th>
                    <th className="px-6 py-4">تامین کننده</th>
                    <th className="px-6 py-4">قیمت پایه (تومان)</th>
                    <th className="px-6 py-4">قیمت نهایی فروش (تومان)</th>
                    <th className="px-6 py-4">وضعیت</th>
                    <th className="px-6 py-4">تغییر وضعیت سریع</th>
                    <th className="px-6 py-4 text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-background/50 transition-colors"
                  >
                    
                    <td className="px-6 py-4 font-mono text-muted">
                      <span>#{product.id}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      
                      <div className="flex items-center gap-3">
                        
                        {product.images?.[0]?.url ? (
                          <a href={product.images[0].url} target="_blank" rel="noopener noreferrer" title="مشاهده تصویر بزرگ" className="shrink-0">
                            <img
                              src={product.images[0].url}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl border border-subtle shadow-sm hover:scale-105 transition-transform bg-surface p-1.5"
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface rounded-xl border border-subtle flex items-center justify-center text-muted shadow-inner shrink-0">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          
                          <div>{product.name}</div>
                          <div className="text-xs text-muted font-normal mt-0.5">
                            موجودی: {product.inventory} عدد
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted bg-background/50 text-xs">
                      
                      {product.sku || (
                        <span className="text-muted">بدون کد</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      
                      {product.supplier?.brandName ||
                        `${product.supplier?.firstName || ""} ${product.supplier?.lastName || ""}` ||
                        "مدیر سیستم"}
                    </td>
                    <td className="px-6 py-4 font-bold text-secondary">
                      {product.supplierBasePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-primary-default">
                      
                      {product.finalPrice ? (
                        product.finalPrice.toLocaleString()
                      ) : (
                        <span className="text-muted font-normal text-xs">
                          تعیین نشده
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}
                      >
                        
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      
                      <select
                        className="border border-subtle rounded-lg px-2 py-1 text-xs text-secondary bg-card"
                        value={product.status}
                        onChange={(e) =>
                          handleChangeStatus(product.id, e.target.value)
                        }
                      >
                        
                        <option value="DRAFT">پیش‌نویس</option>
                        <option value="PENDING_APPROVAL">
                          در انتظار تایید
                        </option>
                        <option value="APPROVED">تایید شده</option>
                        <option value="REJECTED">رد شده</option>
                        <option value="PUBLISHED">منتشر شده</option>
                        <option value="OUT_OF_STOCK">ناموجود</option>
                        <option value="EXPIRED">منقضی شده</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      
                      <div className="flex gap-2 justify-center">
                        
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setPublishData({
                              marginType: product.marginType || "PERCENTAGE",
                              marginValue: product.marginValue || 10,
                              publishStartDate: product.publishStartDate
                                ? new Date(product.publishStartDate)
                                    .toISOString()
                                    .slice(0, 16)
                                : "",
                              publishEndDate: product.publishEndDate
                                ? new Date(product.publishEndDate)
                                    .toISOString()
                                    .slice(0, 16)
                                : "",
                              isPinned: product.isPinned || false,
                            });
                            setShowMarginModal(true);
                          }}
                          className="text-success bg-success/10 hover:bg-success/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          
                          <DollarSign className="w-3.5 h-3.5" /> تعیین سود
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-primary-default bg-primary-default/10 hover:bg-primary-default/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          
                          <Edit className="w-3.5 h-3.5" /> ویرایش
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-danger bg-danger/10 hover:bg-danger/20 p-1.5 rounded-lg transition-colors"
                          title="حذف کامل محصول"
                        >
                          
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted font-bold">
                      {isAnyFilterActive
                        ? "هیچ محصولی با مشخصات و فیلترهای انتخاب شده یافت نشد."
                        : "هیچ محصولی در سیستم یافت نشد."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )
      ) : (
        loadingExplore ? (
          <div className="text-center p-12 text-muted bg-card rounded-2xl border border-subtle shadow-sm">
            در حال بارگذاری محتوای اکسپلور...
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-subtle flex items-center justify-between text-xs font-semibold text-secondary">
              <span>فقط کالاهایی در این بخش نمایش داده می‌شوند که توسط مدیر کل تایید شده و قیمت نهایی برایشان تعیین شده است (approved=true).</span>
              <span className="bg-primary-default/10 text-primary-default px-2 py-1 rounded-lg">تعداد کالاهای فعال اکسپلور: {exploreProducts.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm min-w-[800px]">
                <thead className="bg-background border-b border-subtle text-muted font-bold">
                  <tr>
                    <th className="px-6 py-4">شناسه کالا</th>
                    <th className="px-6 py-4">تصویر / نام اصلی محصول</th>
                    <th className="px-6 py-4">عنوان اختصاصی اکسپلور</th>
                    <th className="px-6 py-4">توضیح اختصاصی اکسپلور</th>
                    <th className="px-6 py-4">وضعیت رسانه سفارشی</th>
                    <th className="px-6 py-4">وضعیت انتشار اکسپلور</th>
                    <th className="px-6 py-4 text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exploreProducts.map((p) => {
                    const exp = p.exploreContent;
                    return (
                      <tr key={p.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-muted text-xs">
                          #{p.id}
                        </td>
                        <td className="px-6 py-4 font-semibold text-primary">
                          <div className="flex items-center gap-3">
                            {p.images?.[0]?.url ? (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="w-10 h-10 object-cover rounded-lg border border-subtle"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg border border-subtle flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <span className="block font-bold">{p.name}</span>
                              <span className="text-[10px] text-muted block mt-0.5 font-bold text-primary-default">
                                قیمت نهایی: {p.finalPrice ? p.finalPrice.toLocaleString() + " تومان" : "نامشخص"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-secondary">
                          {exp?.customTitle ? (
                            <span className="font-semibold text-slate-800">{exp.customTitle}</span>
                          ) : (
                            <span className="text-muted italic text-xs">همان نام اصلی کالا</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                          {exp?.customDescription ? (
                            exp.customDescription
                          ) : (
                            <span className="text-muted italic">بدون توضیح سفارشی (پیش‌فرض)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {exp?.customImageUrl || exp?.customVideoUrl ? (
                            <div className="flex items-center gap-2">
                              {exp.customImageUrl && (
                                <img
                                  src={exp.customImageUrl}
                                  alt="تصویر سفارشی"
                                  className="w-10 h-10 object-cover rounded-lg border border-subtle shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {exp.customVideoUrl && (
                                <div className="relative w-10 h-10 bg-black rounded-lg overflow-hidden border border-subtle flex items-center justify-center">
                                  <video src={exp.customVideoUrl} className="w-full h-full object-cover opacity-80" />
                                  <span className="absolute text-[10px] bg-teal-600 text-white font-bold px-1 rounded">▶</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted italic">رسانه پیش‌فرض کالا</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {exp?.isPublished !== false ? (
                            <span className="bg-success/20 text-success px-2.5 py-1 rounded-full text-xs font-bold">نمایش داده می‌شود</span>
                          ) : (
                            <span className="bg-danger/10 text-danger px-2.5 py-1 rounded-full text-xs font-bold">عدم نمایش در اکسپلور</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedExploreProduct(p);
                              setExploreForm({
                                customTitle: exp?.customTitle || "",
                                customDescription: exp?.customDescription || "",
                                customImageUrl: exp?.customImageUrl || "",
                                customVideoUrl: exp?.customVideoUrl || "",
                                isPublished: exp?.isPublished !== false,
                              });
                              setShowExploreModal(true);
                            }}
                            className="bg-primary-default/10 hover:bg-primary-hover/10 text-primary-default px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            سفارشی‌سازی محتوا
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {exploreProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted">
                        هیچ کالای تایید شده‌ای جهت قرارگیری در اکسپلور یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
      {/* Pricing and margin setting modal */}
      {showMarginModal && selectedProduct && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="p-5 border-b border-subtle flex justify-between items-center sticky top-0 bg-card">
              
              <h3 className="font-bold text-lg text-primary">
                تعیین سود و انتشار
              </h3>
              <button
                onClick={() => setShowMarginModal(false)}
                className="text-muted hover:text-muted bg-surface hover:bg-surface p-2 rounded-full transition-colors"
              >
                
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              
              <div className="bg-background p-4 rounded-xl border border-subtle mb-4">
                
                <p className="text-sm font-semibold text-primary">
                  {selectedProduct.name}
                </p>
                <p className="text-xs text-muted mt-1">
                  قیمت پایه تامین‌کننده:
                  {selectedProduct.supplierBasePrice.toLocaleString()} تومان
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    روش قیمت‌گذاری
                  </label>
                  <select
                    value={publishData.marginType}
                    onChange={(e) =>
                      setPublishData({
                        ...publishData,
                        marginType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                  >
                    
                    <option value="PERCENTAGE">درصد افزایش (٪)</option>
                    <option value="FIXED">افزایش مبلغ ثابت (تومان)</option>
                  </select>
                </div>
                <div>
                  
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    
                    {publishData.marginType === "PERCENTAGE"
                      ? "درصد سود"
                      : "مبلغ سود"}
                  </label>
                  <input
                    type="number"
                    value={publishData.marginValue}
                    onChange={(e) =>
                      setPublishData({
                        ...publishData,
                        marginValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    زمان شروع انتشار (اختیاری)
                  </label>
                  <input
                    type="datetime-local"
                    value={publishData.publishStartDate}
                    onChange={(e) =>
                      setPublishData({
                        ...publishData,
                        publishStartDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                    dir="ltr"
                  />
                </div>
                <div>
                  
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    زمان پایان انتشار (اختیاری)
                  </label>
                  <input
                    type="datetime-local"
                    value={publishData.publishEndDate}
                    onChange={(e) =>
                      setPublishData({
                        ...publishData,
                        publishEndDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                
                <input
                  type="checkbox"
                  id="pinProduct"
                  checked={publishData.isPinned}
                  onChange={(e) =>
                    setPublishData({
                      ...publishData,
                      isPinned: e.target.checked,
                    })
                  }
                  className="rounded text-primary-default focus:ring-primary-default"
                />
                <label
                  htmlFor="pinProduct"
                  className="text-sm font-semibold text-secondary"
                >
                  پین کردن محصول (حداکثر 10 کالا)
                </label>
              </div>
              <div className="p-4 bg-success/10 border border-emerald-100 rounded-xl mt-4">
                
                <p className="text-sm text-emerald-800 font-semibold text-center">
                  
                  قیمت نهایی فروش:
                  {(publishData.marginType === "PERCENTAGE"
                    ? selectedProduct.supplierBasePrice *
                      (1 + publishData.marginValue / 100)
                    : selectedProduct.supplierBasePrice +
                      publishData.marginValue
                  ).toLocaleString()}
                  تومان
                </p>
              </div>
              <div className="pt-4 flex gap-3">
                
                <button
                  onClick={() => setShowMarginModal(false)}
                  className="flex-1 px-4 py-3 bg-surface text-secondary rounded-xl font-medium text-sm hover:bg-surface transition-colors cursor-pointer"
                >
                  
                  انصراف
                </button>
                <button
                  onClick={handlePublish}
                  className="flex-1 px-4 py-3 bg-primary-default text-inverse rounded-xl font-medium text-sm hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  
                  ذخیره و انتشار محصول
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explore customization modal */}
      {showExploreModal && selectedExploreProduct && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-subtle flex justify-between items-center sticky top-0 bg-card">
              <h3 className="font-bold text-lg text-primary">
                سفارشی‌سازی نمایش در اکسپلور کالا
              </h3>
              <button
                onClick={() => setShowExploreModal(false)}
                className="text-muted hover:text-muted bg-surface hover:bg-surface p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleExploreSubmit} className="p-6 space-y-4 text-right">
              <div className="bg-background p-4 rounded-xl border border-subtle mb-4">
                <p className="text-sm font-semibold text-primary">
                  نام اصلی محصول: {selectedExploreProduct.name}
                </p>
                <p className="text-xs text-muted mt-1">
                  دسته‌بندی: {selectedExploreProduct.category?.name || "ندارد"} | قیمت نهایی: {selectedExploreProduct.finalPrice?.toLocaleString()} تومان
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  عنوان اختصاصی در اکسپلور (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="اگر خالی بماند، از نام اصلی کالا استفاده می‌شود"
                  value={exploreForm.customTitle}
                  onChange={(e) =>
                    setExploreForm({
                      ...exploreForm,
                      customTitle: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  توضیح اختصاصی در اکسپلور (اختیاری)
                </label>
                <textarea
                  rows={3}
                  placeholder="توضیح کوتاه و جذاب برای بخش اکسپلور"
                  value={exploreForm.customDescription}
                  onChange={(e) =>
                    setExploreForm({
                      ...exploreForm,
                      customDescription: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  تصویر اختصاصی اکسپلور (اختیاری)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={exploreForm.customImageUrl}
                    onChange={(e) =>
                      setExploreForm({
                        ...exploreForm,
                        customImageUrl: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default font-semibold font-mono"
                    dir="ltr"
                  />
                  <label className="cursor-pointer bg-surface hover:bg-surface border border-subtle text-muted px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap">
                    <span>انتخاب فایل</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            toast("حجم تصویر نباید بیشتر از 2 مگابایت باشد.", "error");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setExploreForm({
                              ...exploreForm,
                              customImageUrl: reader.result as string,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {exploreForm.customImageUrl && (
                  <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-subtle bg-surface shadow-inner">
                    <img src={exploreForm.customImageUrl} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setExploreForm({ ...exploreForm, customImageUrl: "" })}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700"
                      title="حذف تصویر"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  ویدیو اختصاصی اکسپلور (اختیاری - MP4)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/video.mp4"
                    value={exploreForm.customVideoUrl}
                    onChange={(e) =>
                      setExploreForm({
                        ...exploreForm,
                        customVideoUrl: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default font-semibold font-mono"
                    dir="ltr"
                  />
                  <label className="cursor-pointer bg-surface hover:bg-surface border border-subtle text-muted px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap">
                    <span>انتخاب فایل</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast("حجم ویدیو نباید بیشتر از 10 مگابایت باشد.", "error");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setExploreForm({
                              ...exploreForm,
                              customVideoUrl: reader.result as string,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {exploreForm.customVideoUrl && (
                  <div className="mt-2 relative w-36 h-24 rounded-xl overflow-hidden border border-subtle bg-black shadow-inner">
                    <video src={exploreForm.customVideoUrl} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setExploreForm({ ...exploreForm, customVideoUrl: "" })}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700 z-10"
                      title="حذف ویدیو"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={exploreForm.isPublished}
                  onChange={(e) =>
                    setExploreForm({
                      ...exploreForm,
                      isPublished: e.target.checked,
                    })
                  }
                  className="rounded text-primary-default focus:ring-primary-default"
                />
                <label
                  htmlFor="isPublished"
                  className="text-sm font-semibold text-secondary cursor-pointer"
                >
                  کالا در اکسپلور منتشر و نمایش داده شود
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExploreModal(false)}
                  className="flex-1 px-4 py-3 bg-surface text-secondary rounded-xl font-medium text-sm hover:bg-surface transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submittingExplore}
                  className="flex-1 px-4 py-3 bg-primary-default text-inverse rounded-xl font-medium text-sm hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1 font-bold"
                >
                  {submittingExplore ? "در حال ذخیره..." : "ذخیره سفارشی‌سازی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Add or Edit product modal (Form Modal) */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-subtle flex justify-between items-center sticky top-0 bg-card">
              
              <h3 className="font-bold text-lg text-primary">
                {isEditing ? "ویرایش کالا" : "افزودن مستقیم کالا"}
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="text-muted hover:text-muted bg-surface hover:bg-surface p-2 rounded-full transition-colors"
              >
                
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleSaveProduct}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              
              {formError && (
                <div className="bg-danger/10 border border-rose-100 text-danger p-4 rounded-xl flex items-start gap-2.5 text-sm">
                  
                  <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    نام محصول *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    placeholder="مثال: گوشی آیفون ۱۵ پرو"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                  />
                </div>
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    دسته‌بندی محصول *
                  </label>
                  <select
                    required
                    value={productForm.categoryId}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        categoryId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                  >
                    
                    <option value="">انتخاب دسته‌بندی...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    تامین کننده (اختیاری)
                  </label>
                  <select
                    value={productForm.supplierId}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        supplierId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                  >
                    
                    <option value="">
                      مدیر سیستم (تامین‌کننده پیش‌فرض)
                    </option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.brandName ||
                          `${sup.firstName || ""} ${sup.lastName || ""}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    برند محصول
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) =>
                      setProductForm({ ...productForm, brand: e.target.value })
                    }
                    placeholder="مثال: Apple"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    قیمت پایه تامین‌کننده (تومان) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.supplierBasePrice}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        supplierBasePrice: e.target.value,
                      })
                    }
                    placeholder="قیمت تسویه با تامین‌کننده"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                    dir="ltr"
                  />
                </div>
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    قیمت نهایی فروش (تومان) (اختیاری)
                  </label>
                  <input
                    type="number"
                    value={productForm.finalPrice}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        finalPrice: e.target.value,
                      })
                    }
                    placeholder="خالی بگذارید تا بعداً تعیین سود کنید"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                    dir="ltr"
                  />
                </div>
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    موجودی انبار *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.inventory}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        inventory: e.target.value,
                      })
                    }
                    placeholder="تعداد موجودی"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    کد محصول (SKU) (مدیر کل)
                  </label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({ ...productForm, sku: e.target.value })
                    }
                    placeholder="مثال: APP-IPH15-PRO"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    تصویر کالا
                  </label>
                  <div className="flex gap-2">
                    
                    <input
                      type="text"
                      value={productForm.imageUrl}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/image.png"
                      className="flex-1 px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                      dir="ltr"
                    />
                    <label className="cursor-pointer bg-surface hover:bg-surface border border-subtle text-muted px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap">
                      
                      <span>انتخاب فایل</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast("حجم تصویر نباید بیشتر از 2 مگابایت باشد.", "error");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProductForm({
                                ...productForm,
                                imageUrl: reader.result as string,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {productForm.imageUrl && (
                    <div className="mt-3 relative w-32 h-32 rounded-xl border border-subtle overflow-hidden bg-background flex items-center justify-center group shadow-sm">
                      <img
                        src={productForm.imageUrl}
                        alt="پیش‌نمایش تصویر کالا"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, imageUrl: "" })}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs cursor-pointer"
                      >
                        حذف تصویر
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  معرفی کوتاه کالا
                </label>
                <textarea
                  value={productForm.shortDescription}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      shortDescription: e.target.value,
                    })
                  }
                  placeholder="یک خلاصه کوتاه چند کلمه‌ای..."
                  className="w-full px-4 py-2 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default h-16 resize-none"
                />
              </div>
              <div>
                
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  توضیحات و مشخصات کامل فنی
                </label>
                <textarea
                  value={productForm.longDescription}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      longDescription: e.target.value,
                    })
                  }
                  placeholder="مشخصات کامل کالا را در این قسمت وارد نمایید..."
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default h-28 resize-none"
                />
              </div>
              {/* Dynamic Technical Specs */}
              <div className="border-t border-subtle pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-secondary">
                    مشخصات فنی بصورت جدول‌طور (ویژگی / مقدار)
                  </label>
                  <button
                    type="button"
                    onClick={() => setTechSpecs([...techSpecs, { key: "", value: "" }])}
                    className="px-3 py-1 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن ویژگی
                  </button>
                </div>

                <div className="space-y-2">
                  {techSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="عنوان ویژگی (مثلاً: حافظه RAM)"
                        value={spec.key}
                        onChange={(e) => {
                          const updated = [...techSpecs];
                          updated[idx].key = e.target.value;
                          setTechSpecs(updated);
                        }}
                        className="flex-1 px-3 py-2.5 bg-background border border-subtle rounded-xl text-xs outline-none focus:border-primary-default"
                      />
                      <input
                        type="text"
                        placeholder="مقدار (مثلاً: 16 گیگابایت DDR5)"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...techSpecs];
                          updated[idx].value = e.target.value;
                          setTechSpecs(updated);
                        }}
                        className="flex-1 px-3 py-2.5 bg-background border border-subtle rounded-xl text-xs outline-none focus:border-primary-default"
                      />
                      {techSpecs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTechSpecs(techSpecs.filter((_, i) => i !== idx))}
                          className="p-2 text-danger hover:bg-danger/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-subtle flex gap-3 sticky bottom-0 bg-card">
                
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 px-4 py-3 bg-surface text-secondary rounded-xl font-medium text-sm hover:bg-surface transition-colors cursor-pointer"
                >
                  
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary-default text-inverse rounded-xl font-medium text-sm hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  
                  {isEditing ? "ذخیره تغییرات" : "ثبت و انتشار فوری کالا"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
