import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Gift, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  ShoppingCart, 
  Percent, 
  BarChart3, 
  Clock, 
  ChevronLeft, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Flame, 
  Compass, 
  Eye, 
  Plus, 
  Settings2,
  Calendar,
  Layers,
  Info,
  Check
} from 'lucide-react';
import StoreRecommendationsHub from './StoreRecommendationsHub';
import SmartActionCenter from './SmartActionCenter';

interface StoreGrowthProfitCenterProps {
  user: any;
  onNavigateTab: (tabId: string) => void;
  onOpenProductModal?: (product: any) => void;
}

export const StoreGrowthProfitCenter: React.FC<StoreGrowthProfitCenterProps> = ({
  user,
  onNavigateTab,
  onOpenProductModal
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProductTab, setActiveProductTab] = useState<'topSelling' | 'topProfitable' | 'lowPerforming'>('topSelling');
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [customTargetInput, setCustomTargetInput] = useState<string>('');
  const [savingTarget, setSavingTarget] = useState<boolean>(false);
  const [showRecsHub, setShowRecsHub] = useState<boolean>(false);

  const fetchGrowthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/store-manager/growth', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('خطا در دریافت اطلاعات مرکز رشد و سودآوری');
      }

      const result = await res.json();
      setData(result);
      if (result.targetProgress?.periodTarget) {
        setCustomTargetInput(result.targetProgress.periodTarget.toString());
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطای غیرمنتظره در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customTargetInput.replace(/[^\d]/g, ''), 10);
    if (isNaN(val) || val <= 0) {
      alert('لطفاً مبلغ معتبری برای تارگت ماهانه وارد کنید.');
      return;
    }

    setSavingTarget(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/store-manager/target', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ monthlyTarget: val })
      });

      if (res.ok) {
        setShowTargetModal(false);
        fetchGrowthData();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'خطا در ذخیره تارگت');
      }
    } catch (err: any) {
      alert('خطا در ارتباط با سرور');
    } finally {
      setSavingTarget(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 animate-pulse text-slate-300">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 bg-slate-800 rounded-xl w-64"></div>
          <div className="h-8 bg-slate-800 rounded-xl w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-800/80 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-44 bg-slate-800/60 rounded-3xl mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800/60 rounded-3xl"></div>
          <div className="h-64 bg-slate-800/60 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">خطا در بارگذاری مرکز رشد</h3>
        <p className="text-sm text-slate-400 mb-6">{error || 'داده‌ای یافت نشد'}</p>
        <button
          onClick={fetchGrowthData}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </button>
      </div>
    );
  }

  const { profitOverview, targetProgress, storeHealth, topProducts, growthOpportunities } = data;

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* 1. TOP HEADER & PROFIT OVERVIEW BANNER */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  مرکز رشد و سودآوری فروشگاه
                </h2>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  حساب سود مستقل فروشگاه
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                محاسبه شفاف و قطعی سود خالص دریافتی شما از فروش کالاها به مشتریان نهایی
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
              <button
                onClick={fetchGrowthData}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 hover:text-white"
                title="به‌روزرسانی لحظه‌ای"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowTargetModal(true)}
                className="px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Settings2 className="w-4 h-4" />
                تنظیم تارگت فروش
              </button>
            </div>
          </div>

          {/* 4 CORE KPI METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* Today Sales */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span>فروش امروز</span>
                <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <ShoppingCart className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white tracking-tight">
                  {(profitOverview.todaySales || 0).toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-400">تومان</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/60">
                <span>{profitOverview.todayOrdersCount || 0} سفارش امروز</span>
                {profitOverview.salesDailyChangePercent !== 0 && (
                  <span className={`font-bold flex items-center gap-0.5 ${profitOverview.salesDailyChangePercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {profitOverview.salesDailyChangePercent > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(profitOverview.salesDailyChangePercent)}٪ vs دیروز
                  </span>
                )}
              </div>
            </div>

            {/* Today Profit */}
            <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-5 hover:border-emerald-500/40 transition relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span className="text-emerald-400 font-extrabold">سود خالص شما (امروز)</span>
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  {(profitOverview.todayProfit || 0).toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-400">تومان</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/60">
                <span>سود دیروز: {(profitOverview.yesterdayProfit || 0).toLocaleString('fa-IR')} ت</span>
                {profitOverview.profitDailyChangePercent !== 0 && (
                  <span className={`font-bold flex items-center gap-0.5 ${profitOverview.profitDailyChangePercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {profitOverview.profitDailyChangePercent > 0 ? '+' : ''}
                    {profitOverview.profitDailyChangePercent}٪
                  </span>
                )}
              </div>
            </div>

            {/* Month Profit */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span>سود این دوره (۳۰ روزه)</span>
                <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white tracking-tight">
                  {(profitOverview.monthProfit || 0).toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-400">تومان</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/60">
                <span>حاشیه سود میانگین: {profitOverview.profitMarginRate}٪</span>
                <span className="text-slate-300 font-bold">{profitOverview.monthOrdersCount} سفارش</span>
              </div>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span>میانگین ارزش هر سفارش</span>
                <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                  <Percent className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white tracking-tight">
                  {(profitOverview.averageOrderValue || 0).toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-400">تومان</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/60">
                <span>{profitOverview.activeCatalogProducts} کالا در کاتالوگ</span>
                <span className="text-indigo-400 font-bold">{profitOverview.soldProductsCount} کالای فعال با فروش</span>
              </div>
            </div>
          </div>

          {/* 7-Day Performance Sparkline / Bar Overview */}
          {profitOverview.last7DaysTrend && profitOverview.last7DaysTrend.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  روند فروش و سود در ۷ روز گذشته
                </span>
                <span>گردش روزانه فروشگاه</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {profitOverview.last7DaysTrend.map((day: any, idx: number) => {
                  const maxSales = Math.max(1, ...profitOverview.last7DaysTrend.map((d: any) => d.sales));
                  const heightPercent = Math.max(15, Math.min(100, Math.round((day.sales / maxSales) * 100)));
                  return (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center flex flex-col justify-between hover:border-slate-700 transition">
                      <span className="text-[10px] text-slate-400 font-bold">{day.dayName}</span>
                      <div className="my-2 h-14 flex items-end justify-center">
                        <div 
                          className="w-4/5 bg-gradient-to-t from-indigo-600 to-emerald-400 rounded-t-md transition-all duration-500"
                          style={{ height: `${heightPercent}%` }}
                          title={`${day.sales.toLocaleString('fa-IR')} تومان فروش | ${day.profit.toLocaleString('fa-IR')} تومان سود`}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-200">
                        {day.profit > 0 ? `${(day.profit / 1000).toLocaleString('fa-IR')}ک` : '۰'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. TARGET PROGRESS & SUBSCRIPTION REWARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Target Progress Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  تارگت رشد و فروش دوره ۳۰ روزه
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${targetProgress.statusColor}`}>
                    {targetProgress.statusLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  تارگت پیشنهادی بر مبنای روزانه {targetProgress.dailyTarget.toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTargetModal(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 self-end sm:self-auto"
            >
              <span>تغییر هدف دوره</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar & Amounts */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">
                عملکرد ثبت‌شده: <strong className="text-white font-black text-sm">{targetProgress.currentPerformance.toLocaleString('fa-IR')}</strong> تومان
              </span>
              <span className="text-slate-400">
                هدف کل دوره: <strong className="text-indigo-300 font-black text-sm">{targetProgress.periodTarget.toLocaleString('fa-IR')}</strong> تومان
              </span>
            </div>

            <div className="w-full bg-slate-800/80 rounded-full h-4 p-0.5 border border-slate-700/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700 relative"
                style={{ width: `${Math.min(100, targetProgress.progressPercentage)}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-emerald-400">
                {targetProgress.progressPercentage}٪ تکمیل شده
              </span>
              <span>
                {targetProgress.remainingAmount > 0 ? (
                  <>مبلغ باقیمانده تا هدف: <strong className="text-amber-400 font-bold">{targetProgress.remainingAmount.toLocaleString('fa-IR')}</strong> تومان</>
                ) : (
                  <span className="text-emerald-400 font-bold">هدف با موفقیت محقق شده است!</span>
                )}
              </span>
            </div>
          </div>

          {/* Run Rate & Remaining Days Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">زمان باقیمانده دوره</span>
                <span className="text-xs font-black text-slate-200">
                  {targetProgress.daysRemaining} روز تا پایان ارزیابی دوره
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">سرعت فروش روزانه موردنیاز</span>
                <span className="text-xs font-black text-slate-200">
                  {targetProgress.remainingAmount > 0 
                    ? `${targetProgress.dailyRequiredRunRate.toLocaleString('fa-IR')} تومان در روز`
                    : 'تارگت کامل شد'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Reward Card */}
        <div className={`rounded-3xl p-6 md:p-7 shadow-sm border flex flex-col justify-between ${
          targetProgress.rewardEligibility?.eligible
            ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30 text-emerald-100'
            : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Gift className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                targetProgress.rewardEligibility?.eligible
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
              }`}>
                {targetProgress.rewardEligibility?.eligible ? 'واجد شرایط پاداش 🎉' : 'پاداش تمدید رایگان'}
              </span>
            </div>

            <h4 className="text-base font-black text-white mb-2">
              {targetProgress.rewardEligibility?.title || 'پاداش دستیابی به تارگت'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">
              {targetProgress.rewardEligibility?.description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${targetProgress.rewardEligibility?.eligible ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>پاداش به طور خودکار در پایان دوره اعمال می‌گردد.</span>
            </div>
            <button
              onClick={() => onNavigateTab('pro_account')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span>مشاهده وضعیت پلن و اشتراک</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. SMART ACTION CENTER (PROMPT 12) */}
      <SmartActionCenter
        onNavigateTab={(tab) => {
          if (tab === 'catalog' || tab === 'my_catalog') onNavigateTab('my_catalog');
          else if (tab === 'recommendations') setShowRecsHub(true);
          else onNavigateTab(tab);
        }}
        onOpenProductModal={onOpenProductModal}
      />

      {/* 4. GROWTH OPPORTUNITIES (ACTIONABLE CARDS) */}
      {growthOpportunities && growthOpportunities.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-white">
                  فرصت‌های رشد و اقدامات پیشنهادی
                </h3>
                <p className="text-xs text-slate-400">
                  اقدامات اثربخش بر اساس تحلیل لحظه‌ای کاتالوگ و تقاضای بازار
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {growthOpportunities.map((opp: any) => (
              <div
                key={opp.id}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${opp.badgeColor || 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>
                      {opp.badge || 'فرصت'}
                    </span>
                    {opp.count !== undefined && opp.count > 0 && (
                      <span className="text-[11px] font-black text-slate-300">
                        {opp.count} مورد
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white mb-2 group-hover:text-indigo-300 transition">
                    {opp.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {opp.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (opp.actionType === 'NAVIGATE_MARKETPLACE') {
                      onNavigateTab('marketplace');
                    } else if (opp.actionType === 'NAVIGATE_CATALOG') {
                      onNavigateTab('my_catalog');
                    } else {
                      setShowRecsHub(true);
                    }
                  }}
                  className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-500/20 group-hover:border-indigo-500/40"
                >
                  <span>{opp.actionLabel}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. STORE HEALTH & TOP PRODUCTS (TWO UNEQUAL COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Products Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-white">عملکرد کالاهای فروشگاه</h3>
                <p className="text-xs text-slate-400">تفکیک پرفروش‌ترین، پرسودترین و کالاهای راکد</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 text-xs font-bold">
              <button
                onClick={() => setActiveProductTab('topSelling')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeProductTab === 'topSelling'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                پرفروش‌ترین‌ها
              </button>
              <button
                onClick={() => setActiveProductTab('topProfitable')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeProductTab === 'topProfitable'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                پرسودترین‌ها
              </button>
              <button
                onClick={() => setActiveProductTab('lowPerforming')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeProductTab === 'lowPerforming'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                کالاهای راکد
              </button>
            </div>
          </div>

          {/* Product List */}
          {(() => {
            const list = topProducts[activeProductTab] || [];
            if (list.length === 0) {
              return (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  داده‌ای در این دسته‌بندی برای فروشگاه شما ثبت نشده است.
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {list.map((prod: any, idx: number) => (
                  <div
                    key={prod.productId || idx}
                    className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white line-clamp-1 mb-1">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>دسته‌بندی: {prod.categoryName}</span>
                          <span>•</span>
                          <span>موجودی انبار: {prod.inventory ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      {activeProductTab === 'topSelling' && (
                        <div className="text-left">
                          <span className="text-xs font-black text-emerald-400 block">
                            {prod.unitsSold} عدد فروخته‌شده
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {prod.totalRevenue.toLocaleString('fa-IR')} ت فروش
                          </span>
                        </div>
                      )}

                      {activeProductTab === 'topProfitable' && (
                        <div className="text-left">
                          <span className="text-xs font-black text-emerald-400 block">
                            +{prod.totalProfit.toLocaleString('fa-IR')} ت سود
                          </span>
                          <span className="text-[10px] text-slate-400">
                            حاشیه سود: {prod.profitMargin}٪
                          </span>
                        </div>
                      )}

                      {activeProductTab === 'lowPerforming' && (
                        <div className="text-left">
                          <span className="text-[11px] font-bold text-amber-400 block">
                            بدون فروش اخیر
                          </span>
                          <span className="text-[10px] text-slate-400">
                            موجودی انبار: {prod.inventory}
                          </span>
                        </div>
                      )}

                      {onOpenProductModal && (
                        <button
                          onClick={() => onOpenProductModal(prod)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700"
                          title="مشاهده جزئیات محصول"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Compact Store Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">سلامت عملیاتی فروشگاه</h3>
                  <p className="text-xs text-slate-400">پایش شاخص‌های کلیدی کسب‌وکار</p>
                </div>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                storeHealth.overallStatus === 'EXCELLENT'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : storeHealth.overallStatus === 'GOOD'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {storeHealth.overallLabel}
              </span>
            </div>

            {/* Health Signals */}
            <div className="space-y-3.5">
              {/* Catalog Diversity */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  storeHealth.signals.catalogSize.status === 'GOOD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                    <span className="text-slate-200">تنوع کاتالوگ فروشگاه</span>
                    <span className="text-slate-400">{storeHealth.signals.catalogSize.metric}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {storeHealth.signals.catalogSize.message}
                  </p>
                </div>
              </div>

              {/* Order Velocity */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  storeHealth.signals.orderVelocity.status === 'GOOD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                    <span className="text-slate-200">گردش سفارشات هفتگی</span>
                    <span className="text-slate-400">{storeHealth.signals.orderVelocity.metric}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {storeHealth.signals.orderVelocity.message}
                  </p>
                </div>
              </div>

              {/* Inventory Availability */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  storeHealth.signals.inventoryAvailability.status === 'GOOD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                    <span className="text-slate-200">موجودی انبار تأمین‌کنندگان</span>
                    <span className="text-slate-400">{storeHealth.signals.inventoryAvailability.metric}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {storeHealth.signals.inventoryAvailability.message}
                  </p>
                </div>
              </div>

              {/* Fulfillment Quality */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  storeHealth.signals.fulfillmentRate.status === 'GOOD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                    <span className="text-slate-200">کیفیت تکمیل و ارسال</span>
                    <span className="text-slate-400">{storeHealth.signals.fulfillmentRate.metric}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {storeHealth.signals.fulfillmentRate.message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800 mt-5">
            <button
              onClick={() => setShowRecsHub(!showRecsHub)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-primary-default hover:from-indigo-500 hover:to-primary-hover text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{showRecsHub ? 'بستن پیشنهادات هوشمند' : 'مشاهده پیشنهادات هوشمند رشد کاتالوگ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. EMBEDDED SMART RECOMMENDATIONS HUB (IF EXPANDED) */}
      {showRecsHub && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">پیشنهادات هوشمند منطبق با فروشگاه شما</h3>
                <p className="text-xs text-slate-400">موتور یادگیرنده هوش مصنوعی منطبق با رفتار و دسته محصولات شما</p>
              </div>
            </div>
            <button
              onClick={() => setShowRecsHub(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-xl"
            >
              بستن پنل
            </button>
          </div>

          <StoreRecommendationsHub
            onOpenProductModal={onOpenProductModal}
            onNavigateMarketplace={() => onNavigateTab('marketplace')}
          />
        </div>
      )}

      {/* 6. TARGET CONFIGURATION MODAL */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-right" dir="rtl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Target className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-white">تنظیم تارگت فروش دوره ۳۰ روزه</h3>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  هدف فروش موردنظر برای دوره جاری (تومان):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100000"
                    min="1000000"
                    max="1000000000"
                    value={customTargetInput}
                    onChange={(e) => setCustomTargetInput(e.target.value)}
                    placeholder="مثال: ۱۵۰۰۰۰۰۰"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                  <span className="absolute left-3.5 top-3.5 text-xs text-slate-400">تومان</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  پیش‌فرض سیستم بر اساس روزانه ۵۰۰,۰۰۰ تومان (معادل ۱۵,۰۰۰,۰۰۰ تومان در ماه) است.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                {[10000000, 15000000, 25000000, 50000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomTargetInput(val.toString())}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 rounded-xl border border-slate-700 transition"
                  >
                    {(val / 1000000).toLocaleString('fa-IR')} میلیون
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {savingTarget ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>ذخیره تارگت</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
