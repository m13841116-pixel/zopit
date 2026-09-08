import React, { useState, useEffect, useMemo } from "react";
import { toast } from "../GlobalToast";
import {
  Globe,
  Key,
  Lock,
  ArrowRight,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  ShoppingBag,
  Store,
  Info,
  Sliders,
  DollarSign,
  Package,
  Trash2,
  Eye,
  ExternalLink,
  ShieldCheck,
  Flame,
  History,
  Unplug,
  AlertTriangle,
  FolderPlus
} from "lucide-react";

interface ProductVariation {
  id: string;
  name: string;
  attributeName?: string;
  attributeValue?: string;
  attributes: string;
  stock: number;
  originalPrice: number;
  wholesalePrice: number;
  sku?: string;
  imageUrl?: string;
}

interface StagedProduct {
  wcId: number;
  name: string;
  slug?: string;
  type: string;
  sku: string;
  primaryCategory: string;
  categories: string[];
  categoryStatus: "RESOLVED" | "UNRESOLVED";
  status: "READY" | "UPDATE_EXISTING" | "CATEGORY_UNRESOLVED" | "INVALID";
  isExisting?: boolean;
  existingProductId?: string | null;
  existingPrice?: number | null;
  existingStock?: number | null;
  mainImage: string;
  images: string[];
  originalPrice: number;
  originalSalePrice: number;
  wholesalePrice: number;
  stock: number;
  weight?: number;
  dimensions?: { length: string; width: string; height: string };
  shortDescription: string;
  longDescription: string;
  technicalSpecs: { key: string; value: string }[];
  variations: ProductVariation[];
  hasVariations: boolean;
  isSelected: boolean;
  expandedVariations?: boolean;
  validationErrors?: string[];
}

interface SavedConnectionInfo {
  connected: boolean;
  storeUrl?: string;
  consumerKeyMasked?: string;
  currencyUnit?: "toman" | "rial";
  isActive?: boolean;
  lastTestedAt?: string;
  lastSyncedAt?: string;
  storeName?: string;
}

interface SupplierWooCommerceImportProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

const DEFAULT_ZOPIT_CATEGORIES = [
  "کالای دیجیتال",
  "مد و پوشاک",
  "زیبایی و سلامت",
  "خانه و آشپزخانه",
  "ورزش و سفر",
  "کتاب و لوازم‌تحریر",
  "اسباب‌بازی و کودک",
  "ابزار و تجهیزات",
  "سوپرمارکت و خوراکی"
];

