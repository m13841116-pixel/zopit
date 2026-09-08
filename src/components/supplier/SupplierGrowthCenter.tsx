import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Store,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  Wallet,
  Scale,
  PlusCircle,
  Edit3,
  Layers,
  Award,
  ChevronLeft,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface SupplierGrowthCenterProps {
  user: any;
  onNavigateTab: (tabId: string) => void;
  showNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function SupplierGrowthCenter({
  user,
  onNavigateTab,
  showNotification
}: SupplierGrowthCenterProps) {
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any>(null);
  const [salesPeriod, setSalesPeriod] = useState<'today' | '7days' | '30days'>('7days');
  const [salesTrend, setSalesTrend] = useState<any>(null);
  const [loadingSalesTrend, setLoadingSalesTrend] = useState(false);
  const [productPerf, setProductPerf] = useState<any>(null);
  const [activeProductTab, setActiveProductTab] = useState<'bestSelling' | 'highestDemand' | 'rising' | 'lowPerforming'>('bestSelling');

  const fetchGrowthDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { Authorization: `Bearer ${token}` };

      const [growthRes, productPerfRes] = await Promise.all([
        fetch('/api/supplier/growth', { credentials: 'include', headers }),
        fetch('/api/supplier/products/performance', { credentials: 'include', headers })
      ]);

      if (growthRes.ok) {
        const gData = await growthRes.json();
        if (gData.success) {
          setGrowthData(gData);
        }
      }

      if (productPerfRes.ok) {
        const pData = await productPerfRes.json();
        if (pData.success) {
          setProductPerf(pData);
        }
      }
    } catch (err) {
      console.error('Error loading supplier growth center:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTrend = async (period: 'today' | '7days' | '30days') => {
    setLoadingSalesTrend(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/supplier/performance/sales?period=${period}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSalesTrend(data);
        }
      }
    } catch (err) {
      console.error('Error fetching sales trend:', err);
    } finally {
      setLoadingSalesTrend(false);
    }
  };

  useEffect(() => {
    fetchGrowthDashboard();
    fetchSalesTrend(salesPeriod);
  }, []);

  const handlePeriodChange = (period: 'today' | '7days' | '30days') => {
    setSalesPeriod(period);
    fetchSalesTrend(period);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-28 bg-card/60 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-card/60 rounded-2xl" />
          <div className="h-32 bg-card/60 rounded-2xl" />
          <div className="h-32 bg-card/60 rounded-2xl" />
          <div className="h-32 bg-card/60 rounded-2xl" />
        </div>
        <div className="h-64 bg-card/60 rounded-3xl" />
      </div>
    );
  }

  const exec = growthData?.executiveSummary || {};
  const milestones = growthData?.milestones || {};
  const actions = growthData?.actions || [];
  const inventoryHealth = growthData?.inventoryHealth || {};
  const catalogQuality = growthData?.catalogQuality || {};
  const wallet = growthData?.wallet || {};
  const supplier = growthData?.supplier || {};

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      
      {/* 1. Header & Executive Summary */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-extrabold flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                مرکز رشد و توسعه تامین‌کننده
              </span>
              {supplier.status === 'ACTIVE' && (
                <span className="bg-emerald-400/30 text-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  حساب رسمی فعال
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              راهنمای هوشمند فروش و عملکرد «{supplier.brandName || user?.brandName || 'تامین‌کننده'}»
            </h2>
            <p className="text-white/80 text-sm mt-1 max-w-xl leading-relaxed">
              تحلیل لحظه‌ای وضعیت فروش، استقبال فروشگاه‌ها، سلامت موجودی و پیشنهادهای هوشمند زوپیت برای افزایش درآمد شما.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div className="text-center px-2">
              <span className="text-xs text-white/70 block">امتیاز عملکرد شما</span>
              <span className="text-3xl font-black text-amber-300">{supplier.performanceScore || 100}</span>
              <span className="text-[10px] text-white/80 block">از ۱۰۰</span>
            </div>
            <div className="h-10 w-[1px] bg-white/20" />
            <div className="text-center px-2">
              <span className="text-xs text-white/70 block">سطح فعلی</span>
              <span className="text-sm font-extrabold text-white mt-1 block">{milestones.currentLevel || 'جدید'}</span>
              <span className="text-[10px] text-emerald-200 block">{exec.totalUnitsSold || 0} عدد فروخته شده</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Today Sales */}
        <div className="bg-card border border-border-default p-4 md:p-5 rounded-2xl shadow-xs hover:border-primary-default transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-secondary">فروش امروز</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg md:text-2xl font-black text-text-primary">
            {(exec.todaySales || 0).toLocaleString('fa-IR')} <span className="text-xs font-normal text-text-muted">تومان</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            فروش این ماه: {(exec.thisMonthSales || 0).toLocaleString('fa-IR')} تومان
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-card border border-border-default p-4 md:p-5 rounded-2xl shadow-xs hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-secondary">سفارشات نیازمند اقدام</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg md:text-2xl font-black text-amber-600">
            {(exec.awaitingShipmentCount + exec.newOrdersCount) || 0} <span className="text-xs font-normal text-text-muted">سفارش</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-muted mt-2">
            <span>{exec.newOrdersCount || 0} جدید</span>
            <span>•</span>
            <span>{exec.awaitingShipmentCount || 0} در انتظار ارسال</span>
          </div>
        </div>

        {/* Importing Stores */}
        <div className="bg-card border border-border-default p-4 md:p-5 rounded-2xl shadow-xs hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-secondary">شبکه فروشگاه‌های خریدار</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg md:text-2xl font-black text-text-primary">
            {exec.importingStoresCount || 0} <span className="text-xs font-normal text-text-muted">فروشگاه</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">
            {exec.activeImportingStoresCount || 0} فروشگاه فعال
          </p>
        </div>

        {/* Active Products & Stock */}
        <div className="bg-card border border-border-default p-4 md:p-5 rounded-2xl shadow-xs hover:border-teal-500 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-secondary">محصولات فعال در ویترین</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg md:text-2xl font-black text-text-primary">
            {exec.activeProductsCount || 0} <span className="text-xs font-normal text-text-muted">از {exec.totalProductsCount || 0} کالا</span>
          </div>
          <p className="text-[11px] text-rose-500 mt-2 font-medium">
            {exec.lowStockCount || 0} کالا رو به اتمام
          </p>
        </div>

      </div>

      {/* 3. Milestone Progress Bar & First Sale Targets */}
      <div className="bg-card border border-border-default rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary">مسیر رشد و دستاوردهای تامین‌کننده</h3>
              <p className="text-xs text-text-muted">ارتقای سطح و باز شدن امکانات ویژه‌ی تامین‌کنندگان برتر زوپیت</p>
            </div>
          </div>

          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-500/20">
            سطح فعلی: {milestones.currentLevel || 'جدید'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 my-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-text-secondary">پیشرفت تا هدف بعدی ({milestones.nextLevelTarget} فروش)</span>
            <span className="text-primary-default">{milestones.progressPercent || 0}٪</span>
          </div>
          <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border-default">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${milestones.progressPercent || 0}%` }}
            />
          </div>
        </div>

        {/* Milestone Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {(milestones.levels || []).map((lvl: any) => (
            <div
              key={lvl.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                lvl.isAchieved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                  : 'bg-surface/50 border-border-default text-text-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">{lvl.title}</span>
                {lvl.isAchieved ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border-default" />
                )}
              </div>
              <p className="text-[11px] opacity-80">
                {lvl.isAchieved ? 'محقق شده 🎉' : `${lvl.currentCount} از ${lvl.targetCount} انجام شده`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Smart Action Center ("پیشنهادهای Zopit برای رشد تامین‌کننده") */}
      <div className="bg-card border border-border-default rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary">پیشنهادهای Zopit برای رشد تامین‌کننده</h3>
              <p className="text-xs text-text-muted">اقدامات اولویت‌دار جهت افزایش فروش و ارتقای اعتبار شما در بازار</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-500/10 px-3 py-1 rounded-xl">
            {actions.length} اقدام پیشنهادی
          </span>
        </div>

        {actions.length === 0 ? (
          <div className="text-center py-8 text-text-muted bg-surface/30 rounded-2xl border border-dashed border-border-default">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="font-bold text-sm text-text-primary">عالی است! هیچ اقدام فوری ثبت‌نشده‌ای ندارید.</p>
            <p className="text-xs mt-1">عملکرد تامین‌کننده در وضعیت مطلوب است.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action: any) => (
              <div
                key={action.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  action.priority === 'HIGH'
                    ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500'
                    : 'bg-surface/50 border-border-default hover:border-indigo-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        action.priority === 'HIGH'
                          ? 'bg-amber-500 text-white'
                          : 'bg-indigo-500/10 text-indigo-600'
                      }`}
                    >
                      {action.priority === 'HIGH' ? 'اولویت بالا' : 'پیشنهادی'}
                    </span>
                    <span className="text-[11px] text-text-muted">{action.impactText}</span>
                  </div>
                  <h4 className="font-bold text-sm text-text-primary mb-1">{action.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">{action.description}</p>
                </div>

                <button
                  onClick={() => onNavigateTab(action.targetTab)}
                  className="w-full py-2.5 px-4 bg-primary-default hover:bg-primary-hover text-white rounded-xl font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{action.actionLabel}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Sales Performance Trend Chart */}
      <div className="bg-card border border-border-default rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary">گزارش و روند فروش</h3>
              <p className="text-xs text-text-muted">مقایسه حجم فروش و تعداد سفارشات در بازه‌های زمانی مختلف</p>
            </div>
          </div>

          <div className="flex items-center bg-surface p-1 rounded-2xl border border-border-default">
            <button
              onClick={() => handlePeriodChange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                salesPeriod === 'today'
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              امروز
            </button>
            <button
              onClick={() => handlePeriodChange('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                salesPeriod === '7days'
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              ۷ روز اخیر
            </button>
            <button
              onClick={() => handlePeriodChange('30days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                salesPeriod === '30days'
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              ۳۰ روز اخیر
            </button>
          </div>
        </div>

        {loadingSalesTrend ? (
          <div className="h-64 flex items-center justify-center text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-default" />
          </div>
        ) : salesTrend ? (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-6 bg-surface/50 p-4 rounded-2xl border border-border-default">
              <div className="text-center">
                <span className="text-[11px] text-text-muted block">حجم کل فروش</span>
                <span className="text-sm md:text-base font-extrabold text-emerald-600">
                  {(salesTrend.totalVolume || 0).toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="text-center border-x border-border-default">
                <span className="text-[11px] text-text-muted block">تعداد سفارشات</span>
                <span className="text-sm md:text-base font-extrabold text-text-primary">
                  {salesTrend.totalOrders || 0} سفارش
                </span>
              </div>
              <div className="text-center">
                <span className="text-[11px] text-text-muted block">نرخ لغو</span>
                <span className="text-sm md:text-base font-extrabold text-amber-600">
                  {salesTrend.cancellationRate || 0}٪
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend.chartData || []}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString('fa-IR')} تومان`, 'فروش']}
                    contentStyle={{ borderRadius: '12px', direction: 'rtl', textAlign: 'right' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>

      {/* 6. Top Products & Store Reach Section */}
      <div className="bg-card border border-border-default rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary">عملکرد محصولات و استقبال فروشگاه‌ها</h3>
              <p className="text-xs text-text-muted">بررسی نفوذ کالاها در ویترین فروشگاه‌های زوپیت و میزان فروش</p>
            </div>
          </div>

          <div className="flex items-center bg-surface p-1 rounded-2xl border border-border-default overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveProductTab('bestSelling')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeProductTab === 'bestSelling'
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              پرفروش‌ترین‌ها
            </button>
            <button
              onClick={() => setActiveProductTab('highestDemand')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeProductTab === 'highestDemand'
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              بیشترین افزودن فروشگاه‌ها
            </button>
            <button
              onClick={() => setActiveProductTab('rising')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeProductTab === 'rising'
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              در حال رشد 🚀
            </button>
            <button
              onClick={() => setActiveProductTab('lowPerforming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeProductTab === 'lowPerforming'
                  ? 'bg-primary-default text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              نیازمند توجه
            </button>
          </div>
        </div>

        {/* Product Items List */}
        {(() => {
          const items = productPerf?.[activeProductTab] || [];
          if (items.length === 0) {
            return (
              <div className="text-center py-8 text-text-muted bg-surface/30 rounded-2xl border border-dashed border-border-default">
                <Package className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                <p className="text-xs font-medium">محصولی در این دسته‌بندی یافت نشد.</p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {items.map((prod: any) => (
                <div
                  key={prod.id}
                  className="p-4 bg-surface/50 border border-border-default hover:border-primary-default/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border-default overflow-hidden shrink-0 flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-text-muted" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">{prod.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                        <span>موجودی: {prod.inventory} عدد</span>
                        <span>•</span>
                        <span>{prod.categoryName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border-default">
                    <div className="text-right md:text-left">
                      <span className="text-xs font-extrabold text-indigo-600 block">
                        {prod.importedStoresCount} فروشگاه اضافه کرده‌اند
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium block">
                        {prod.activeStoresCount} فروشگاه فعال | {prod.orderCount} سفارش
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigateTab('products')}
                      className="p-2 bg-card border border-border-default hover:border-primary-default text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>مدیریت</span>
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* 7. Inventory Health & Catalog Completeness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Inventory Health */}
        <div className="bg-card border border-border-default rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-text-primary">سلامت موجودی محصولات</h3>
              <p className="text-xs text-text-muted">شناسایی کالاهای رو به اتمام دارای تقاضای فعال</p>
            </div>
          </div>

          <div className="space-y-3">
            {(inventoryHealth.lowStockItems || []).length === 0 && (inventoryHealth.outOfStockItems || []).length === 0 ? (
              <div className="text-center py-6 text-text-muted bg-surface/30 rounded-2xl">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-text-primary">موجودی تمام محصولات مناسب است.</p>
              </div>
            ) : (
              <>
                {(inventoryHealth.lowStockItems || []).map((item: any) => (
                  <div key={item.id} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-text-primary block">{item.name}</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300">
                        موجودی: {item.inventory} عدد | فعال در {item.storeCount} فروشگاه
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('products')}
                      className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                    >
                      افزایش موجودی
                    </button>
                  </div>
                ))}

                {(inventoryHealth.outOfStockItems || []).map((item: any) => (
                  <div key={item.id} className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-text-primary block">{item.name}</span>
                      <span className="text-[11px] text-rose-700 dark:text-rose-300">
                        ناموجود | اضافه شده توسط {item.storeCount} فروشگاه
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateTab('products')}
                      className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors"
                    >
                      شارژ مجدد
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Catalog Completeness */}
        <div className="bg-card border border-border-default rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-bold">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-text-primary">کیفیت کاتالوگ و مشخصات کالا</h3>
              <p className="text-xs text-text-muted">محصولاتی که نیازمند تکمیل تصویر یا توضیحات هستند</p>
            </div>
          </div>

          <div className="space-y-3">
            {(catalogQuality.incompleteItems || []).length === 0 ? (
              <div className="text-center py-6 text-text-muted bg-surface/30 rounded-2xl">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-text-primary">کیفیت اطلاعات تمام محصولات عالی است.</p>
              </div>
            ) : (
              (catalogQuality.incompleteItems || []).map((item: any) => (
                <div key={item.id} className="p-3 bg-surface border border-border-default rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-text-primary block">{item.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                      {item.missingImage && <span className="text-rose-500">بدون تصویر</span>}
                      {item.missingDesc && <span className="text-amber-500">توضیحات کوتاه</span>}
                      {item.missingSpecs && <span className="text-indigo-500">مشخصات فنی</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('products')}
                    className="px-3 py-1 bg-primary-default text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors"
                  >
                    ویرایش کالا
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
export default SupplierGrowthCenter;
