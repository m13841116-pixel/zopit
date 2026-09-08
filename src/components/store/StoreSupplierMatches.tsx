import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Package,
  ChevronLeft,
  CheckCircle,
  Store,
  ShieldCheck,
  TrendingUp,
  Building2,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

interface StoreSupplierMatchesProps {
  onNavigateTab?: (tabId: string) => void;
  showNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function StoreSupplierMatches({
  onNavigateTab,
  showNotification
}: StoreSupplierMatchesProps) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/store-manager/supplier-matches?page=1&limit=12', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMatches(data.matches || []);
          setTotal(data.total || 0);

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
              targetType: 'SUPPLIER',
              targetId: 0,
              metadata: { matchCount: data.matches?.length || 0 }
            })
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error fetching supplier matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleSupplierClick = (supplier: any) => {
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
        targetType: 'SUPPLIER',
        targetId: supplier.id,
        metadata: { brandName: supplier.brandName, matchScore: supplier.matchScore }
      })
    }).catch(() => {});

    if (onNavigateTab) {
      onNavigateTab('marketplace');
    } else if (showNotification) {
      showNotification(`نمایش محصولات «${supplier.brandName}» فعال شد.`, 'info');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              تطبیق هوشمند شبکه تامین‌کنندگان (Zopit Matching)
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              تأمین‌کننده‌های مناسب برای فروشگاه شما
            </h2>
            <p className="text-white/80 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
              شناسایی تأمین‌کنندگان برتر و تولیدکنندگان مستقیم که بالاترین درصد همخوانی را با سبد فروش و مشتریان شما دارند.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl shrink-0 text-center">
            <span className="text-[11px] text-white/70 block">تأمین‌کنندگان پیشنهادی</span>
            <span className="text-2xl font-black text-amber-300">{total}</span>
            <span className="text-[10px] text-white/80 block">برند و تولیدکننده</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
          <div className="h-64 bg-card/60 rounded-3xl" />
          <div className="h-64 bg-card/60 rounded-3xl" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border-default rounded-3xl p-8">
          <Building2 className="w-12 h-12 mx-auto text-text-muted mb-3" />
          <h3 className="font-bold text-base text-text-primary">هنوز تأمین‌کننده منطبقی ثبت نشده است.</h3>
          <p className="text-xs text-text-muted mt-1">به زودی تأمین‌کنندگان بیشتری به دسته‌بندی فروشگاه شما اضافه خواهند شد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {matches.map((supplier: any) => (
            <div
              key={supplier.id}
              className="bg-card border border-border-default hover:border-emerald-500/50 rounded-3xl p-6 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0">
                      {supplier.avatarUrl ? (
                        <img src={supplier.avatarUrl} alt={supplier.brandName} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-base text-text-primary group-hover:text-emerald-600 transition-colors">
                          {supplier.brandName}
                        </h4>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                        <span>امتیاز عملکرد: <strong className="text-amber-500">{supplier.performanceScore} از ۱۰۰</strong></span>
                        <span>•</span>
                        <span>{supplier.productCount} کالا</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-2xl shrink-0">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
                      ٪{supplier.matchScore}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">همخوانی</span>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="space-y-1.5 my-3 bg-surface/60 p-3.5 rounded-2xl border border-border-default">
                  <span className="text-[10px] font-bold text-text-muted block mb-1">مزایای همکاری با این تأمین‌کننده:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(supplier.matchReasons || []).map((reason: any) => (
                      <span
                        key={reason.code}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-xl border border-emerald-500/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        {reason.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sample Top Matching Products */}
                {supplier.topProducts && supplier.topProducts.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-text-secondary block mb-2">کالاهای پرفروش و منطبق:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {supplier.topProducts.map((p: any) => (
                        <div key={p.id} className="bg-surface p-2 rounded-xl border border-border-default text-center">
                          <span className="text-xs font-bold text-text-primary block truncate">{p.name}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                            {Number(p.supplierBasePrice || 0).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action CTA */}
              <button
                onClick={() => handleSupplierClick(supplier)}
                className="w-full mt-5 py-3 px-4 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{supplier.actionCTA || 'مشاهده محصولات'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
export default StoreSupplierMatches;
