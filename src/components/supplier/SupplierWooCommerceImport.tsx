import React, { useState, useEffect } from "react";
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
  Flame
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
  mainImage: string;
  images: string[];
  originalPrice: number;
  originalSalePrice: number;
  wholesalePrice: number;
  stock: number;
  shortDescription: string;
  longDescription: string;
  technicalSpecs: { key: string; value: string }[];
  variations: ProductVariation[];
  hasVariations: boolean;
  isSelected: boolean;
  expandedVariations?: boolean;
}

interface SupplierWooCommerceImportProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function SupplierWooCommerceImport({
  onSuccess,
  onCancel,
  showNotification
}: SupplierWooCommerceImportProps) {
  // Step State: 1 = Connect & Config, 2 = Staging & Bulk Pricing, 3 = Completed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [storeUrl, setStoreUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [currencyUnit, setCurrencyUnit] = useState<"toman" | "rial">("toman");
  const [saveCredentials, setSaveCredentials] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Loading States
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [storeMeta, setStoreMeta] = useState<{ storeName: string; totalProducts: number } | null>(null);

  // Staged Products State
  const [products, setProducts] = useState<StagedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(20);

  // Success summary
  const [importSummary, setImportSummary] = useState<{ count: number; message: string } | null>(null);

  // Load saved credentials from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zopit_supplier_wc_creds");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.storeUrl) setStoreUrl(parsed.storeUrl);
        if (parsed.consumerKey) setConsumerKey(parsed.consumerKey);
        if (parsed.consumerSecret) setConsumerSecret(parsed.consumerSecret);
        if (parsed.currencyUnit) setCurrencyUnit(parsed.currencyUnit);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Step 1: Connect & Fetch
  const handleFetchProducts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!storeUrl || !consumerKey || !consumerSecret) {
      toast("لطفاً آدرس سایت و کلیدهای ووکامرس را وارد نمایید.", "error");
      return;
    }

    setIsConnecting(true);
    try {
      const token = localStorage.getItem("token") || "";

      // 1. Test Connection
      const testRes = await fetch("/api/supplier/woocommerce/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ storeUrl, consumerKey, consumerSecret })
      });

      const testData = await testRes.json();
      if (!testRes.ok) {
        toast(testData.error || "خطا در اتصال به ووکامرس", "error");
        setIsConnecting(false);
        return;
      }

      setStoreMeta({
        storeName: testData.storeName || "فروشگاه شما",
        totalProducts: testData.totalProducts || 0
      });

      // 2. Fetch Products
      const fetchRes = await fetch("/api/supplier/woocommerce/fetch-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          storeUrl,
          consumerKey,
          consumerSecret,
          perPage: 100,
          currencyUnit
        })
      });

      const fetchData = await fetchRes.json();
      if (!fetchRes.ok) {
        toast(fetchData.error || "خطا در دریافت لیست محصولات", "error");
        setIsConnecting(false);
        return;
      }

      // Save credentials if checked
      if (saveCredentials) {
        try {
          localStorage.setItem(
            "zopit_supplier_wc_creds",
            JSON.stringify({ storeUrl, consumerKey, consumerSecret, currencyUnit })
          );
        } catch {}
      }

      setProducts(fetchData.products || []);
      setCurrentStep(2);
      toast(
        `تعداد ${fetchData.products?.length || 0} محصول با موفقیت از ${testData.storeName || "سایت شما"} فراخوانی شد.`,
        "success"
      );
    } catch (err: any) {
      toast("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  // Bulk Discount Application
  const applyBulkDiscount = (percent: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (!prod.isSelected) return prod;
        const basePrice = prod.originalSalePrice > 0 ? prod.originalSalePrice : prod.originalPrice;
        const newWholesale = Math.round((basePrice * (1 - percent / 100)) / 1000) * 1000;

        const updatedVariations = prod.variations.map((v) => {
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
    toast(`تخفیف عمده ${percent}٪ روی تمام کالاهای انتخاب‌شده اعمال شد.`, "info");
  };

  // Rounding Prices to 1,000 Tomans
  const handleRoundPrices = () => {
    setProducts((prev) =>
      prev.map((prod) => ({
        ...prod,
        wholesalePrice: Math.round(prod.wholesalePrice / 1000) * 1000,
        variations: prod.variations.map((v) => ({
          ...v,
          wholesalePrice: Math.round(v.wholesalePrice / 1000) * 1000
        }))
      }))
    );
    toast("قیمت‌های عمده به نزدیک‌ترین ۱,۰۰۰ تومان رند شدند.", "info");
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

    setIsImporting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/woocommerce/import-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ products: selectedProducts })
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "خطا در انتقال محصولات", "error");
        setIsImporting(false);
        return;
      }

      setImportSummary({
        count: data.count || selectedProducts.length,
        message: data.message || "انتقال با موفقیت انجام شد."
      });
      setCurrentStep(3);

      if (showNotification) {
        showNotification(
          `تعداد ${data.count || selectedProducts.length} محصول با موفقیت به بانک کالای زوپیت اضافه شد.`,
          "success"
        );
      }
    } catch (err: any) {
      toast("خطای ارتباط با سرور هنگام ثبت نهایی", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Filter Categories
  const categoriesList = Array.from(
    new Set(products.map((p) => p.primaryCategory).filter(Boolean))
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.primaryCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCount = products.filter((p) => p.isSelected).length;

  // Average Margin of Selected Products
  const avgMargin = (() => {
    const selected = products.filter((p) => p.isSelected && p.originalPrice > 0);
    if (selected.length === 0) return 0;
    const totalMargin = selected.reduce((sum, p) => {
      const margin = ((p.originalPrice - p.wholesalePrice) / p.originalPrice) * 100;
      return sum + Math.max(0, margin);
    }, 0);
    return Math.round(totalMargin / selected.length);
  })();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto" dir="rtl">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border border-subtle shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-primary">
                انتقال خودکار محصولات از سایت ووکامرس (WooCommerce)
              </h2>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                اتصال وب‌سرویس REST API
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 font-medium">
              فراخوانی سریع تمامی کالاها، متغیرها و تصاویر سایت شما به همراه میز کار قیمت‌گذاری هوشمند عمده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* STEP 1: WooCommerce Connection Form & Instruction */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card p-6 md:p-8 rounded-3xl border border-subtle shadow-sm space-y-6">
              <div className="border-b border-subtle pb-4">
                <h3 className="text-base font-extrabold text-primary flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <span>اطلاعات اتصال به سایت ووکامرس شما</span>
                </h3>
                <p className="text-xs text-muted mt-1">
                  آدرس وب‌سایت و کلیدهای دسترسی را وارد کنید تا کالاها در عرض چند ثانیه فراخوانی شوند.
                </p>
              </div>

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
                    مثال: <code>https://yourdomain.com</code> یا <code>https://shop.ir</code>
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
                        className={`py-2 text-xs font-black rounded-xl transition-all ${
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
                        className={`py-2 text-xs font-black rounded-xl transition-all ${
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
                        checked={saveCredentials}
                        onChange={(e) => setSaveCredentials(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-subtle"
                      />
                      <span>ذخیره کلیدها برای فراخوانی‌های بعدی</span>
                    </label>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>در حال بررسی اتصال و دریافت کالاها از ووکامرس...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-5 h-5" />
                        <span>اتصال به سایت و دریافت هوشمند محصولات</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Side Guide & Visual Help */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-card p-6 md:p-7 rounded-3xl border-2 border-indigo-200/80 space-y-4">
              <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-300">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black">
                  آموزش ۲ دقیقه‌ای ساخت کلید ووکامرس (بدون افزونه)
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                ووکامرس به صورت پیش‌فرض قابلیت اتصال ایمن دارد و نیازی به نصب هیچ افزونه‌ای نیست:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-white/90 dark:bg-card/90 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">
                    ۱
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-primary block">رفتن به بخش کلیدهای REST API</strong>
                    <span className="text-muted text-[11px] leading-relaxed block">
                      وارد پیشخوان وردپرس شوید: <strong>ووکامرس &gt; پیکربندی (تنظیمات) &gt; برگه پیشرفته (Advanced) &gt; REST API</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/90 dark:bg-card/90 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">
                    ۲
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-primary block">افزودن کلید جدید (Add Key)</strong>
                    <span className="text-muted text-[11px] leading-relaxed block">
                      روی «افزودن کلید» کلیک کنید، دسترسی را روی <strong>«خواندن/نوشتن (Read/Write)»</strong> یا <strong>«خواندن (Read)»</strong> قرار دهید و دکمه تولید کلید را بزنید.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/90 dark:bg-card/90 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3 shadow-2xs">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">
                    ۳
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-primary block">کپی و جایگذاری در فرم بالا</strong>
                    <span className="text-muted text-[11px] leading-relaxed block">
                      دو کد نمایش داده شده (Consumer Key و Consumer Secret) را کپی کرده و در کادرهای روبرو قرار دهید.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 dark:text-amber-300 font-medium leading-relaxed">
                  <strong>امنیت کامل:</strong> کلیه اطلاعات ارتباطی رمزنگاری شده و صرفاً برای خواندن اطلاعات کاتالوگ فروشگاه شما استفاده می‌گردد.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Product Staging Desk & Bulk Quick Pricing */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* COMPETITIVE MOTIVATIONAL BANNER (ترغیب تامین‌کننده به قیمت رقابتی و فروش حداکثری) */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 md:p-7 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -ml-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/40 px-3 py-1 rounded-full text-amber-300 text-xs font-black">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>راز فروش ۵ تا ۱۰ برابری در پلتفرم زوپیت</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  قیمت عمده رقابتی‌تر = انتخاب توسط صدها فروشگاه آنلاین فعال!
                </h3>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                  مدیران فروشگاه‌های زوپیت روزانه کالاهایی را برای صفحه اصلی سایت، تبلیغات اینستاگرام و کمپین‌های ترب خود انتخاب می‌کنند که <strong>بین ۲۰٪ تا ۳۵٪ حاشیه سود</strong> داشته باشند. هر چقدر قیمت همکاری منصفانه‌تر باشد، کاتالوگ شما سریع‌تر منفجر خواهد شد!
                </p>
              </div>

              {/* Stats pill */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[200px] shrink-0 space-y-1">
                <span className="text-[11px] text-slate-300 font-bold block">
                  میانگین حاشیه سود فعلی شما
                </span>
                <div className="text-2xl font-black text-amber-300">
                  {avgMargin > 0 ? `${avgMargin}٪` : "۲۰٪"}
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                    avgMargin >= 20
                      ? "bg-emerald-500/30 text-emerald-200"
                      : "bg-amber-500/30 text-amber-200"
                  }`}
                >
                  {avgMargin >= 20 ? "🔥 بسیار جذاب برای فروشگاه‌ها" : "✨ قابل قبول"}
                </span>
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
                    ابزارهای قیمت‌گذاری سریع دسته‌جمعی (Quick Bulk Pricing)
                  </h4>
                  <p className="text-[11px] text-muted">
                    تنظیم درصدی قیمت عمده برای تمام یا بخشی از محصولات با یک کلیک
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
                  ۲۵٪ (فروش ویژه 🔥)
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
                  className="px-3 py-1.5 bg-slate-100 dark:bg-surface hover:bg-subtle text-secondary rounded-xl text-xs font-bold transition-all border border-subtle flex items-center gap-1 cursor-pointer"
                  title="گرد کردن تمامی مبالغ به ۱۰۰۰ تومان"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>رند کردن (۱,۰۰۰ تومان)</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در بین کالاهای فراخوانی‌شده..."
                    className="w-full pl-9 pr-4 py-2 bg-background border border-subtle rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                </div>

                {categoriesList.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="py-2 px-3 bg-background border border-subtle rounded-xl text-xs font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">همه دسته‌بندی‌ها ({products.length})</option>
                    {categoriesList.map((cat) => (
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
                  {selectedCount.toLocaleString("fa-IR")} از {products.length.toLocaleString("fa-IR")} محصول انتخاب شده
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
                    <th className="py-4 px-4">مشخصات و تصویر کالا</th>
                    <th className="py-4 px-4">دسته‌بندی</th>
                    <th className="py-4 px-4 text-center">موجودی</th>
                    <th className="py-4 px-4">قیمت در سایت شما</th>
                    <th className="py-4 px-4 text-indigo-700 dark:text-indigo-400">
                      قیمت عمده برای زوپیت (تومان)
                    </th>
                    <th className="py-4 px-4 text-center">سود و جذابیت فروشگاه</th>
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
                                      <span>{product.variations.length} تنوع محصول</span>
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

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="bg-surface text-secondary px-2.5 py-1 rounded-lg text-[11px] font-bold border border-subtle">
                              {product.primaryCategory}
                            </span>
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

                          {/* Competitive Rating / Margin Badge */}
                          <td className="py-3 px-4 text-center">
                            {discountPercent >= 20 ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-500/20">
                                <span>+{discountPercent}٪ سود</span>
                                <span>🔥 پرفروش</span>
                              </span>
                            ) : discountPercent >= 10 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black border border-amber-500/20">
                                <span>+{discountPercent}٪ سود</span>
                                <span>خوب</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full text-[10px] font-black border border-rose-500/20">
                                <span>+{discountPercent}٪ سود</span>
                                <span>حاشیه کم</span>
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
                            <td colSpan={8} className="p-4 pr-14 space-y-2">
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
                  <span>آماده انتقال {selectedCount.toLocaleString("fa-IR")} محصول تایید شده</span>
                  <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    میانگین سود فروشگاه‌ها: {avgMargin}٪
                  </span>
                </div>
                <p className="text-xs text-muted font-medium mt-0.5">
                  پس از تایید، محصولات بلافاصله در بانک کالای تامین‌کننده شما ثبت شده و در دسترس فروشگاه‌ها قرار می‌گیرند.
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
                    <span>تایید نهایی و انتقال به فروشگاه‌های زوپیت 🚀</span>
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
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-primary">
              انتقال محصولات با موفقیت کامل انجام شد! 🎉
            </h3>
            <p className="text-sm text-muted leading-relaxed font-medium">
              تعداد <strong>{importSummary?.count.toLocaleString("fa-IR")} محصول</strong> از وب‌سایت ووکامرسی شما به کاتالوگ زوپیت منتقل گردید و هم‌اکنون آماده انتخاب و فروش توسط صدها فروشگاه آنلاین فعال است.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-right space-y-2">
            <h5 className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>مرحله بعدی چیست؟</span>
            </h5>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
              محصولات شما در بخش «محصولات من» قابل مشاهده و ویرایش مجدد هستند. هر زمان که سفارشی برای این کالاها ثبت شود، بلافاصله در پیشخوان تامین‌کننده شما قرار گرفته و با پیامک به شما اطلاع‌رسانی می‌گردد.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onSuccess && (
              <button
                type="button"
                onClick={onSuccess}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                مشاهده محصولات من در کاتالوگ
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setProducts([]);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-surface hover:bg-subtle text-secondary font-bold text-sm rounded-2xl border border-subtle transition-all cursor-pointer"
            >
              انتقال محصولات بیشتر از ووکامرس
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
