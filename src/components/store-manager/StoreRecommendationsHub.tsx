import React, { useState, useEffect } from "react";
import { toast } from "../GlobalToast";
import { getValidProductImageUrl } from "../../utils/productUtils";
import {
  Sparkles,
  TrendingUp,
  Flame,
  Clock,
  Layers,
  Percent,
  Plus,
  Check,
  Eye,
  Info,
  ChevronRight,
  ChevronLeft,
  Filter,
  Package,
  Star,
  CheckCircle2,
  Share2,
  RefreshCw,
  Zap,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import MarketingKitModal from "./MarketingKitModal";
import { DigikalaProductModal } from "../DigikalaProductModal";

interface RecommendationItem {
  id: number;
  name: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  finalPrice: number;
  inventory: number;
  category: { id: number; name: string } | null;
  imageUrl: string;
  images: Array<{ id?: number; url: string }>;
  supplierInfo: {
    name: string;
    username: string;
    province: string;
    city: string;
    performanceScore: number;
  } | null;
  isImported: boolean;
  score: number;
  reasonCodes: string[];
  primaryReason: string;
  recommendationType: string;
  platformDemand: {
    totalOrders: number;
    totalImports: number;
  };
}

interface StoreRecommendationsHubProps {
  onProductAdded?: (productId: number) => void;
  onOpenProductModal?: (product: any) => void;
  onNavigateMarketplace?: () => void;
  compact?: boolean;
}

const TABS = [
  { id: "for_you", label: "پیشنهاد اختصاصی", icon: Sparkles, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "best_sellers", label: "پرفروش‌ترین‌ها", icon: Flame, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { id: "new_arrivals", label: "محصولات جدید", icon: Clock, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "similar", label: "مشابه کاتالوگ شما", icon: Layers, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { id: "opportunities", label: "فرصت‌های سودآور", icon: Percent, color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" }
];

export function StoreRecommendationsHub({ onProductAdded, compact = false }: StoreRecommendationsHubProps) {
  const [activeTab, setActiveTab] = useState<string>("for_you");
  const [products, setProducts] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [excludeImported, setExcludeImported] = useState<boolean>(false);
  const [meta, setMeta] = useState<any>(null);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [marketingProduct, setMarketingProduct] = useState<any | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const query = new URLSearchParams({
        type: activeTab,
        limit: compact ? "6" : "12",
        excludeImported: excludeImported ? "true" : "false"
      });

      const res = await fetch(`/api/store-manager/recommendations?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
        setMeta(data.meta || null);

        // Record impression analytics in background
        if (data.items && data.items.length > 0) {
          data.items.slice(0, 4).forEach((item: RecommendationItem) => {
            recordAnalyticsEvent("recommendation_impression", item.id, item.score);
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const recordAnalyticsEvent = async (eventType: string, productId: number, score: number = 0) => {
    try {
      const token = localStorage.getItem("token") || "";
      await fetch("/api/store-manager/recommendations/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventType,
          productId,
          recommendationType: activeTab,
          score
        })
      });
    } catch (e) {
      // silent background analytics
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [activeTab, excludeImported]);

  const handleAddToCatalog = async (product: RecommendationItem) => {
    if (product.isImported) {
      toast.info("این محصول پیش‌تر به کاتالوگ فروشگاه شما اضافه شده است.");
      return;
    }

    setAddingId(product.id);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/my-catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("محصول با موفقیت به کاتالوگ فروشگاه افزوده شد.");
        setProducts(prev =>
          prev.map(p => (p.id === product.id ? { ...p, isImported: true } : p))
        );
        recordAnalyticsEvent("recommendation_import", product.id, product.score);
        if (onProductAdded) onProductAdded(product.id);
      } else {
        toast.error(data.error || "خطا در افزودن محصول به کاتالوگ.");
      }
    } catch (err) {
      toast.error("خطا در برقراری ارتباط با سرور.");
    } finally {
      setAddingId(null);
    }
  };

  const handleProductClick = (product: RecommendationItem) => {
    recordAnalyticsEvent("recommendation_click", product.id, product.score);
    setSelectedProduct(product);
  };

  return (
    <div className="bg-surface rounded-3xl border border-subtle p-6 shadow-sm mb-8 animate-fade-in relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-default/5 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-2">
              <span>مرکز هوشمند پیشنهاد و کشف کالا</span>
              <span className="text-[11px] bg-primary-default/10 text-primary-default px-2.5 py-0.5 rounded-full font-extrabold border border-primary-default/20">
                هوشمند
              </span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">
              محصولات برگزیده متناسب با دسته‌بندی، سوابق فروش و تحلیل تقاضای بازار برای فروشگاه شما
            </p>
          </div>
        </div>

        {/* Exclude Imported Toggle */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-background/80 px-3.5 py-2 rounded-2xl border border-subtle">
          <label className="text-xs font-bold text-text-secondary cursor-pointer select-none flex items-center gap-2">
            <input
              type="checkbox"
              checked={excludeImported}
              onChange={e => setExcludeImported(e.target.checked)}
              className="rounded border-subtle text-primary-default focus:ring-primary-default/30 w-4 h-4 cursor-pointer"
            />
            <span>عدم نمایش کالاهای اضافه شده</span>
          </label>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar border-b border-subtle relative z-10">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-primary-default text-white shadow-md shadow-primary-default/20 scale-[1.02]"
                  : "bg-background text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 border border-subtle"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-background rounded-2xl p-4 border border-subtle animate-pulse">
              <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl mb-3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-background/50 rounded-2xl border border-dashed border-subtle">
          <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-sm font-bold text-text-secondary">در حال حاضر محصول جدیدی در این دسته‌بندی یافت نشد.</p>
          <p className="text-xs text-text-muted mt-1">پیشنهادات روزانه بر اساس فعالیت فروشگاه شما بروزرسانی می‌شوند.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-10">
          {products.map(product => {
            const imgUrl = getValidProductImageUrl(product);
            const isImported = product.isImported;

            return (
              <div
                key={product.id}
                className="bg-background rounded-2xl border border-subtle hover:border-primary-default/40 p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-3.5">
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Reason Tag Badge */}
                    <div className="absolute top-2.5 right-2.5 max-w-[85%] z-10">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-900/85 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-sm truncate">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{product.reasonCodes[0] === 'CATEGORY_MATCH' ? 'همخوانی با حوزه شما' : product.primaryReason}</span>
                      </span>
                    </div>

                    {/* Stock status indicator */}
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-black/70 backdrop-blur-md text-white">
                        <Package className="w-2.5 h-2.5 text-emerald-400" />
                        <span>موجودی: {product.inventory}</span>
                      </span>
                    </div>

                    {/* Quick Preview Hover Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                      <button
                        onClick={() => handleProductClick(product)}
                        className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 shadow-md transition-all scale-95 group-hover:scale-100 cursor-pointer"
                        title="مشاهده جزئیات"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setMarketingProduct(product)}
                        className="p-2.5 bg-primary-default text-white rounded-xl hover:bg-primary-hover shadow-md transition-all scale-95 group-hover:scale-100 cursor-pointer"
                        title="کیت بازاریابی و تیزر"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Category & Title */}
                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-text-muted bg-surface px-2 py-0.5 rounded-md border border-subtle">
                      {product.category?.name || "عمومی"}
                    </span>
                    <h3
                      onClick={() => handleProductClick(product)}
                      className="text-xs md:text-sm font-black text-text-primary mt-1.5 line-clamp-2 hover:text-primary-default cursor-pointer leading-snug"
                    >
                      {product.name}
                    </h3>
                  </div>

                  {/* Supplier Info (Safe public details only) */}
                  <div className="text-[11px] text-text-secondary flex items-center justify-between mb-3 font-medium">
                    <span className="truncate">{product.supplierInfo?.name || "تأمین‌کننده زوپیت"}</span>
                    {product.supplierInfo?.performanceScore && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        رتبه {product.supplierInfo.performanceScore}٪
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Price & Action Button */}
                <div className="pt-3 border-t border-subtle mt-1">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] text-text-muted font-bold">قیمت خرید شما:</span>
                    <div className="text-left">
                      <span className="text-sm font-black text-primary-default">
                        {product.finalPrice ? Number(product.finalPrice).toLocaleString("fa-IR") : "—"}
                      </span>
                      <span className="text-[10px] text-text-muted mr-1 font-bold">تومان</span>
                    </div>
                  </div>

                  {isImported ? (
                    <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>در کاتالوگ شما موجود است</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCatalog(product)}
                      disabled={addingId === product.id}
                      className="w-full py-2.5 bg-primary-default hover:bg-primary-hover active:scale-98 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {addingId === product.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>در حال افزودن...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن به کاتالوگ فروشگاه</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <DigikalaProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCatalog={() => handleAddToCatalog(selectedProduct)}
          isInCatalog={selectedProduct.isImported}
        />
      )}

      {/* Marketing Kit Modal */}
      {marketingProduct && (
        <MarketingKitModal
          product={marketingProduct}
          onClose={() => setMarketingProduct(null)}
        />
      )}
    </div>
  );
}

export default StoreRecommendationsHub;
