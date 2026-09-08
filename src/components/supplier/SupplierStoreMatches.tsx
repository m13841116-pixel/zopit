import React, { useState, useEffect } from 'react';
import {
  Store,
  Sparkles,
  ChevronLeft,
  Filter,
  CheckCircle,
  Tag,
  Package,
  TrendingUp,
  MapPin,
  Globe,
  RefreshCw,
  ExternalLink,
  Award
} from 'lucide-react';

interface SupplierStoreMatchesProps {
  onNavigateTab?: (tabId: string) => void;
  showNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function SupplierStoreMatches({
  onNavigateTab,
  showNotification
}: SupplierStoreMatchesProps) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [evaluatedProduct, setEvaluatedProduct] = useState<any>(null);

  const fetchMatches = async (currentPage = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      let url = `/api/supplier/matches?page=${currentPage}&limit=9`;
      if (selectedCategory !== 'all') {
        url += `&categoryId=${selectedCategory}`;
      }

      const res = await fetch(url, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMatches(data.matches || []);
          setTotal(data.total || 0);
          setEvaluatedProduct(data.evaluatedProduct || null);

          // Track Impression Event
          fetch('/api/matching/track', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              eventType: 'match_impression',
              targetType: 'STORE',
              targetId: 0,
              metadata: { matchCount: data.matches?.length || 0 }
            })
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error fetching store matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(page);
  }, [page, selectedCategory]);

  const handleMatchClick = async (store: any) => {
    try {
      const token = localStorage.getItem('token') || '';
      fetch('/api/matching/track', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventType: 'match_click',
          targetType: 'STORE',
          targetId: store.id,
          metadata: { storeName: store.storeName, matchScore: store.matchScore }
        })
      }).catch(() => {});

      if (showNotification) {
        showNotification(`فرصت همکاری با «${store.storeName}» آماده بررسی است.`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-teal-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold mb-2 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              موتور هوشمند تطبیق زوپیت (Zopit Matching Engine)
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              فروشگاه‌های مناسب برای محصولات شما
            </h2>
            <p className="text-white/80 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
              تحلیل هوشمند بازار و معرفی آنلاین‌شاپ‌ها و فروشگاه‌هایی که بیشترین همخوانی را با محصولات و حوزه قیمتی کالاهای شما دارند.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl shrink-0 text-center">
            <span className="text-[11px] text-white/70 block">تعداد پیشنهادهای منطبق</span>
            <span className="text-2xl font-black text-amber-300">{total}</span>
            <span className="text-[10px] text-white/80 block">فروشگاه فعال</span>
          </div>
        </div>
      </div>

      {/* Evaluated Product Highlight */}
      {evaluatedProduct && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-indigo-700 dark:text-indigo-300 block">بررسی بر اساس محصول مبنا:</span>
              <span className="font-extrabold text-sm text-text-primary">{evaluatedProduct.name}</span>
            </div>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-card px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
            اولویت کالا لحاظ شد
          </span>
        </div>
      )}

      {/* Matches Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          <div className="h-56 bg-card/60 rounded-3xl" />
          <div className="h-56 bg-card/60 rounded-3xl" />
          <div className="h-56 bg-card/60 rounded-3xl" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border-default rounded-3xl p-8">
          <Store className="w-12 h-12 mx-auto text-text-muted mb-3" />
          <h3 className="font-bold text-base text-text-primary">هنوز فروشگاه منطبقی در این دسته‌بندی یافت نشد.</h3>
          <p className="text-xs text-text-muted mt-1">با ثبت محصولات جدید یا تکمیل مشخصات کالاها، فرصت‌های همکاری بیشتری ثبت می‌شود.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {matches.map((store: any) => (
            <div
              key={store.id}
              className="bg-card border border-border-default hover:border-indigo-500/50 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Score & Store Name Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {store.avatarUrl ? (
                        <img src={store.avatarUrl} alt={store.storeName} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Store className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-text-primary group-hover:text-indigo-600 transition-colors">
                        {store.storeName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                        <span>{store.fieldOfActivity}</span>
                        {store.province && <span>• {store.province}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      ٪{store.matchScore}
                    </span>
                    <span className="text-[10px] text-text-muted">تناسب</span>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="space-y-1.5 my-3 bg-surface/60 p-3 rounded-2xl border border-border-default/60">
                  <span className="text-[10px] font-bold text-text-muted block mb-1">دلایل پیشنهاد Zopit:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(store.matchReasons || []).map((reason: any) => (
                      <span
                        key={reason.code}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {reason.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Relevant Product Info */}
                {store.relevantProduct && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface p-2.5 rounded-xl border border-border-default">
                    <Package className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">محصول پیشنهادی: <strong className="text-text-primary">{store.relevantProduct.name}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleMatchClick(store)}
                className="w-full mt-4 py-2.5 px-4 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{store.actionCTA || 'مشاهده فرصت'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
export default SupplierStoreMatches;
