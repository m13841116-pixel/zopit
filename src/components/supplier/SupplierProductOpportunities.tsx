import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Package,
  Store,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Filter,
  Eye,
  RefreshCw,
  Zap,
  Sliders,
  X,
  Info,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface SupplierProductOpportunitiesProps {
  onNavigateTab?: (tabId: string, params?: any) => void;
  showNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function SupplierProductOpportunities({
  onNavigateTab,
  showNotification
}: SupplierProductOpportunitiesProps) {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [sort, setSort] = useState<string>('score_desc');
  const [selectedProductOpp, setSelectedProductOpp] = useState<any | null>(null);

  const fetchOpportunities = async (currentPage = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      let url = `/api/supplier/product-opportunities?page=${currentPage}&limit=10&sort=${sort}`;
      if (filterType !== 'all') {
        url += `&opportunityType=${filterType}`;
      }

      const res = await fetch(url, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOpportunities(data.opportunities || []);
          setSummary(data.summary || null);
          setTotal(data.total || 0);

          // Track Impression
          fetch('/api/supplier/product-opportunities/track', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              eventType: 'opportunity_impression',
              productId: data.opportunities?.[0]?.productId || 0,
              metadata: { count: data.opportunities?.length || 0 }
            })
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error fetching product opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities(page);
  }, [page, filterType, sort]);

  const handleActionClick = (opp: any) => {
    const token = localStorage.getItem('token') || '';
    fetch('/api/supplier/product-opportunities/track', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        eventType: 'opportunity_action',
        productId: opp.productId,
        metadata: { actionType: opp.primaryOpportunityType }
      })
    }).catch(() => {});

    if (opp.recommendedAction?.targetTab && onNavigateTab) {
      onNavigateTab(opp.recommendedAction.targetTab);
    } else if (showNotification) {
      showNotification(`اقدام پیشنهادشده برای «${opp.productName}» اجرا شد.`, 'info');
    }
  };

  const getDemandPillClass = (code: string) => {
    switch (code) {
      case 'HIGH':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'RISING':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'NEEDS_REVIEW':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              موتور تحلیل فرصت‌های کالا (Product Opportunity Engine)
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              کدام محصولات شما بیشترین فرصت فروش را دارند؟
            </h2>
            <p className="text-white/80 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
              تحلیل هوشمند تقاضای بازار، استقبال آنلاین‌شاپ‌ها، وضعیت موجودی و پتانسیل رشد هر کالا بر اساس داده‌های واقعی Zopit.
            </p>
          </div>

          {/* KPI Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
                <span className="text-[10px] text-white/70 block">میانگین امتیاز فرصت</span>
                <span className="text-2xl font-black text-amber-300">{summary.averageOpportunityScore}</span>
                <span className="text-[10px] text-white/80 block">از ۱۰۰</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
                <span className="text-[10px] text-white/70 block">کالاهای با تقاضای بالا</span>
                <span className="text-2xl font-black text-emerald-400">{summary.highOpportunityCount}</span>
                <span className="text-[10px] text-white/80 block">محصول</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-white/70 block">ریسک کمبود موجودی</span>
                <span className="text-2xl font-black text-rose-400">{summary.lowStockRiskCount}</span>
                <span className="text-[10px] text-white/80 block">کالای حساس</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border-default">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'همه فرصت‌ها' },
            { id: 'HIGH_DEMAND', label: '🔥 تقاضای بالا' },
            { id: 'LOW_STOCK_RISK', label: '⚠️ ریسک موجودی' },
            { id: 'RISING', label: '📈 تقاضای در حال رشد' },
            { id: 'HIGH_STORE_INTEREST', label: '🏪 استقبال آنلاین‌شاپ‌ها' },
            { id: 'LOW_PERFORMANCE', label: '💡 نیازمند بررسی' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setFilterType(t.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === t.id
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'bg-surface text-text-secondary hover:bg-surface-hover border border-border-default'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto">
          <Sliders className="w-4 h-4 text-text-muted" />
          <span className="text-text-muted">مرتب‌سازی:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-surface border border-border-default rounded-xl px-2.5 py-1.5 font-semibold text-text-primary text-xs focus:outline-none"
          >
            <option value="score_desc">امتیاز فرصت (بیشترین)</option>
            <option value="sales_desc">حجم فروش (بیشترین)</option>
            <option value="interest_desc">تعداد آنلاین‌شاپ‌ها</option>
            <option value="stock_asc">موجودی انبار (کمترین)</option>
          </select>
        </div>
      </div>

      {/* Opportunities List Grid */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-40 bg-card/60 rounded-3xl" />
          <div className="h-40 bg-card/60 rounded-3xl" />
          <div className="h-40 bg-card/60 rounded-3xl" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border-default rounded-3xl p-8">
          <Package className="w-12 h-12 mx-auto text-text-muted mb-3" />
          <h3 className="font-bold text-base text-text-primary">محصولی در این فیلتر یافت نشد.</h3>
          <p className="text-xs text-text-muted mt-1">با ثبت محصولات جدید یا افزایش فروش، تحلیل‌های جدیدی ثبت خواهد شد.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp.productId}
              className="bg-card border border-border-default hover:border-indigo-500/40 rounded-3xl p-5 shadow-xs transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 group"
            >
              {/* Left Column: Product Info & Badges */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Product Image */}
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border-default overflow-hidden shrink-0 flex items-center justify-center font-bold text-text-muted">
                  {opp.imageUrl ? (
                    <img src={opp.imageUrl} alt={opp.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-text-muted/60" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-extrabold text-base text-text-primary group-hover:text-indigo-600 transition-colors truncate">
                      {opp.productName}
                    </h4>
                    
                    {/* Demand Level Pill */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getDemandPillClass(opp.demandLevel.code)}`}>
                      {opp.demandLevel.label}
                    </span>

                    {/* Inventory Warning Badge */}
                    {opp.inventoryHealth.isLowStock && (
                      <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        کمبود موجودی ({opp.inventory} عدد)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap mt-1">
                    <span>دسته‌بندی: <strong className="text-text-secondary">{opp.categoryName}</strong></span>
                    <span>•</span>
                    <span>قیمت پایه: <strong className="text-text-secondary">{Number(opp.supplierBasePrice).toLocaleString('fa-IR')} تومان</strong></span>
                    <span>•</span>
                    <span>موجودی: <strong className="text-text-secondary">{opp.inventory} عدد</strong></span>
                  </div>

                  {/* Highlights Bar */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 rounded-xl border border-border-default">
                      <Store className="w-3.5 h-3.5 text-indigo-500" />
                      انتخاب توسط <strong className="text-indigo-600 dark:text-indigo-400">{opp.storeInterest.totalStoreSelections} آنلاین‌شاپ</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 rounded-xl border border-border-default">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      فروش ۳۰ روز اخیر: <strong className="text-emerald-600 dark:text-emerald-400">{opp.salesVelocity.recent30DaysUnits} عدد</strong>
                    </span>
                    {opp.storeMatchOpportunity.matchingStoreCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-surface px-2.5 py-1 rounded-xl border border-border-default">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {opp.storeMatchOpportunity.matchingStoreCount} فروشگاه مناسب
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Opportunity Score & Recommended Action */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-3 w-full lg:w-72 border-t lg:border-t-0 pt-3 lg:pt-0 border-border-default">
                
                {/* Score Badge */}
                <div className="flex items-center justify-between lg:justify-end gap-3 w-full">
                  <span className="text-xs font-bold text-text-muted lg:hidden">امتیاز فرصت فروش:</span>
                  <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-2xl">
                    <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold">امتیاز فرصت:</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {opp.opportunityScore}
                    </span>
                    <span className="text-xs text-indigo-500 font-bold">از ۱۰۰</span>
                  </div>
                </div>

                {/* Recommended Action Box */}
                <div className="bg-surface/80 p-3 rounded-2xl border border-border-default w-full">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary mb-1">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{opp.recommendedAction.title}</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
                    {opp.recommendedAction.description}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-default/60">
                    <button
                      onClick={() => handleActionClick(opp)}
                      className="flex-1 py-1.5 px-3 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold text-[11px] transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{opp.recommendedAction.actionLabel}</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedProductOpp(opp)}
                      className="py-1.5 px-2.5 bg-surface hover:bg-surface-hover text-text-secondary rounded-xl font-bold text-[11px] border border-border-default transition-colors cursor-pointer"
                      title="مشاهده جزئیات کامل تحلیل"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Analysis Modal */}
      {selectedProductOpp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-card border border-border-default rounded-3xl p-6 max-w-xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-primary">تحلیل کامل فرصت فروش</h3>
                  <span className="text-xs text-text-muted">{selectedProductOpp.productName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductOpp(null)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Demand summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-center">
                <span className="text-xs text-indigo-700 dark:text-indigo-300 block">امتیاز کل فرصت</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{selectedProductOpp.opportunityScore}</span>
                <span className="text-[10px] text-indigo-500 block">از ۱۰۰</span>
              </div>
              <div className="bg-surface p-4 rounded-2xl border border-border-default text-center flex flex-col justify-center items-center">
                <span className="text-xs text-text-muted block mb-1">سطح تقاضای بازار</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${getDemandPillClass(selectedProductOpp.demandLevel.code)}`}>
                  {selectedProductOpp.demandLevel.label}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-text-primary">شاخص‌های کلیدی عملکرد کالا:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface p-3 rounded-xl border border-border-default space-y-1">
                  <span className="text-text-muted block">فروش ۳۰ روز اخیر:</span>
                  <span className="font-extrabold text-text-primary text-sm">{selectedProductOpp.salesVelocity.recent30DaysUnits} عدد</span>
                  <span className="text-[10px] text-emerald-600 block">رشد: %{selectedProductOpp.salesVelocity.growthRatePercent}</span>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-border-default space-y-1">
                  <span className="text-text-muted block">استقبال آنلاین‌شاپ‌ها:</span>
                  <span className="font-extrabold text-text-primary text-sm">{selectedProductOpp.storeInterest.totalStoreSelections} فروشگاه</span>
                  <span className="text-[10px] text-text-muted block">انتخاب و افزودن به ویترین</span>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-border-default space-y-1">
                  <span className="text-text-muted block">موجودی انبار:</span>
                  <span className="font-extrabold text-text-primary text-sm">{selectedProductOpp.inventory} عدد</span>
                  <span className={`text-[10px] font-bold block ${selectedProductOpp.inventoryHealth.isLowStock ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedProductOpp.inventoryHealth.isLowStock ? 'نیازمند شارژ سریع' : 'موجودی پایدار'}
                  </span>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-border-default space-y-1">
                  <span className="text-text-muted block">کیفیت محتوا و کاتالوگ:</span>
                  <span className="font-extrabold text-text-primary text-sm">{selectedProductOpp.contentQuality.score} از ۱۰۰</span>
                  <span className="text-[10px] text-text-muted block">بررسی تصویر، عنوان و توضیحات</span>
                </div>
              </div>
            </div>

            {/* Content Suggestions if any */}
            {selectedProductOpp.contentQuality.suggestions && selectedProductOpp.contentQuality.suggestions.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3.5 rounded-2xl space-y-1.5">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  پیشنهاد بهینه‌سازی محتوای کالا:
                </span>
                <ul className="text-xs text-amber-900 dark:text-amber-300 list-disc list-inside space-y-1">
                  {selectedProductOpp.contentQuality.suggestions.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => {
                const opp = selectedProductOpp;
                setSelectedProductOpp(null);
                handleActionClick(opp);
              }}
              className="w-full py-3 px-4 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{selectedProductOpp.recommendedAction.actionLabel}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
export default SupplierProductOpportunities;
