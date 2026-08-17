import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { getValidProductImageUrl } from "../../utils/productUtils";
import DigikalaProductModal from "../DigikalaProductModal";
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
  Eye,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Upload
} from "lucide-react";
const DEFAULT_CATEGORIES = [
  { id: 1, name: "موبایل و تبلت", isActive: true, sortOrder: 1 },
  { id: 2, name: "لپ‌تاپ و کامپیوتر", isActive: true, sortOrder: 2 },
  { id: 3, name: "کالای دیجیتال و جانبی", isActive: true, sortOrder: 3 },
  { id: 4, name: "خانه و آشپزخانه", isActive: true, sortOrder: 4 },
  { id: 5, name: "لوازم خانگی برقی", isActive: true, sortOrder: 5 },
  { id: 6, name: "آرایشی و بهداشتی", isActive: true, sortOrder: 6 },
  { id: 7, name: "مد و پوشاک", isActive: true, sortOrder: 7 },
  { id: 8, name: "طلا و زیورآلات", isActive: true, sortOrder: 8 },
  { id: 9, name: "خودرو و ابزارآلات", isActive: true, sortOrder: 9 },
  { id: 10, name: "سلامت و تجهیزات پزشکی", isActive: true, sortOrder: 10 },
  { id: 11, name: "کتاب، هنر و لوازم تحریر", isActive: true, sortOrder: 11 },
  { id: 12, name: "ورزش و سفر", isActive: true, sortOrder: 12 },
  { id: 13, name: "اسباب بازی، کودک و نوزاد", isActive: true, sortOrder: 13 },
  { id: 14, name: "محصولات بومی و محلی", isActive: true, sortOrder: 14 },
  { id: 15, name: "پت شاپ و حیوانات خانگی", isActive: true, sortOrder: 15 },
  { id: 16, name: "عمومی و متفرقه", isActive: true, sortOrder: 16 },
];