export function SupplierWooCommerceImport({
  onSuccess,
  onCancel,
  showNotification
}: SupplierWooCommerceImportProps) {
  // Step State: 1 = Connect & Config, 2 = Staging & Bulk Pricing, 3 = Completed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Connection State
  const [savedConnection, setSavedConnection] = useState<SavedConnectionInfo | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [useSavedConnection, setUseSavedConnection] = useState(false);
  const [isEditingConnection, setIsEditingConnection] = useState(false);

  // Form State
  const [storeUrl, setStoreUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [currencyUnit, setCurrencyUnit] = useState<"toman" | "rial">("toman");
  const [saveCredentialsOnServer, setSaveCredentialsOnServer] = useState(true);

  // Pagination & Fetch Options
  const [fetchPage, setFetchPage] = useState<number>(1);
  const [fetchPerPage, setFetchPerPage] = useState<number>(100);

  // Loading States
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [storeMeta, setStoreMeta] = useState<{ storeName: string; totalProducts: number } | null>(null);

  // Staged Products State
  const [products, setProducts] = useState<StagedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(20);

  // Duplicate & Target Status Options
  const [duplicateAction, setDuplicateAction] = useState<"update" | "skip" | "create_new">("update");
  const [targetStatus, setTargetStatus] = useState<"PENDING_APPROVAL" | "DRAFT">("PENDING_APPROVAL");

  // Zopit Categories
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_ZOPIT_CATEGORIES);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>("");

  // Success summary
  const [importSummary, setImportSummary] = useState<{
    count: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    targetStatus: string;
    message: string;
    historyId?: string;
  } | null>(null);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Initial Load: Fetch categories & saved connection status
  useEffect(() => {
    // Clear any legacy plain-text secrets from localStorage for security compliance
    try {
      localStorage.removeItem("zopit_supplier_wc_creds");
    } catch {}

    const loadInitialData = async () => {
      setIsCheckingConnection(true);
      const token = localStorage.getItem("token") || "";

      // 1. Fetch official categories
      try {
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            const names = catData.map((c: any) => (typeof c === "string" ? c : c.name)).filter(Boolean);
            if (names.length > 0) {
              setAvailableCategories(Array.from(new Set(names)));
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load categories from API", e);
      }

      // 2. Fetch saved connection
      try {
        const connRes = await fetch("/api/supplier/woocommerce/connection", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (connRes.ok) {
          const connData = await connRes.json();
          if (connData.connected && connData.connection) {
            setSavedConnection(connData.connection);
            setUseSavedConnection(true);
            setStoreUrl(connData.connection.storeUrl || "");
            if (connData.connection.currencyUnit) {
              setCurrencyUnit(connData.connection.currencyUnit);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to check saved connection", e);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    loadInitialData();
  }, []);

  // Test Connection
  const handleTestConnection = async () => {
    const token = localStorage.getItem("token") || "";
    setIsConnecting(true);

    try {
      const payload = useSavedConnection && savedConnection?.connected && !isEditingConnection
        ? { useSaved: true }
        : { storeUrl, consumerKey, consumerSecret, currencyUnit };

      if (!payload.useSaved && (!storeUrl || !consumerKey || !consumerSecret)) {
        toast("لطفاً آدرس سایت و کلیدهای ووکامرس را وارد نمایید.", "error");
        setIsConnecting(false);
        return;
      }

      const res = await fetch("/api/supplier/woocommerce/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "خطا در برقراری ارتباط با ووکامرس", "error");
        return;
      }

      setStoreMeta({
        storeName: data.storeName || "فروشگاه ووکامرس شما",
        totalProducts: data.totalProducts || 0
      });

      toast(
        `اتصال موفقیت‌آمیز بود! فروشگاه «${data.storeName || "شما"}» دارای ${data.totalProducts || 0} محصول است.`,
        "success"
      );
    } catch (err: any) {
      toast("خطای ارتباط با سرور زوپیت هنگام تست اتصال", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  // Step 1: Connect & Fetch Catalog
  const handleFetchProducts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const token = localStorage.getItem("token") || "";
    const usingSaved = useSavedConnection && savedConnection?.connected && !isEditingConnection;

    if (!usingSaved && (!storeUrl || !consumerKey || !consumerSecret)) {
      toast("لطفاً آدرس سایت، Consumer Key و Consumer Secret را وارد کنید.", "error");
      return;
    }

    setIsConnecting(true);

    try {
      // 1. Optionally save credentials to server if user requested
      if (!usingSaved && saveCredentialsOnServer) {
        try {
          await fetch("/api/supplier/woocommerce/save-connection", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              storeUrl,
              consumerKey,
              consumerSecret,
              currencyUnit,
              storeName: storeMeta?.storeName || undefined
            })
          });
        } catch (sErr) {
          console.warn("Failed to persist credentials safely", sErr);
        }
      }

      // 2. Fetch Catalog Products
      const fetchPayload = usingSaved
        ? { useSaved: true, perPage: fetchPerPage, page: fetchPage }
        : {
            storeUrl,
            consumerKey,
            consumerSecret,
            perPage: fetchPerPage,
            page: fetchPage,
            currencyUnit
          };

      const fetchRes = await fetch("/api/supplier/woocommerce/fetch-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(fetchPayload)
      });

      const fetchData = await fetchRes.json();
      if (!fetchRes.ok) {
        toast(fetchData.error || "خطا در دریافت لیست محصولات از ووکامرس", "error");
        setIsConnecting(false);
        return;
      }

      const receivedProducts: StagedProduct[] = (fetchData.products || []).map((p: any) => ({
        ...p,
        isSelected: true,
        expandedVariations: false
      }));

      if (receivedProducts.length === 0) {
        toast("هیچ محصول فعالی در صفحه انتخاب‌شده یافت نشد.", "info");
        setIsConnecting(false);
        return;
      }

      setProducts(receivedProducts);
      setStoreMeta({
        storeName: fetchData.storeName || storeMeta?.storeName || "فروشگاه شما",
        totalProducts: fetchData.totalProducts || receivedProducts.length
      });

      // Clear plain-text secret from component memory
      setConsumerSecret("");

      // Update saved connection in UI state
      if (!usingSaved && saveCredentialsOnServer) {
        setSavedConnection({
          connected: true,
          storeUrl: storeUrl.trim(),
          consumerKeyMasked: consumerKey.substring(0, 7) + "****************",
          currencyUnit,
          isActive: true,
          lastTestedAt: new Date().toISOString(),
          storeName: fetchData.storeName || "فروشگاه شما"
        });
        setUseSavedConnection(true);
        setIsEditingConnection(false);
      }

      setCurrentStep(2);
      toast(
        `تعداد ${receivedProducts.length} محصول با موفقیت فراخوانی و اعتبارسنجی شد.`,
        "success"
      );
    } catch (err: any) {
      toast("خطا در برقراری ارتباط با سرور زوپیت", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Store
  const handleDisconnect = async () => {
    if (!window.confirm("آیا از حذف اطلاعات اتصال ووکامرس از سرور اطمینان دارید؟")) {
      return;
    }

    const token = localStorage.getItem("token") || "";
    try {
      const res = await fetch("/api/supplier/woocommerce/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedConnection(null);
        setUseSavedConnection(false);
        setIsEditingConnection(true);
        setStoreUrl("");
        setConsumerKey("");
        setConsumerSecret("");
        toast("اطلاعات اتصال فروشگاه با موفقیت حذف گردید.", "info");
      }
    } catch (e) {
      toast("خطا در حذف اتصال", "error");
    }
  };

  // Fetch Import History
  const loadImportHistory = async () => {
    setIsLoadingHistory(true);
    setShowHistoryModal(true);
    const token = localStorage.getItem("token") || "";

    try {
      const res = await fetch("/api/supplier/products/import-history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.warn("Failed to load history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Bulk Discount Application
  const applyBulkDiscount = (percent: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (!prod.isSelected) return prod;
        const basePrice = prod.originalSalePrice > 0 ? prod.originalSalePrice : prod.originalPrice;
        const newWholesale = Math.round((basePrice * (1 - percent / 100)) / 1000) * 1000;

        const updatedVariations = (prod.variations || []).map((v) => {
          const vBase = v.originalPrice > 0 ? v.originalPrice : basePrice;
          return {
            ...v,
            wholesalePrice: Math.round((vBase * (1 - percent / 100)) / 1000) * 1000
          };
        });

        return {
          ...prod,
          wholesalePrice: Math.max(1000, newWholesale),
          variations: updatedVariations
        };
      })
    );
    toast(`تخفیف همکاری ${percent}٪ روی کالاهای انتخاب‌شده اعمال شد.`, "info");
  };

  // Rounding Prices to 1,000 Tomans
  const handleRoundPrices = () => {
    setProducts((prev) =>
      prev.map((prod) => ({
        ...prod,
        wholesalePrice: Math.round(prod.wholesalePrice / 1000) * 1000,
        variations: (prod.variations || []).map((v) => ({
          ...v,
          wholesalePrice: Math.round(v.wholesalePrice / 1000) * 1000
        }))
      }))
    );
    toast("قیمت‌های همکاری به نزدیک‌ترین ۱,۰۰۰ تومان رند شدند.", "info");
  };

  // Update Individual Product Wholesale Price
  const updateProductWholesalePrice = (wcId: number, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.wcId === wcId ? { ...p, wholesalePrice: newPrice } : p))
    );
  };

  // Update Individual Variation Wholesale Price
  const updateVariationWholesalePrice = (wcId: number, varId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.wcId !== wcId) return p;
        return {
          ...p,
          variations: p.variations.map((v) => (v.id === varId ? { ...v, wholesalePrice: newPrice } : v))
        };
      })
    );
  };

  // Map Product Category
  const handleSetProductCategory = (wcId: number, category: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.wcId !== wcId) return p;
        const newStatus = p.isExisting ? "UPDATE_EXISTING" : "READY";
        return {
          ...p,
          primaryCategory: category,
          categoryStatus: "RESOLVED",
          status: newStatus
        };
      })
    );
  };

  // Bulk Apply Category to Selected Items
  const handleBulkApplyCategory = () => {
    if (!bulkCategoryTarget) {
      toast("لطفاً یک دسته‌بندی معتبر از لیست انتخاب کنید.", "error");
      return;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (!p.isSelected) return p;
        const newStatus = p.isExisting ? "UPDATE_EXISTING" : "READY";
        return {
          ...p,
          primaryCategory: bulkCategoryTarget,
          categoryStatus: "RESOLVED",
          status: newStatus
        };
      })
    );
    toast(`دسته‌بندی «${bulkCategoryTarget}» برای کالاهای انتخاب‌شده ثبت شد.`, "success");
    setBulkCategoryTarget("");
  };

  // Toggle Selection
  const toggleSelectAll = (select: boolean) => {
    setProducts((prev) => prev.map((p) => ({ ...p, isSelected: select })));
  };

  const toggleSelectProduct = (wcId: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.wcId === wcId ? { ...p, isSelected: !p.isSelected } : p))
    );
  };

  // Remove item from staging
  const removeProductFromStaging = (wcId: number) => {
    setProducts((prev) => prev.filter((p) => p.wcId !== wcId));
  };

  // Final Batch Import
  const handleFinalBatchImport = async () => {
    const selectedProducts = products.filter((p) => p.isSelected);
    if (selectedProducts.length === 0) {
      toast("لطفاً حداقل یک محصول را برای ثبت انتخاب نمایید.", "error");
      return;
    }

    // Validate that all wholesale prices are > 0
    const invalidPrice = selectedProducts.find((p) => p.wholesalePrice <= 0);
    if (invalidPrice) {
      toast(`قیمت عمده برای محصول «${invalidPrice.name}» نامعتبر است.`, "error");
      return;
    }

    // Check unresolved categories warning
    const unresolvedCount = selectedProducts.filter((p) => p.categoryStatus === "UNRESOLVED").length;
    if (unresolvedCount > 0) {
      const confirmProceed = window.confirm(
        `تعداد ${unresolvedCount} محصول هنوز دسته‌بندی مشخصی در زوپیت ندارند و در دسته‌بندی عمومی قرار خواهند گرفت. آیا مایل به ادامه هستید؟`
      );
      if (!confirmProceed) return;
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/woocommerce/import-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          products: selectedProducts,
          duplicateAction,
          targetStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "خطا در انتقال محصولات", "error");
        setIsImporting(false);
        return;
      }

      setImportSummary({
        count: data.count || selectedProducts.length,
        createdCount: data.createdCount ?? selectedProducts.length,
        updatedCount: data.updatedCount ?? 0,
        skippedCount: data.skippedCount ?? 0,
        targetStatus: data.targetStatus || targetStatus,
        message: data.message || "انتقال با موفقیت انجام شد.",
        historyId: data.historyId
      });

      setCurrentStep(3);

      if (showNotification) {
        showNotification(
          `تعداد ${data.count || selectedProducts.length} محصول با وضعیت «${
            targetStatus === "PENDING_APPROVAL" ? "در انتظار تایید" : "پیش‌نویس"
          }» به سیستم وارد شد.`,
          "success"
        );
      }
    } catch (err: any) {
      toast("خطای ارتباط با سرور هنگام ثبت نهایی کاتالوگ", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Filter Categories
  const categoriesInStaging = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.primaryCategory).filter(Boolean)));
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || p.primaryCategory === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === "ready") matchesStatus = p.status === "READY";
      else if (statusFilter === "existing") matchesStatus = !!p.isExisting;
      else if (statusFilter === "unresolved") matchesStatus = p.categoryStatus === "UNRESOLVED";
      else if (statusFilter === "variations") matchesStatus = p.hasVariations;
      else if (statusFilter === "selected") matchesStatus = p.isSelected;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  const selectedCount = products.filter((p) => p.isSelected).length;
  const existingCount = products.filter((p) => p.isExisting).length;
  const unresolvedCategoryCount = products.filter((p) => p.categoryStatus === "UNRESOLVED").length;

  // Average Margin of Selected Products
  const avgMargin = useMemo(() => {
    const selected = products.filter((p) => p.isSelected && p.originalPrice > 0);
    if (selected.length === 0) return 0;
    const totalMargin = selected.reduce((sum, p) => {
      const margin = ((p.originalPrice - p.wholesalePrice) / p.originalPrice) * 100;
      return sum + Math.max(0, margin);
    }, 0);
    return Math.round(totalMargin / selected.length);
  }, [products]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto" dir="rtl">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border border-subtle shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-primary">
                انتقال خودکار کاتالوگ از سایت ووکامرس (WooCommerce REST API)
              </h2>
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                امنیت رمزنگاری AES-256
              </span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                چرخه تایید کیفی ادمین
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 font-medium">
              فراخوانی آنی کالاها، عکس‌ها و تنوع‌ها بدون نیاز به افزونه + میز قیمت‌گذاری و تطبیق دسته‌بندی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={loadImportHistory}
            className="px-3 py-2 bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle flex items-center gap-1.5 cursor-pointer"
            title="مشاهده گزارش و سوابق ورود قبلی کالاها"
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>تاریخچه واردات</span>
          </button>

          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3 py-2 bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تغییر کلیدها / اتصال مجدد</span>
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-subtle/50 hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              بازگشت به محصولات
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-surface rounded-2xl border border-subtle text-center text-xs font-bold">
        <div
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            currentStep === 1
              ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
              : "text-muted"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-[11px] font-black">
            ۱
          </span>
          <span>اتصال و واکشی کاتالوگ</span>
        </div>
        <div
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            currentStep === 2
              ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-xs font-black"
              : "text-muted"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-[11px] font-black">
            ۲
          </span>
          <span>میز کار قیمت‌گذاری و تطبیق</span>
        </div>
        <div
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            currentStep === 3
              ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
              : "text-muted"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-[11px] font-black">
            ۳
          </span>
          <span>ثبت در صف تایید ادمین</span>
        </div>
      </div>

      {/* STEP 1: WooCommerce Connection Form & Instruction */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card p-6 md:p-8 rounded-3xl border border-subtle shadow-sm space-y-6">
              <div className="border-b border-subtle pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-primary flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    <span>تنظیمات ارتباط وب‌سرویس ووکامرس</span>
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    محصولات فروشگاه وردپرسی شما مستقیماً با سرعت بالا از طریق API استاندارد خوانده می‌شوند.
                  </p>
                </div>
                {savedConnection?.connected && (
                  <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اتصال سرور فعال</span>
                  </span>
                )}
              </div>

              {/* If Saved Connection Exists and not editing */}
              {savedConnection?.connected && !isEditingConnection ? (
                <div className="space-y-5">
                  <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                          فروشگاه متصل و ذخیره‌شده:
                        </span>
                        <h4 className="text-base font-black text-primary flex items-center gap-2">
                          <Store className="w-4 h-4 text-indigo-600" />
                          <span>{savedConnection.storeName || savedConnection.storeUrl}</span>
                        </h4>
                        <span className="text-xs font-mono text-muted block dir-ltr text-right">
                          {savedConnection.storeUrl}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="قطع اتصال و حذف کلیدها از سرور"
                      >
                        <Unplug className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-subtle">
                      <div>
                        <span className="text-muted text-[11px] block">شناسه کاربری (کلید ماسک‌شده):</span>
                        <span className="font-mono text-secondary font-bold">
                          {savedConnection.consumerKeyMasked || "ck_••••••••"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted text-[11px] block">واحد پولی ثبت‌شده:</span>
                        <span className="font-bold text-secondary">
                          {savedConnection.currencyUnit === "rial" ? "ریال" : "تومان"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pagination / Fetch Options */}
                  <div className="grid grid-cols-2 gap-3 bg-surface p-4 rounded-2xl border border-subtle">
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1">
                        شماره صفحه واکشی
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={fetchPage}
                        onChange={(e) => setFetchPage(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-bold text-primary"
                      />
                      <span className="text-[10px] text-muted mt-0.5 block">صفحه ۱ برای شروع</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1">
                        تعداد در هر بار واکشی
                      </label>
                      <select
                        value={fetchPerPage}
                        onChange={(e) => setFetchPerPage(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-bold text-primary"
                      >
                        <option value={50}>۵۰ محصول</option>
                        <option value={100}>۱۰۰ محصول (پیشنهادی)</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Action Buttons for saved connection */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleFetchProducts()}
                      disabled={isConnecting}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>در حال واکشی کاتالوگ از ووکامرس...</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-5 h-5" />
                          <span>واکشی و پردازش هوشمند کاتالوگ فروشگاه</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isConnecting}
                        className="flex-1 py-2.5 bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>تست مجدد اتصال</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditingConnection(true)}
                        className="px-4 py-2.5 bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>ویرایش کلیدها / فروشگاه جدید</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Connect Form */
                <form onSubmit={handleFetchProducts} className="space-y-4">
                  {/* Store URL */}
                  <div>
                    <label className="block text-xs font-black text-secondary mb-1.5">
                      آدرس دامنه سایت شما <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={storeUrl}
                        onChange={(e) => setStoreUrl(e.target.value)}
                        placeholder="https://myshop.ir"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-subtle rounded-2xl text-sm font-mono text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left transition-all"
                      />
                      <Globe className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                      مثال: <code>https://yourdomain.com</code> یا <code>https://shop.ir</code> (حتماً با https یا http)
                    </p>
                  </div>

                  {/* Consumer Key */}
                  <div>
                    <label className="block text-xs font-black text-secondary mb-1.5">
                      Consumer Key (کلید کاربری ووکامرس) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={consumerKey}
                        onChange={(e) => setConsumerKey(e.target.value)}
                        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-subtle rounded-2xl text-xs font-mono text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left transition-all"
                      />
                      <Key className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    </div>
                  </div>

                  {/* Consumer Secret */}
                  <div>
                    <label className="block text-xs font-black text-secondary mb-1.5">
                      Consumer Secret (رمز مخفی ووکامرس) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        dir="ltr"
                        required
                        value={consumerSecret}
                        onChange={(e) => setConsumerSecret(e.target.value)}
                        placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-subtle rounded-2xl text-xs font-mono text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left transition-all"
                      />
                      <Lock className="w-4 h-4 text-muted absolute left-3 top-3.5" />
                    </div>
                    <p className="text-[10px] text-muted mt-1">
                      رمز مخفی به صورت سرور‌به‌سرور رمزنگاری شده و هرگز در مرورگر یا لاگ‌ها ذخیره نمی‌شود.
                    </p>
                  </div>

                  {/* Currency Option & Save Creds */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1.5">
                        واحد پولی ثبت شده در سایت شما
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-background p-1.5 rounded-2xl border border-subtle">
                        <button
                          type="button"
                          onClick={() => setCurrencyUnit("toman")}
                          className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                            currencyUnit === "toman"
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-muted hover:text-primary"
                          }`}
                        >
                          تومان (پیش‌فرض)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrencyUnit("rial")}
                          className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                            currencyUnit === "rial"
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "text-muted hover:text-primary"
                          }`}
                        >
                          ریال
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-secondary">
                        <input
                          type="checkbox"
                          checked={saveCredentialsOnServer}
                          onChange={(e) => setSaveCredentialsOnServer(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-subtle"
                        />
                        <span>ذخیره امن اطلاعات اتصال در سرور (رمزنگاری AES-256)</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 space-y-2">
                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>در حال اتصال و دریافت کاتالوگ...</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-5 h-5" />
                          <span>اتصال به سایت و دریافت هوشمند محصولات</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isConnecting}
                        className="flex-1 py-2.5 bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>تست اتصال آزمایشی (بدون دریافت کالاها)</span>
                      </button>

                      {savedConnection?.connected && (
                        <button
                          type="button"
                          onClick={() => setIsEditingConnection(false)}
                          className="px-4 py-2.5 bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle cursor-pointer"
                        >
                          انصراف
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Side Guide & Visual Help */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-surface border border-subtle p-6 md:p-7 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 text-primary">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-primary">
                  آموزش ۲ دقیقه‌ای ساخت کلید ووکامرس (بدون افزونه)
                </h4>
              </div>

              <p className="text-xs text-secondary leading-relaxed font-medium">
                ووکامرس به صورت پیش‌فرض قابلیت اتصال ایمن دارد و نیازی به نصب هیچ افزونه جانبی نیست:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-background rounded-2xl border border-subtle flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0 border border-indigo-500/20">
                    ۱
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-primary block">رفتن به بخش کلیدهای REST API</strong>
                    <span className="text-muted text-[11px] leading-relaxed block">
                      وارد پیشخوان وردپرس شوید: <strong>ووکامرس &gt; پیکربندی (تنظیمات) &gt; برگه پیشرفته (Advanced) &gt; REST API</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-background rounded-2xl border border-subtle flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0 border border-indigo-500/20">
                    ۲
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-primary block">افزودن کلید جدید (Add Key)</strong>
                    <span className="text-muted text-[11px] leading-relaxed block">
                      روی «افزودن کلید» کلیک کنید، دسترسی را روی <strong>«خواندن (Read)»</strong> یا «خواندن/نوشتن» قرار دهید و دکمه ساخت کلید را بزنید.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-background rounded-2xl border border-subtle flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0 border border-indigo-500/20">
                    ۳
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-primary block">کپی و جایگذاری در فرم زوپیت</strong>
                    <span className="text-muted text-[11px] leading-relaxed block">
                      دو کد نمایش داده شده (Consumer Key و Consumer Secret) را کپی کرده و در کادرهای روبرو قرار دهید.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-primary font-medium leading-relaxed">
                  <strong>امنیت و حفظ حریم خصوصی:</strong> کلیه اطلاعات ارتباطی در لایه سرور به صورت متقارن رمزنگاری شده و دارای مکانیزم‌های ضدنفوذ (SSRF Protection) است.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Product Staging Desk & Bulk Quick Pricing */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* NOTICE: Lifecycle Enforcement */}
          <div className="bg-amber-500/10 border border-amber-500/20 text-primary p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <strong className="text-amber-700 dark:text-amber-400 block font-black">
                چرخه حاکمیت کالا در زوپیت: هیچ محصولی بدون تایید ادمین منتشر نمی‌شود
              </strong>
              <p className="text-secondary font-medium">
                کالاهای انتخابی شما پس از ثبت، مستقیماً وارد وضعیت <strong>«در انتظار تایید ادمین»</strong> یا <strong>«پیش‌نویس»</strong> خواهند شد. پس از بررسی مشخصات کیفی و تعیین درصد مارجین پلتفرم توسط ادمین، کالا برای فروشگاه‌ها فعال می‌گردد.
              </p>
            </div>
          </div>

          {/* Configuration Banner: Duplicate Action & Target Status */}
          <div className="bg-card p-5 rounded-3xl border border-subtle shadow-xs grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Duplicate Action */}
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>رفتار با کالاهای از قبل موجود در پنل شما ({existingCount} مورد شناسایی شد):</span>
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDuplicateAction("update")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    duplicateAction === "update"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-surface hover:bg-subtle text-secondary border-subtle"
                  }`}
                >
                  <span className="block font-black">به‌روزرسانی</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">قیمت و موجودی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateAction("skip")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    duplicateAction === "skip"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-surface hover:bg-subtle text-secondary border-subtle"
                  }`}
                >
                  <span className="block font-black">صرف‌نظر (Skip)</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">عدم تغییر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateAction("create_new")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    duplicateAction === "create_new"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-surface hover:bg-subtle text-secondary border-subtle"
                  }`}
                >
                  <span className="block font-black">ثبت مجدد</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">کد کالای جداگانه</span>
                </button>
              </div>
            </div>

            {/* Target Status */}
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>وضعیت ورود اولیه کالاهای تاییدشده:</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTargetStatus("PENDING_APPROVAL")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetStatus === "PENDING_APPROVAL"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-surface hover:bg-subtle text-secondary border-subtle"
                  }`}
                >
                  <span className="block font-black">در انتظار تایید مدیر (پیشنهادی)</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">ارسال مستقیم به صف بررسی ادمین</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetStatus("DRAFT")}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetStatus === "DRAFT"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-surface hover:bg-subtle text-secondary border-subtle"
                  }`}
                >
                  <span className="block font-black">پیش‌نویس (Draft)</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">جهت ویرایش بعدی در پنل شما</span>
                </button>
              </div>
            </div>
          </div>

          {/* BULK QUICK PRICING TOOLBAR */}
          <div className="bg-card p-5 rounded-3xl border border-subtle shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-subtle pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-black text-primary">
                    ابزارهای قیمت‌گذاری سریع دسته‌جمعی (Quick Pricing Desk)
                  </h4>
                  <p className="text-[11px] text-muted">
                    تنظیم درصدی حاشیه تخفیف همکاری برای تامین در شبکه فروشگاه‌های زوپیت
                  </p>
                </div>
              </div>

              {/* Quick Percentage Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-secondary">اعمال تخفیف همگانی:</span>
                <button
                  type="button"
                  onClick={() => applyBulkDiscount(15)}
                  className="px-3 py-1.5 bg-background hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle cursor-pointer active:scale-95"
                >
                  ۱۵٪
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkDiscount(20)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>۲۰٪ (پیشنهاد طلایی)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkDiscount(25)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  ۲۵٪ (پرفروش 🔥)
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkDiscount(30)}
                  className="px-3 py-1.5 bg-background hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle cursor-pointer active:scale-95"
                >
                  ۳۰٪
                </button>

                {/* Custom percentage input */}
                <div className="flex items-center gap-1 bg-background px-2 py-1 rounded-xl border border-subtle">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={bulkDiscountPercent}
                    onChange={(e) => setBulkDiscountPercent(Number(e.target.value))}
                    className="w-12 text-center text-xs font-black bg-transparent outline-none text-primary"
                  />
                  <span className="text-xs text-muted">٪</span>
                  <button
                    type="button"
                    onClick={() => applyBulkDiscount(bulkDiscountPercent)}
                    className="px-2 py-0.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-[10px] font-black cursor-pointer"
                  >
                    اعمال
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRoundPrices}
                  className="px-3 py-1.5 bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle flex items-center gap-1 cursor-pointer"
                  title="گرد کردن تمامی مبالغ به ۱۰۰۰ تومان"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>رند کردن (۱,۰۰۰ تومان)</span>
                </button>
              </div>
            </div>

            {/* Bulk Category Mapping Tool */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-subtle text-xs">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-secondary">
                  تغییر دسته‌بندی زوپیت برای کالاهای انتخاب‌شده ({selectedCount} کالا):
                </span>
                <select
                  value={bulkCategoryTarget}
                  onChange={(e) => setBulkCategoryTarget(e.target.value)}
                  className="py-1.5 px-3 bg-background border border-subtle rounded-xl text-xs font-bold text-primary focus:outline-none"
                >
                  <option value="">انتخاب دسته‌بندی مقصد...</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleBulkApplyCategory}
                  disabled={!bulkCategoryTarget || selectedCount === 0}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  اعمال به انتخاب‌شده‌ها
                </button>
              </div>

              {unresolvedCategoryCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{unresolvedCategoryCount} کالا نیازمند انتخاب دسته‌بندی هستند</span>
                </span>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو بر اساس نام یا کد کالا..."
                    className="w-full pl-9 pr-4 py-2 bg-background border border-subtle rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-subtle text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      statusFilter === "all" ? "bg-card text-primary shadow-xs" : "text-muted"
                    }`}
                  >
                    همه ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ready")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      statusFilter === "ready" ? "bg-card text-emerald-600 shadow-xs" : "text-muted"
                    }`}
                  >
                    آماده ارسال
                  </button>
                  {existingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("existing")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        statusFilter === "existing" ? "bg-card text-indigo-600 shadow-xs" : "text-muted"
                      }`}
                    >
                      موجود در زوپیت ({existingCount})
                    </button>
                  )}
                  {unresolvedCategoryCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("unresolved")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        statusFilter === "unresolved" ? "bg-card text-amber-600 shadow-xs" : "text-muted"
                      }`}
                    >
                      بدون دسته‌بندی ({unresolvedCategoryCount})
                    </button>
                  )}
                </div>

                {categoriesInStaging.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="py-2 px-3 bg-background border border-subtle rounded-xl text-xs font-bold text-secondary focus:outline-none"
                  >
                    <option value="all">همه گروه‌ها</option>
                    {categoriesInStaging.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selection Controls */}
              <div className="flex items-center gap-2 text-xs font-bold text-secondary w-full sm:w-auto justify-end">
                <span>
                  {selectedCount.toLocaleString("fa-IR")} از {products.length.toLocaleString("fa-IR")} انتخاب شده
                </span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="text-indigo-600 hover:text-indigo-800 underline text-[11px] cursor-pointer"
                >
                  انتخاب همه
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(false)}
                  className="text-muted hover:text-rose-600 text-[11px] cursor-pointer"
                >
                  لغو انتخاب
                </button>
              </div>
            </div>
          </div>

          {/* THE STAGING PRODUCTS TABLE */}
          <div className="bg-card rounded-3xl border border-subtle shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-background/80 border-b border-subtle text-muted font-black">
                  <tr>
                    <th className="py-4 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedCount === products.length && products.length > 0}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-subtle cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4">مشخصات کالا و تصویر</th>
                    <th className="py-4 px-4">دسته‌بندی زوپیت</th>
                    <th className="py-4 px-4 text-center">موجودی</th>
                    <th className="py-4 px-4">قیمت در سایت شما</th>
                    <th className="py-4 px-4 text-indigo-700 dark:text-indigo-400">
                      قیمت همکاری برای زوپیت (تومان)
                    </th>
                    <th className="py-4 px-4 text-center">وضعیت تطبیق</th>
                    <th className="py-4 px-4 text-center">سود همکار</th>
                    <th className="py-4 px-4 text-center w-16">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {filteredProducts.map((product) => {
                    const discountPercent =
                      product.originalPrice > 0
                        ? Math.round(
                            ((product.originalPrice - product.wholesalePrice) /
                              product.originalPrice) *
                              100
                          )
                        : 0;

                    return (
                      <React.Fragment key={product.wcId}>
                        <tr
                          className={`hover:bg-background/60 transition-colors ${
                            product.isSelected ? "bg-indigo-50/20 dark:bg-indigo-950/10" : "opacity-60"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={product.isSelected}
                              onChange={() => toggleSelectProduct(product.wcId)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-subtle cursor-pointer"
                            />
                          </td>

                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.mainImage}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover border border-subtle shrink-0 bg-background"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                                }}
                              />
                              <div className="space-y-1 max-w-sm">
                                <h5 className="font-extrabold text-primary line-clamp-1">
                                  {product.name}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-muted">
                                  <span>کد: {product.sku || product.wcId}</span>
                                  {product.hasVariations && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProducts((prev) =>
                                          prev.map((p) =>
                                            p.wcId === product.wcId
                                              ? { ...p, expandedVariations: !p.expandedVariations }
                                              : p
                                          )
                                        );
                                      }}
                                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <span>{product.variations.length} تنوع</span>
                                      {product.expandedVariations ? (
                                        <ChevronUp className="w-3 h-3" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category with Dropdown Selector if unresolved */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <select
                                value={product.primaryCategory}
                                onChange={(e) => handleSetProductCategory(product.wcId, e.target.value)}
                                className={`text-xs font-bold py-1 px-2 rounded-lg border transition-all ${
                                  product.categoryStatus === "UNRESOLVED"
                                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-300"
                                    : "bg-surface border-subtle text-secondary"
                                }`}
                              >
                                {product.categoryStatus === "UNRESOLVED" && (
                                  <option value={product.primaryCategory}>
                                    ⚠️ {product.primaryCategory} (انتخاب کنید...)
                                  </option>
                                )}
                                {availableCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="py-3 px-4 text-center font-bold text-secondary">
                            {product.stock > 0 ? (
                              <span>{product.stock.toLocaleString("fa-IR")} عدد</span>
                            ) : (
                              <span className="text-amber-500 font-bold">ناموجود</span>
                            )}
                          </td>

                          {/* Original WooCommerce Price */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-secondary">
                                {product.originalPrice.toLocaleString("fa-IR")} تومان
                              </span>
                              {product.originalSalePrice > 0 && (
                                <span className="text-[10px] text-muted line-through block">
                                  حراج: {product.originalSalePrice.toLocaleString("fa-IR")}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Wholesale Supply Price (Quick Editing Input) */}
                          <td className="py-3 px-4">
                            <div className="relative w-36">
                              <input
                                type="number"
                                step="1000"
                                value={product.wholesalePrice || ""}
                                onChange={(e) =>
                                  updateProductWholesalePrice(
                                    product.wcId,
                                    Math.max(0, Number(e.target.value))
                                  )
                                }
                                className="w-full pl-7 pr-3 py-1.5 bg-background border-2 border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black text-indigo-900 dark:text-indigo-200 focus:outline-none focus:border-indigo-600 text-left"
                              />
                              <span className="text-[10px] text-muted absolute left-2 top-2">
                                ت
                              </span>
                            </div>
                          </td>

                          {/* Match Status Badge */}
                          <td className="py-3 px-4 text-center">
                            {product.isExisting ? (
                              <span className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-500/20">
                                <span>موجود در کاتالوگ</span>
                              </span>
                            ) : product.categoryStatus === "UNRESOLVED" ? (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20">
                                <span>نیازمند دسته‌بندی</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                <span>جدید - آماده ارسال</span>
                              </span>
                            )}
                          </td>

                          {/* Competitive Rating / Margin Badge */}
                          <td className="py-3 px-4 text-center">
                            {discountPercent >= 20 ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-500/20">
                                <span>+{discountPercent}٪</span>
                                <span>🔥 پرفروش</span>
                              </span>
                            ) : discountPercent >= 10 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black border border-amber-500/20">
                                <span>+{discountPercent}٪</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full text-[10px] font-black border border-rose-500/20">
                                <span>+{discountPercent}٪</span>
                              </span>
                            )}
                          </td>

                          {/* Delete Action */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeProductFromStaging(product.wcId)}
                              className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                              title="حذف از لیست موقت"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Variations Rows */}
                        {product.hasVariations && product.expandedVariations && (
                          <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40">
                            <td colSpan={9} className="p-4 pr-14 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-300 mb-2">
                                <Layers className="w-4 h-4" />
                                <span>تنوع‌ها و قیمت‌های متغیر این کالا:</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {product.variations.map((v) => {
                                  const vDiscount =
                                    v.originalPrice > 0
                                      ? Math.round(
                                          ((v.originalPrice - v.wholesalePrice) /
                                            v.originalPrice) *
                                            100
                                        )
                                      : discountPercent;

                                  return (
                                    <div
                                      key={v.id}
                                      className="p-3 bg-white dark:bg-card rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-2xs space-y-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-primary truncate max-w-[160px]">
                                          {v.name}
                                        </span>
                                        <span className="text-[10px] text-muted">
                                          موجودی: {v.stock}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-muted">
                                          قیمت سایت: {v.originalPrice.toLocaleString("fa-IR")}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="number"
                                            step="1000"
                                            value={v.wholesalePrice || ""}
                                            onChange={(e) =>
                                              updateVariationWholesalePrice(
                                                product.wcId,
                                                v.id,
                                                Math.max(0, Number(e.target.value))
                                              )
                                            }
                                            className="w-24 px-2 py-1 bg-background border border-indigo-300 rounded-lg text-xs font-black text-indigo-900 dark:text-indigo-200 text-left"
                                          />
                                          <span className="text-[10px] text-emerald-600 font-bold">
                                            +{vDiscount}٪
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center text-muted space-y-2">
                <Package className="w-10 h-10 mx-auto text-subtle" />
                <p className="text-sm font-bold">هیچ محصولی با فیلتر فعلی یافت نشد.</p>
              </div>
            )}
          </div>

          {/* STICKY BOTTOM CONFIRMATION BAR */}
          <div className="sticky bottom-4 z-20 bg-card/95 backdrop-blur-md p-4 md:p-5 rounded-3xl border-2 border-indigo-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-right">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black text-primary flex items-center gap-2">
                  <span>آماده ثبت {selectedCount.toLocaleString("fa-IR")} محصول</span>
                  <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    میانگین سود فروشگاه‌ها: {avgMargin}٪
                  </span>
                  <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    وضعیت مقصد: {targetStatus === "PENDING_APPROVAL" ? "در انتظار تایید ادمین" : "پیش‌نویس"}
                  </span>
                </div>
                <p className="text-xs text-muted font-medium mt-0.5">
                  کالاها پس از ارسال وارد صف ارزیابی کیفی زوپیت شده و بعد از تایید ادمین منتشر می‌شوند.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 sm:w-auto px-4 py-3 bg-surface hover:bg-subtle text-secondary rounded-2xl text-xs font-bold transition-all border border-subtle cursor-pointer"
              >
                انصراف و برگشت
              </button>
              <button
                type="button"
                onClick={handleFinalBatchImport}
                disabled={isImporting || selectedCount === 0}
                className="w-2/3 sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>در حال انتقال کالاها به کاتالوگ زوپیت...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>
                      {targetStatus === "PENDING_APPROVAL"
                        ? "ارسال نهایی به صف بررسی ادمین 🚀"
                        : "ذخیره در پیش‌نویس‌های من 📁"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Success Completion View */}
      {currentStep === 3 && (
        <div className="bg-card p-8 md:p-12 rounded-3xl border border-subtle shadow-md text-center max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-primary">
              انتقال محصولات با موفقیت انجام شد! 🎉
            </h3>
            <p className="text-sm text-muted leading-relaxed font-medium">
              تعداد <strong>{importSummary?.count.toLocaleString("fa-IR")} محصول</strong> از وب‌سایت ووکامرسی شما با موفقیت دریافت و در سیستم ثبت گردید.
            </p>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-surface rounded-2xl border border-subtle text-xs">
            <div>
              <span className="text-muted block">محصولات جدید:</span>
              <strong className="text-emerald-600 text-base font-black">
                {importSummary?.createdCount.toLocaleString("fa-IR")}
              </strong>
            </div>
            <div>
              <span className="text-muted block">به‌روزرسانی شده:</span>
              <strong className="text-indigo-600 text-base font-black">
                {importSummary?.updatedCount.toLocaleString("fa-IR")}
              </strong>
            </div>
            <div>
              <span className="text-muted block">وضعیت ثبت:</span>
              <strong className="text-primary text-xs font-black">
                {importSummary?.targetStatus === "PENDING_APPROVAL"
                  ? "در انتظار تایید"
                  : "پیش‌نویس"}
              </strong>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-right space-y-2">
            <h5 className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>مرحله بعدی چیست؟</span>
            </h5>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
              {importSummary?.targetStatus === "PENDING_APPROVAL"
                ? "کالاهای شما در پیشخوان ادمین زوپیت قرار گرفت. ادمین پس از بررسی کیفیت تصاویر، توضیحات و تعیین مارجین زوپیت، کالاها را تایید و منتشر خواهد کرد تا در دسترس فروشگاه‌ها قرار گیرند."
                : "کالاها در وضعیت «پیش‌نویس» ذخیره شدند. هر زمان که مایل بودید می‌توانید در بخش محصولات، آن‌ها را تکمیل و به صف بررسی ارسال کنید."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onSuccess && (
              <button
                type="button"
                onClick={onSuccess}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                مشاهده محصولات من در پیشخوان
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setProducts([]);
                setFetchPage((p) => p + 1);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-surface hover:bg-subtle text-secondary font-bold text-sm rounded-2xl border border-subtle transition-all cursor-pointer"
            >
              فراخوانی صفحه بعدی از ووکامرس
            </button>
          </div>
        </div>
      )}

      {/* IMPORT HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card w-full max-w-3xl rounded-3xl border border-subtle shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-primary">
                  تاریخچه واردات کالاها (WooCommerce & Excel)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-muted hover:text-primary rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <span className="text-xs font-bold">در حال بارگذاری سوابق...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <Package className="w-8 h-8 mx-auto mb-2 text-subtle" />
                  <span className="text-xs font-bold">هیچ سابقه‌ای از واردات قبلی یافت نشد.</span>
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-surface rounded-2xl border border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-primary">
                          {item.source === "WOOCOMMERCE"
                            ? "ورود از ووکامرس (API)"
                            : item.source === "EXCEL"
                            ? "ورود فایل اکسل"
                            : "ورود دسته‌جمعی"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : item.status === "FAILED"
                              ? "bg-rose-500/15 text-rose-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {item.status === "COMPLETED" ? "موفق" : item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted block">
                        تاریخ: {new Date(item.createdAt).toLocaleDateString("fa-IR")} - ساعت{" "}
                        {new Date(item.createdAt).toLocaleTimeString("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] font-bold">
                      <div className="text-center">
                        <span className="text-muted block text-[10px]">کل موارد</span>
                        <span className="text-primary font-black">{item.totalItems || 0}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-muted block text-[10px]">جدید</span>
                        <span className="text-emerald-600 font-black">{item.createdItems || 0}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-muted block text-[10px]">به‌روزرسانی</span>
                        <span className="text-indigo-600 font-black">{item.updatedItems || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-surface hover:bg-subtle text-secondary font-bold text-xs rounded-xl border border-subtle cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