export default function ProductsList() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: Table vs Digikala Cards
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [pricingStatus, setPricingStatus] = useState<"ALL" | "PRICED" | "UNPRICED">("ALL");
  const [approvalStatus, setApprovalStatus] = useState<"ALL" | "PENDING">("ALL");
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
      videoUrl: "",
      discount: "0",
    });
  const [techSpecs, setTechSpecs] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
  const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [modalTab, setModalTab] = useState<"basic" | "pricing" | "variants" | "media">("basic");
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  const generateMatrix = (attrs: any[]) => {
    if (attrs.length === 0) {
      setVariants([]);
      return;
    }
    const cartesian = (arrays: any[][]) => {
      return arrays.reduce(
        (a, b) =>
          a
            .map((x) => b.map((y) => x.concat([y])))
            .reduce((c, d) => c.concat(d), []),
        [[]],
      );
    };
    const validAttrs = attrs.filter((a) => a.values.length > 0);
    if (validAttrs.length === 0) return;
    const valuesArrays = validAttrs.map((a) =>
      a.values.map((v: any) => ({ [a.name]: v })),
    );
    const combinations = cartesian(valuesArrays).map((combo) => {
      const attrObj = Object.assign({}, ...combo);
      return {
        attributes: attrObj,
        supplierBasePrice: productForm.supplierBasePrice || "",
        stock: "10",
        sku: "",
      };
    });
    setVariants(combinations);
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    
    let updatedStock = productForm.inventory;
    if (field === "stock") {
      const sum = newVariants.reduce((total, v) => total + (parseInt(v.stock.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))) || 0), 0);
      updatedStock = sum.toString();
    }
    
    setProductForm({ ...productForm, inventory: updatedStock });
    setVariants(newVariants);
  };
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
      let categoriesLoaded = false;
      if (catRes.ok && catRes.headers.get("content-type")?.includes("application/json")) {
        const cats = await catRes.json();
        const list = Array.isArray(cats) ? cats : (cats?.categories || []);
        if (list.length > 0) {
          setCategories(list);
          categoriesLoaded = true;
        }
      }

      if (!categoriesLoaded) {
        // Fallback to public categories
        try {
          const pubRes = await fetch("/api/public/categories");
          if (pubRes.ok) {
            const data = await pubRes.json();
            const list = Array.isArray(data) ? data : (data?.categories || []);
            if (list.length > 0) {
              setCategories(list);
              categoriesLoaded = true;
            }
          }
        } catch (err) {
          console.error("Error fetching fallback categories:", err);
        }
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

    const parseNumber = (val: any) => {
      if (val === undefined || val === null || val === "") return 0;
      const eng = val.toString()
        .replace(/[,،٬\s]/g, "")
        .replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 0x06f0).toString())
        .replace(/[٠-٩]/g, (d: string) => (d.charCodeAt(0) - 0x0660).toString());
      const parsed = parseFloat(eng);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseIntNumber = (val: any) => {
      if (val === undefined || val === null || val === "") return 0;
      const eng = val.toString()
        .replace(/[,،٬\s]/g, "")
        .replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 0x06f0).toString())
        .replace(/[٠-٩]/g, (d: string) => (d.charCodeAt(0) - 0x0660).toString());
      const parsed = parseInt(eng, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    try {
      const token = localStorage.getItem("token") || "";
      const url = isEditing
        ? `/api/admin/products/${productForm.id}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        name: productForm.name,
        categoryId: parseIntNumber(productForm.categoryId),
        supplierId: productForm.supplierId ? parseIntNumber(productForm.supplierId) : undefined,
        shortDescription: productForm.shortDescription || null,
        longDescription: productForm.longDescription || null,
        technicalSpecs: techSpecs.filter((s) => s.key.trim() && s.value.trim()),
        supplierBasePrice: parseNumber(productForm.supplierBasePrice),
        finalPrice: productForm.finalPrice ? parseNumber(productForm.finalPrice) : null,
        sku: productForm.sku || null,
        brand: productForm.brand || null,
        inventory: parseIntNumber(productForm.inventory) || 0,
        imageUrl: productForm.imageUrl || null,
        mainImage: productForm.imageUrl || null,
        images: images,
        variants: variants.map(v => ({
          attributes: v.attributes,
          supplierBasePrice: parseNumber(String(v.supplierBasePrice)),
          stock: parseIntNumber(String(v.stock)) || 0,
          sku: v.sku || null,
          imageUrl: v.imageUrl || null
        })),
        videoUrl: productForm.videoUrl || null,
        discount: parseNumber(productForm.discount),
      };

      const res = await fetch(url, { credentials: "include",
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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
    setModalTab("basic");
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
      videoUrl: "",
      discount: "0",
    });
    setTechSpecs([{ key: "", value: "" }]);
    setAttributes([]);
    setVariants([]);
    setImages([]);
    setShowAddEditModal(true);
  };
  const openEditModal = (product: any) => {
    setIsEditing(true);
    setFormError("");
    setModalTab("basic");
    const randomSkuNum = Math.floor(100000 + Math.random() * 900000);
    
    let parsedSpecs = [{ key: "", value: "" }];
    if (product.technicalSpecs) {
      try {
        const parsed = typeof product.technicalSpecs === "string" ? JSON.parse(product.technicalSpecs) : product.technicalSpecs;
        if (Array.isArray(parsed)) {
          parsedSpecs = parsed.length > 0 ? parsed : [{ key: "", value: "" }];
        }
      } catch (e) {
        // ignore
      }
    }

    const parsedImages = Array.isArray(product.images)
      ? product.images.map((img: any) => typeof img === 'string' ? img : (img.url || ''))
      : [];

    const parsedVariants = Array.isArray(product.variants)
      ? product.variants.map((v: any) => {
          let attrs = v.attributes || {};
          if (typeof v.attributes === 'string') {
            try {
              attrs = JSON.parse(v.attributes);
            } catch {
              attrs = {};
            }
          }
          return {
            ...v,
            attributes: attrs
          };
        })
      : [];

    // Reconstruct attributes
    const attribsMap: Record<string, Set<string>> = {};
    parsedVariants.forEach((v: any) => {
      const attrs = v.attributes;
      if (attrs && typeof attrs === 'object') {
        Object.entries(attrs).forEach(([key, val]) => {
          if (!attribsMap[key]) {
            attribsMap[key] = new Set<string>();
          }
          attribsMap[key].add(String(val));
        });
      }
    });
    const reconstructedAttributes = Object.entries(attribsMap).map(([name, set]) => ({
      name,
      values: Array.from(set)
    }));

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
      imageUrl: (product.images && product.images[0]) ? (product.images[0].url || "") : "",
      videoUrl: product.exploreContent?.customVideoUrl || "",
      discount: product.discount?.toString() || "0",
    });

    setTechSpecs(parsedSpecs);
    setAttributes(reconstructedAttributes);
    setVariants(parsedVariants);
    setImages(parsedImages);
    setShowAddEditModal(true);
  };
  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "پیش‌نویس",
      PENDING_APPROVAL: "در انتظار تایید",
      SUSPENDED: "در انتظار تایید",
      ACTIVE: "فعال",
      APPROVED: "تایید شده",
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
      case "ACTIVE":
      case "APPROVED":
        return "bg-emerald-600 text-white shadow-xs font-black";
      case "PENDING_APPROVAL":
      case "SUSPENDED":
        return "bg-amber-500 text-white shadow-xs font-black";
      case "REJECTED":
        return "bg-rose-600 text-white shadow-xs font-bold";
      case "OUT_OF_STOCK":
        return "bg-slate-600 text-white shadow-xs font-bold";
      default:
        return "bg-slate-500 text-white shadow-xs font-medium";
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedSupplier("ALL");
    setPricingStatus("ALL");
    setApprovalStatus("ALL");
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
                    <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      همه دسته‌بندی‌ها
                    </option>
                    {categories.map((c, idx) => {
                      const name = c.name && c.name.trim() ? c.name : (DEFAULT_CATEGORIES[idx]?.name || `دسته‌بندی ${c.id}`);
                      return (
                        <option key={c.id} value={String(c.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {name}
                        </option>
                      );
                    })}
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
                <div className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-xl border border-subtle text-xs">
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value as any)}
                    className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">وضعیت تایید (همه)</option>
                    <option value="PENDING">در انتظار تایید جدید</option>
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

            {/* Results Count, Category Chips, and View Mode Switcher */}
            <div className="pt-3 border-t border-subtle/50 space-y-3">
              {/* Category Quick Chips Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-xs font-bold text-muted shrink-0 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary-default" /> دسته‌بندی‌ها:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === "ALL"
                      ? "bg-primary-default text-inverse shadow-sm"
                      : "bg-surface hover:bg-surface/80 text-secondary border border-subtle"
                  }`}
                >
                  <span>همه</span>
                  <span className="bg-black/10 dark:bg-white/15 px-1.5 py-0.5 rounded-full text-[10px]">
                    {products.length}
                  </span>
                </button>
                {categories.map((c, idx) => {
                  const name = c.name && c.name.trim() ? c.name : (DEFAULT_CATEGORIES[idx]?.name || `دسته‌بندی ${c.id}`);
                  const catCount = products.filter(
                    (p) => String(p.categoryId) === String(c.id) || p.category?.name === c.name || p.category?.name === name
                  ).length;
                  const isSelected = String(selectedCategory) === String(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(String(c.id))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-surface hover:bg-surface/80 text-secondary border border-subtle"
                      }`}
                    >
                      <span>{name}</span>
                      <span className="bg-black/10 dark:bg-white/15 px-1.5 py-0.5 rounded-full text-[10px]">
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* View Switcher and Count */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span>
                    نمایش <strong className="text-primary font-black">{filteredProducts.length}</strong> محصول از مجموع{" "}
                    <strong className="text-primary font-black">{products.length}</strong> کالا
                  </span>
                  {isAnyFilterActive && (
                    <span className="text-white font-bold bg-emerald-600 px-2.5 py-0.5 rounded-full shadow-xs text-[11px]">
                      فیلتر فعال است
                    </span>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-subtle">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "table"
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                    <span>جدول مدیریتی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>نمایش کارتی</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW MODE: TABLE */}
          {viewMode === "table" ? (
            <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm min-w-[1050px]">
                  <thead className="bg-background/90 border-b border-subtle text-muted font-bold text-xs uppercase">
                    <tr>
                      <th className="px-4 py-4 w-16 text-center">شناسه</th>
                      <th className="px-6 py-4 min-w-[280px]">تصویر و نام محصول</th>
                      <th className="px-4 py-4 w-28 text-center">کد اختصاصی (SKU)</th>
                      <th className="px-5 py-4 w-36">شناسه تامین‌کننده</th>
                      <th className="px-5 py-4 w-36 text-left">قیمت پایه تامین</th>
                      <th className="px-5 py-4 w-40 text-left">قیمت نهایی فروش</th>
                      <th className="px-4 py-4 w-36 text-center">وضعیت انتشار</th>
                      <th className="px-4 py-4 w-36 text-center">تغییر وضعیت</th>
                      <th className="px-6 py-4 w-60 text-center">عملیات مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle/50">
                    {filteredProducts.map((product) => {
                      const img = getValidProductImageUrl(product);
                      const catName = categories.find((c) => String(c.id) === String(product.categoryId))?.name || product.category?.name;
                      const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-surface/40 transition-colors group"
                        >
                          <td className="px-4 py-4 font-mono text-center font-bold text-muted text-xs">
                            #{product.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0 group/img">
                                <img
                                  src={img}
                                  className="w-16 h-16 object-cover rounded-xl border border-subtle shadow-xs bg-surface p-1 group-hover/img:scale-105 transition-transform"
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e: any) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewProduct(product)}
                                  className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold rounded-xl flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                                  title="پیش‌نمایش محصول (زوپیتو)"
                                >
                                  <Eye className="w-4 h-4 mb-0.5" />
                                  <span>نمایش محصول</span>
                                </button>
                              </div>
                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => setPreviewProduct(product)}
                                  className="font-bold text-primary hover:text-primary-default transition-colors text-sm block text-right truncate cursor-pointer"
                                  title="مشاهده صفحه محصول"
                                >
                                  {product.name}
                                </button>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                  {catName ? (
                                    <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold px-2.5 py-0.5 rounded-md text-[11px] border border-indigo-300 dark:border-indigo-800 shadow-2xs">
                                      {catName}
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-md text-[11px] border border-slate-300 dark:border-slate-700">
                                      دسته‌بندی عمومی
                                    </span>
                                  )}
                                  <span className="text-muted font-normal text-[11px]">
                                    موجودی: <strong className="text-primary font-bold">{product.inventory || product.stock || 0} عدد</strong>
                                  </span>
                                  {hasVariants && (
                                    <span className="bg-violet-50 dark:bg-violet-950/80 text-violet-900 dark:text-violet-200 font-bold px-2 py-0.5 rounded-md text-[10px] border border-violet-200 dark:border-violet-800">
                                      {product.variants.length} تنوع
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {product.sku ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 select-all shadow-2xs">
                                <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{product.sku}</span>
                              </span>
                            ) : (
                              <span className="text-muted text-xs">بدون کد</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-mono font-bold text-xs bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 px-2.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800/80">
                                تامین‌کننده #{product.supplierId || product.supplier?.id || "001"}
                              </span>
                              <span className="text-[11px] text-muted truncate max-w-[120px]">
                                {product.supplier?.brandName ||
                                  `${product.supplier?.firstName || ""} ${product.supplier?.lastName || ""}` ||
                                  "تامین‌کننده سیستم"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-left font-mono font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {Number(product.supplierBasePrice || 0).toLocaleString()} <span className="text-[11px] font-normal text-muted">تومان</span>
                          </td>
                          <td className="px-5 py-4 text-left whitespace-nowrap">
                            {product.finalPrice ? (
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                {Number(product.finalPrice).toLocaleString()}{" "}
                                <span className="text-[11px] font-normal text-muted">تومان</span>
                              </span>
                            ) : (
                              <span className="text-muted font-normal text-xs bg-surface px-2 py-1 rounded-lg border border-subtle">
                                تعیین نشده
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-black select-none ${getStatusColor(product.status)}`}
                            >
                              {getStatusLabel(product.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <select
                              className="border border-subtle rounded-xl px-2.5 py-1.5 text-xs font-bold text-primary bg-card outline-none cursor-pointer focus:ring-2 focus:ring-primary-default"
                              value={product.status}
                              onChange={(e) =>
                                handleChangeStatus(product.id, e.target.value)
                              }
                            >
                              <option value="DRAFT">پیش‌نویس</option>
                              <option value="PENDING_APPROVAL">در انتظار تایید</option>
                              <option value="APPROVED">تایید شده</option>
                              <option value="PUBLISHED">منتشر شده</option>
                              <option value="REJECTED">رد شده</option>
                              <option value="OUT_OF_STOCK">ناموجود</option>
                              <option value="EXPIRED">منقضی شده</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <div className="flex gap-1.5 justify-center items-center">
                              <button
                                type="button"
                                onClick={() => setPreviewProduct(product)}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="پیش‌نمایش محصول (زوپیتو)"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setPublishData({
                                    marginType: product.marginType || "PERCENTAGE",
                                    marginValue: product.marginValue || 10,
                                    publishStartDate: product.publishStartDate
                                      ? new Date(product.publishStartDate).toISOString().slice(0, 16)
                                      : "",
                                    publishEndDate: product.publishEndDate
                                      ? new Date(product.publishEndDate).toISOString().slice(0, 16)
                                      : "",
                                    isPinned: product.isPinned || false,
                                  });
                                  setShowMarginModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>تعیین سود</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>ویرایش</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 p-2 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                                title="حذف کامل محصول"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-muted font-bold">
                          {isAnyFilterActive
                            ? "هیچ محصولی با مشخصات و فیلترهای انتخاب شده یافت نشد."
                            : "هیچ محصولی در سیستم ثبت نشده است."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW MODE: DIGIKALA GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const img = getValidProductImageUrl(product);
                const catName = categories.find((c) => String(c.id) === String(product.categoryId))?.name || product.category?.name;
                const variantsList = Array.isArray(product.variants) ? product.variants : [];

                return (
                  <div
                    key={product.id}
                    className="bg-card rounded-2xl border border-subtle hover:border-red-500/50 hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Image and Badges */}
                      <div className="relative aspect-square bg-surface p-4 flex items-center justify-center overflow-hidden border-b border-subtle">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e: any) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-start">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm ${getStatusColor(product.status)}`}
                          >
                            {getStatusLabel(product.status)}
                          </span>
                          {catName ? (
                            <span className="bg-indigo-900/90 text-white backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/30 shadow-xs">
                              {catName}
                            </span>
                          ) : (
                            <span className="bg-slate-900/90 text-white backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md">
                              دسته‌بندی عمومی
                            </span>
                          )}
                        </div>

                        {/* SKU Badge Top Left */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700 shadow-xs flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {product.sku || `#${product.id}`}
                          </span>
                        </div>

                        {/* Quick View Hover Overlay */}
                        <button
                          type="button"
                          onClick={() => setPreviewProduct(product)}
                          className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer font-bold text-xs"
                        >
                          <Eye className="w-6 h-6 text-white" />
                          <span>نمایش کامل محصول (زوپیتو)</span>
                        </button>
                      </div>

                      {/* Card Details */}
                      <div className="p-4 space-y-3">
                        {/* Supplier Info */}
                        <div className="flex items-center justify-between text-[11px] text-muted">
                          <span className="font-mono bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded font-bold border border-sky-200 dark:border-sky-800/80">
                            تامین‌کننده #{product.supplierId || product.supplier?.id || "001"}
                          </span>
                          <span>
                            موجودی: <strong className="text-primary">{product.inventory || product.stock || 0} عدد</strong>
                          </span>
                        </div>

                        {/* Product Title */}
                        <h3
                          onClick={() => setPreviewProduct(product)}
                          className="font-bold text-primary hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm line-clamp-2 leading-snug cursor-pointer h-10"
                        >
                          {product.name}
                        </h3>

                        {/* Variant Swatches (If Available) */}
                        {variantsList.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
                            <span className="text-[10px] font-bold text-muted shrink-0">
                              {variantsList.length} تنوع:
                            </span>
                            {variantsList.slice(0, 4).map((v: any, vIdx: number) => {
                              const vImg = v.imageUrl || v.image;
                              return vImg ? (
                                <div key={vIdx} className="w-6 h-6 rounded-md border border-subtle overflow-hidden shrink-0">
                                  <img src={vImg} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <span
                                  key={vIdx}
                                  className="w-4 h-4 rounded-full border border-subtle bg-slate-400 shrink-0"
                                  title={typeof v.attributes === "object" ? JSON.stringify(v.attributes) : String(v.attributes)}
                                />
                              );
                            })}
                            {variantsList.length > 4 && (
                              <span className="text-[10px] text-muted font-bold">
                                +{variantsList.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price Block */}
                        <div className="pt-2 border-t border-subtle/50 space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted">قیمت پایه تامین:</span>
                            <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                              {Number(product.supplierBasePrice || 0).toLocaleString()} ت
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-xs font-bold text-primary">قیمت فروش:</span>
                            {product.finalPrice ? (
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {Number(product.finalPrice).toLocaleString()} تومان
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                                سود تعیین نشده
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-surface/50 border-t border-subtle flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewProduct(product)}
                        className="flex-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>نمایش محصول</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);
                          setPublishData({
                            marginType: product.marginType || "PERCENTAGE",
                            marginValue: product.marginValue || 10,
                            publishStartDate: product.publishStartDate
                              ? new Date(product.publishStartDate).toISOString().slice(0, 16)
                              : "",
                            publishEndDate: product.publishEndDate
                              ? new Date(product.publishEndDate).toISOString().slice(0, 16)
                              : "",
                            isPinned: product.isPinned || false,
                          });
                          setShowMarginModal(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="تعیین سود"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="ویرایش محصول"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-600 border border-rose-200 dark:border-rose-800 p-2 rounded-xl text-xs transition-all cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-16 bg-card rounded-2xl border border-subtle text-muted font-bold">
                  {isAnyFilterActive
                    ? "هیچ محصولی با مشخصات و فیلترهای انتخاب شده یافت نشد."
                    : "هیچ محصولی در سیستم ثبت نشده است."}
                </div>
              )}
            </div>
          )}
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
                            <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">نمایش داده می‌شود</span>
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
              
              <div className="bg-background p-4 rounded-xl border border-subtle mb-4 space-y-1.5">
                <p className="text-sm font-bold text-primary">
                  {selectedProduct.name}
                </p>
                <p className="text-xs text-muted flex items-center justify-between">
                  <span>قیمت پایه تامین‌کننده:</span>
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                    {selectedProduct.supplierBasePrice.toLocaleString()} تومان
                  </span>
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
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mt-4">
                <p className="text-sm font-bold text-center flex items-center justify-center gap-2">
                  <span className="text-secondary text-xs">قیمت نهایی فروش:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                    {(publishData.marginType === "PERCENTAGE"
                      ? selectedProduct.supplierBasePrice *
                        (1 + publishData.marginValue / 100)
                      : selectedProduct.supplierBasePrice +
                        publishData.marginValue
                    ).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted">تومان</span>
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
              className="flex-1 overflow-y-auto flex flex-col min-h-0"
            >
              {/* Tab Navigation inside Modal */}
              <div className="flex border-b border-subtle px-6 bg-surface/30 sticky top-0 z-10 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setModalTab("basic")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "basic"
                      ? "border-primary-default text-primary-default"
                      : "border-transparent text-muted hover:text-secondary"
                  }`}
                >
                  مشخصات اصلی
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("pricing")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "pricing"
                      ? "border-primary-default text-primary-default"
                      : "border-transparent text-muted hover:text-secondary"
                  }`}
                >
                  قیمت و موجودی
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("variants")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "variants"
                      ? "border-primary-default text-primary-default"
                      : "border-transparent text-muted hover:text-secondary"
                  }`}
                >
                  تنوع و گزینه‌ها ({variants.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("media")}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalTab === "media"
                      ? "border-primary-default text-primary-default"
                      : "border-transparent text-muted hover:text-secondary"
                  }`}
                >
                  تصاویر و ویدیو
                </button>
              </div>

              <div className="flex-1 p-6 space-y-4">
                {formError && (
                  <div className="bg-danger/10 border border-rose-100 text-danger p-4 rounded-xl flex items-start gap-2.5 text-sm">
                    <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Tab 1: Basic Info */}
                {modalTab === "basic" && (
                  <div className="space-y-4">
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
                          className="w-full px-4 py-2.5 bg-card text-slate-900 dark:text-slate-100 font-bold border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                        >
                          <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                            انتخاب دسته‌بندی...
                          </option>
                          {categories.map((cat, idx) => {
                            const name = cat.name && cat.name.trim() ? cat.name : (DEFAULT_CATEGORIES[idx]?.name || `دسته‌بندی ${cat.id}`);
                            return (
                              <option key={cat.id} value={String(cat.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                {name}
                              </option>
                            );
                          })}
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
                          className="w-full px-4 py-2.5 bg-card text-slate-900 dark:text-slate-100 font-bold border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                        >
                          <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                            مدیر سیستم (تامین‌کننده پیش‌فرض)
                          </option>
                          {suppliers.map((sup) => (
                            <option key={sup.id} value={String(sup.id)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
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
                        className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default h-24 resize-none"
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

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                              className="flex-1 px-3 py-2 bg-background border border-subtle rounded-xl text-xs outline-none focus:border-primary-default"
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
                              className="flex-1 px-3 py-2 bg-background border border-subtle rounded-xl text-xs outline-none focus:border-primary-default"
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
                  </div>
                )}

                {/* Tab 2: Pricing & Stock */}
                {modalTab === "pricing" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1.5">
                          قیمت پایه تامین‌کننده (تومان) *
                        </label>
                        <input
                          type="text"
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
                          type="text"
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
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1.5">
                          میزان تخفیف محصول (درصد)
                        </label>
                        <input
                          type="text"
                          value={productForm.discount}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              discount: e.target.value,
                            })
                          }
                          placeholder="مثال: 15"
                          className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1.5">
                          کد محصول (SKU)
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
                          موجودی کل انبار
                        </label>
                        <input
                          type="text"
                          required
                          disabled={variants.length > 0}
                          value={productForm.inventory}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              inventory: e.target.value,
                            })
                          }
                          placeholder="تعداد موجودی"
                          className={`w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default ${
                            variants.length > 0 ? "opacity-60 bg-surface/50 cursor-not-allowed" : ""
                          }`}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {variants.length > 0 && (
                      <div className="bg-primary-default/5 border border-primary-default/10 rounded-xl p-3 text-xs text-primary-default font-medium">
                        ⚠️ موجودی کل به صورت خودکار از مجموع تنوع‌های ایجاد شده (جمعاً {productForm.inventory} عدد) محاسبه می‌شود و غیر قابل ویرایش مستقیم است.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Options & Variants Matrix */}
                {modalTab === "variants" && (
                  <div className="space-y-4">
                    <div className="bg-surface/50 p-4 rounded-2xl border border-subtle">
                      <h4 className="text-xs font-bold text-primary mb-2">پیش‌فرض‌های سریع تنوع</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (!attributes.find(a => a.name === "رنگ")) {
                              const updated = [...attributes, { name: "رنگ", values: [] }];
                              setAttributes(updated);
                            }
                          }}
                          className="px-3 py-1.5 bg-card hover:bg-surface border border-subtle rounded-lg text-xs font-semibold text-secondary transition-colors cursor-pointer"
                        >
                          🎨 رنگ کالا
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!attributes.find(a => a.name === "سایز")) {
                              const updated = [...attributes, { name: "سایز", values: [] }];
                              setAttributes(updated);
                            }
                          }}
                          className="px-3 py-1.5 bg-card hover:bg-surface border border-subtle rounded-lg text-xs font-semibold text-secondary transition-colors cursor-pointer"
                        >
                          📐 سایز کالا
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!attributes.find(a => a.name === "گارانتی")) {
                              const updated = [...attributes, { name: "گارانتی", values: [] }];
                              setAttributes(updated);
                            }
                          }}
                          className="px-3 py-1.5 bg-card hover:bg-surface border border-subtle rounded-lg text-xs font-semibold text-secondary transition-colors cursor-pointer"
                        >
                          🛡️ گارانتی
                        </button>
                      </div>

                      {attributes.map((attr, idx) => (
                        <div key={idx} className="mb-3 bg-background p-3 rounded-xl border border-subtle flex gap-3 items-start">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={attr.name}
                              onChange={(e) => {
                                const newAttrs = [...attributes];
                                newAttrs[idx].name = e.target.value;
                                setAttributes(newAttrs);
                              }}
                              placeholder="نام ویژگی (مثلاً رنگ)"
                              className="w-full px-3 py-1.5 bg-background border border-subtle rounded-lg text-xs outline-none focus:border-primary-default"
                            />
                            <div className="flex gap-2">
                              <input
                                id={`modal-attr-val-${idx}`}
                                type="text"
                                placeholder="افزودن مقدار جدید..."
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !attr.values.includes(val)) {
                                      const newAttrs = [...attributes];
                                      newAttrs[idx].values.push(val);
                                      setAttributes(newAttrs);
                                      generateMatrix(newAttrs);
                                    }
                                    e.currentTarget.value = "";
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 bg-background border border-subtle rounded-lg text-xs outline-none text-primary"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`modal-attr-val-${idx}`) as HTMLInputElement;
                                  if (el && el.value.trim()) {
                                    const val = el.value.trim();
                                    if (!attr.values.includes(val)) {
                                      const newAttrs = [...attributes];
                                      newAttrs[idx].values.push(val);
                                      setAttributes(newAttrs);
                                      generateMatrix(newAttrs);
                                    }
                                    el.value = "";
                                  }
                                }}
                                className="px-3 py-1.5 bg-primary-default text-inverse rounded-lg text-xs font-bold cursor-pointer transition-colors"
                              >
                                ثبت مقدار
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {attr.values.map((v, vIdx) => (
                                <div key={vIdx} className="px-2.5 py-1 bg-surface border border-subtle rounded-full text-[10px] font-bold flex items-center gap-1.5">
                                  <span>{v}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAttrs = [...attributes];
                                      newAttrs[idx].values = newAttrs[idx].values.filter((_, i) => i !== vIdx);
                                      setAttributes(newAttrs);
                                      generateMatrix(newAttrs);
                                    }}
                                    className="text-muted hover:text-danger cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newAttrs = attributes.filter((_, i) => i !== idx);
                              setAttributes(newAttrs);
                              generateMatrix(newAttrs);
                            }}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newAttrName}
                          onChange={(e) => setNewAttrName(e.target.value)}
                          placeholder="نام ویژگی دلخواه (مثلاً ظرفیت)"
                          className="flex-1 px-3 py-2 bg-background border border-subtle rounded-xl text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newAttrName.trim()) {
                              const updated = [...attributes, { name: newAttrName.trim(), values: [] }];
                              setAttributes(updated);
                              setNewAttrName("");
                            }
                          }}
                          className="px-4 py-2 bg-primary-default text-inverse rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          + افزودن ویژگی جدید
                        </button>
                      </div>
                    </div>

                    {variants.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-primary">لیست ترکیبات تنوع تولید شده ({variants.length})</h4>
                          <button
                            type="button"
                            onClick={() => {
                              if (!productForm.supplierBasePrice) {
                                toast("لطفاً قیمت پایه را در تب قبلی مشخص کنید.", "error");
                                return;
                              }
                              const updated = variants.map(v => ({ ...v, supplierBasePrice: productForm.supplierBasePrice }));
                              setVariants(updated);
                              toast("قیمت پایه روی تمام تنوع‌ها اعمال شد.", "success");
                            }}
                            className="text-[10px] font-bold text-primary-default bg-primary-default/5 px-2.5 py-1.5 rounded-lg border border-primary-default/20 cursor-pointer"
                          >
                            ⚙️ اعمال قیمت پایه به همه
                          </button>
                        </div>

                        <div className="max-h-72 overflow-y-auto border border-subtle rounded-2xl divide-y divide-subtle">
                          {variants.map((v, idx) => (
                            <div key={idx} className="p-3 bg-card hover:bg-surface/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Variant Image */}
                                <div className="relative group/vimg">
                                  {v.imageUrl ? (
                                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-subtle">
                                      <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => handleVariantChange(idx, "imageUrl", "")}
                                        className="absolute inset-0 bg-red-600/80 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover/vimg:opacity-100 transition-opacity"
                                        title="حذف تصویر تنوع"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="w-9 h-9 rounded-lg border border-dashed border-subtle flex items-center justify-center text-muted hover:text-primary-default hover:border-primary-default transition-colors cursor-pointer bg-surface" title="افزودن تصویر تنوع">
                                      <Upload className="w-3.5 h-3.5" />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (re) => {
                                              handleVariantChange(idx, "imageUrl", re.target?.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                                <span className="font-bold text-secondary max-w-[130px] truncate">
                                  {typeof v.attributes === "object" && v.attributes !== null
                                    ? Object.values(v.attributes).join(" - ")
                                    : String(v.attributes || `تنوع ${idx + 1}`)}
                                </span>
                              </div>

                              <div className="flex gap-2 items-center flex-wrap">
                                <input
                                  type="text"
                                  value={v.supplierBasePrice}
                                  placeholder="قیمت تومان"
                                  onChange={(e) => handleVariantChange(idx, "supplierBasePrice", e.target.value)}
                                  className="w-24 px-2 py-1 bg-background border border-subtle rounded-lg text-center font-bold"
                                  dir="ltr"
                                />
                                <input
                                  type="text"
                                  value={v.stock}
                                  placeholder="موجودی"
                                  onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                                  className="w-16 px-2 py-1 bg-background border border-subtle rounded-lg text-center"
                                  dir="ltr"
                                />
                                <input
                                  type="text"
                                  value={v.sku || ""}
                                  placeholder="کد SKU"
                                  onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                                  className="w-24 px-2 py-1 bg-background border border-subtle rounded-lg text-center font-mono text-[10px]"
                                  dir="ltr"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = variants.filter((_, i) => i !== idx);
                                    setVariants(updated);
                                  }}
                                  className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer font-bold"
                                  title="حذف تنوع"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Images & Video */}
                {modalTab === "media" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1.5">
                        تصویر اصلی کالا (URL یا آپلود) *
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
                        <div className="mt-2 relative w-20 h-20 rounded-xl border border-subtle overflow-hidden bg-background flex items-center justify-center group shadow-sm">
                          <img
                            src={productForm.imageUrl}
                            alt="تصویر اصلی"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, imageUrl: "" })}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-[10px] cursor-pointer"
                          >
                            حذف تصویر
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-subtle pt-4">
                      <label className="block text-xs font-bold text-secondary mb-1.5">
                        گالری تصاویر بیشتر (اختیاری)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="modal-extra-image-input"
                          type="text"
                          placeholder="https://example.com/other-image.png"
                          className="flex-1 px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("modal-extra-image-input") as HTMLInputElement;
                            if (input && input.value.trim()) {
                              setImages([...images, input.value.trim()]);
                              input.value = "";
                            }
                          }}
                          className="px-4 py-2.5 bg-primary-default text-inverse rounded-xl text-sm font-bold cursor-pointer"
                        >
                          + افزودن
                        </button>
                      </div>

                      {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 p-2 bg-surface/30 rounded-xl border border-subtle max-h-36 overflow-y-auto">
                          {images.map((img, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg border border-subtle overflow-hidden group bg-background">
                              <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs flex items-center justify-center"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-subtle pt-4">
                      <label className="block text-xs font-bold text-secondary mb-1.5">
                        ویدیو معرفی کالا (URL)
                      </label>
                      <input
                        type="text"
                        value={productForm.videoUrl}
                        onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                        placeholder="https://example.com/explainer-video.mp4"
                        className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons sticky at the bottom */}
              <div className="p-5 border-t border-subtle flex gap-3 sticky bottom-0 bg-card">
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

      {/* Zopit Product Preview Modal */}
      {previewProduct && (
        <DigikalaProductModal
          isOpen={!!previewProduct}
          onClose={() => setPreviewProduct(null)}
          product={previewProduct}
        />
      )}
    </div>
  );
}
