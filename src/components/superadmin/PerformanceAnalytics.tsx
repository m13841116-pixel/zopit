import React, { useState, useEffect } from "react";
import { toast } from "../GlobalToast";
import {
  Loader2, TrendingUp, DollarSign, ShoppingBag, Package, Store, Factory,
  Filter, Target, Award, ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2, AlertTriangle, Lightbulb
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export default function PerformanceAnalytics() {
  const [range, setRange] = useState<string>('30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Data states
  const [execData, setExecData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [productData, setProductData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [contributionsData, setContributionsData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'executive' | 'funnels' | 'products' | 'contributions' | 'insights'>('executive');

  useEffect(() => {
    fetchBIAnalytics();
  }, [range]);

  const fetchBIAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };

      let queryStr = `?range=${range}`;
      if (range === 'custom' && customStart && customEnd) {
        queryStr += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const [resExec, resFunnels, resProducts, resRev, resContrib, resInsights] = await Promise.all([
        fetch(`/api/admin/analytics/executive${queryStr}`, { headers }),
        fetch(`/api/admin/analytics/funnels`, { headers }),
        fetch(`/api/admin/analytics/products`, { headers }),
        fetch(`/api/admin/analytics/revenue-breakdown${queryStr}`, { headers }),
        fetch(`/api/admin/analytics/contributions`, { headers }),
        fetch(`/api/admin/analytics/actionable-insights`, { headers })
      ]);

      if (resExec.ok) setExecData((await resExec.json()).metrics);
      if (resFunnels.ok) setFunnelData(await resFunnels.json());
      if (resProducts.ok) setProductData((await resProducts.json()).products || []);
      if (resRev.ok) setRevenueData((await resRev.json()).summary);
      if (resContrib.ok) setContributionsData(await resContrib.json());
      if (resInsights.ok) setInsightsData((await resInsights.json()).insights || []);

    } catch (e) {
      toast('خطا در دریافت اطلاعات هوش تجاری و تحلیل رشد', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomDate = () => {
    if (range === 'custom') {
      fetchBIAnalytics();
    }
  };

  if (loading && !execData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs text-slate-500 font-bold">در حال محاسبه شاخص‌های تحلیلی و هوش تجاری زوپیت...</span>
      </div>
    );
  }

  const m = execData || {};
  const target = m.target || { todayProfit: 0, dailyTarget: 10000000, progressPercentage: 0 };

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            مرکز هوش تجاری و تحلیل رشد زوپیت (Business Intelligence)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پایش دقیق سودآوری، قیف‌های تبدیل، تحلیل درآمدی تفکیک‌شده و هدف‌گذاری روزانه
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'today', label: 'امروز' },
              { id: '7days', label: '۷ روز اخیر' },
              { id: '30days', label: '۳۰ روز اخیر' },
              { id: '90days', label: '۹۰ روز اخیر' },
              { id: 'custom', label: 'سفارشی' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRange(btn.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  range === btn.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-xs p-1 rounded border border-slate-300 dark:border-slate-600"
              />
              <span className="text-xs text-slate-400">تا</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-xs p-1 rounded border border-slate-300 dark:border-slate-600"
              />
              <button
                onClick={handleApplyCustomDate}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2.5 py-1 text-xs font-bold rounded-lg"
              >
                اعمال
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Target Tracker Card (10M Toman/Day Business Target) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-700/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Target className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-xs text-indigo-200 font-bold uppercase tracking-wider">هدف روزانه کسب‌وکار زوپیت</span>
              <h3 className="text-lg font-black text-white mt-0.5">پایش دستیابی به هدف سود روزانه (۱۰ میلیون تومان)</h3>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[11px] text-indigo-300 block">سود زوپیت امروز:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {Number(target.todayProfit || 0).toLocaleString()} <span className="text-xs">تومان</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-indigo-300 block">هدف روزانه:</span>
              <span className="text-xl font-black text-white font-mono">
                {Number(target.dailyTarget || 10000000).toLocaleString()} <span className="text-xs">تومان</span>
              </span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center backdrop-blur-md">
              <span className="text-[10px] text-indigo-200 block">میزان پیشرفت</span>
              <span className="text-xl font-black text-amber-300 font-mono">{target.progressPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-indigo-950/80 rounded-full overflow-hidden p-0.5 border border-indigo-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, target.progressPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-indigo-300 px-1">
            <span>امروز: {Number(target.todayProfit || 0).toLocaleString()} تومان</span>
            <span>پیشرفت: {target.progressPercentage}٪</span>
            <span>هدف: ۱۰,۰۰۰,۰۰۰ تومان</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        {[
          { id: 'executive', label: 'داشبورد اجرایی KPI', icon: TrendingUp },
          { id: 'funnels', label: 'قیف‌های تبدیل (Funnels)', icon: Filter },
          { id: 'products', label: 'تحلیل محصولات', icon: Package },
          { id: 'contributions', label: 'سهم مشارکت تامین/فروشگاه', icon: Award },
          { id: 'insights', label: 'تحلیل‌های هوشمند (Actionable Insights)', icon: Lightbulb }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. EXECUTIVE DASHBOARD TAB */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          {/* Executive Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'تامین‌کنندگان فعال', value: m.activeSuppliers || 0, icon: Factory, color: 'text-indigo-600' },
              { label: 'فروشگاه‌های فعال', value: m.activeStores || 0, icon: Store, color: 'text-emerald-600' },
              { label: 'تعداد کل محصولات', value: m.products || 0, icon: Package, color: 'text-blue-600' },
              { label: 'محصولات تاییدشده', value: m.publishedProducts || 0, icon: CheckCircle2, color: 'text-teal-600' },
              { label: 'تعداد کل سفارشات', value: m.orders || 0, icon: ShoppingBag, color: 'text-purple-600' },
              { label: 'گردش مالی GMV', value: `${(Number(m.gmv || 0) / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-amber-600' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-bold">{card.label}</span>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{card.value}</div>
                </div>
              );
            })}
          </div>

          {/* Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs text-slate-500 font-bold block">سود تراکنشی زوپیت</span>
              <div className="text-xl font-black text-emerald-600 font-mono">
                {Number(m.zopitTransactionProfit || 0).toLocaleString()} <span className="text-xs">تومان</span>
              </div>
              <p className="text-[10px] text-slate-400">سود خالص حاصل از مارجین سفارشات</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs text-slate-500 font-bold block">درآمد حق اشتراک پرو</span>
              <div className="text-xl font-black text-indigo-600 font-mono">
                {Number(m.subscriptionRevenue || 0).toLocaleString()} <span className="text-xs">تومان</span>
              </div>
              <p className="text-[10px] text-slate-400">درآمد حاصل از اشتراک فروشگاه‌ها</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs text-slate-500 font-bold block">درآمد تبلیغات و ویژه‌سازی</span>
              <div className="text-xl font-black text-amber-600 font-mono">
                {Number(m.featuredRevenue || 0).toLocaleString()} <span className="text-xs">تومان</span>
              </div>
              <p className="text-[10px] text-slate-400">درآمد بنرها و جایگاه ویژه محصولات</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs text-slate-500 font-bold block">تسویه‌حساب تامین‌کنندگان</span>
              <div className="text-xl font-black text-slate-700 dark:text-slate-300 font-mono">
                {Number(m.supplierPayouts || 0).toLocaleString()} <span className="text-xs">تومان</span>
              </div>
              <p className="text-[10px] text-slate-400">مجموع مبالغ پرداخت‌شده به تامین‌کنندگان</p>
            </div>
          </div>

          {/* Growth Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold block">رشد روزانه سفارشات</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  {m.dailyGrowth >= 0 ? `+${m.dailyGrowth}٪` : `${m.dailyGrowth}٪`}
                </span>
              </div>
              <div className={`p-3 rounded-xl ${m.dailyGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {m.dailyGrowth >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold block">رشد ماهانه گردش مالی (GMV)</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  {m.monthlyGrowth >= 0 ? `+${m.monthlyGrowth}٪` : `${m.monthlyGrowth}٪`}
                </span>
              </div>
              <div className={`p-3 rounded-xl ${m.monthlyGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {m.monthlyGrowth >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FUNNELS TAB */}
      {activeTab === 'funnels' && funnelData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supplier Funnel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Factory className="w-5 h-5 text-indigo-600" />
              قیف تبدیل تامین‌کنندگان (Supplier Funnel)
            </h3>
            <div className="space-y-3">
              {[
                { label: '۱. ثبت‌نام اولیه', value: funnelData.supplierFunnel?.registered || 0 },
                { label: '۲. تکمیل اطلاعات (Onboarding)', value: funnelData.supplierFunnel?.onboardingCompleted || 0 },
                { label: '۳. ثبت اولین محصول', value: funnelData.supplierFunnel?.firstProduct || 0 },
                { label: '۴. دریافت اولین تاییدیه مدیریت', value: funnelData.supplierFunnel?.firstApproval || 0 },
                { label: '۵. اولیــن واردسازی توسط فروشگاه‌ها', value: funnelData.supplierFunnel?.firstStoreImport || 0 },
                { label: '۶. ثبت اولین فروش عمده/تک', value: funnelData.supplierFunnel?.firstSale || 0 },
                { label: '۷. تامین‌کننده فعال پایدار', value: funnelData.supplierFunnel?.activeSupplier || 0 }
              ].map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{step.label}</span>
                    <span className="font-mono text-indigo-600">{step.value}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (step.value / Math.max(1, funnelData.supplierFunnel?.registered || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Store Funnel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              قیف تبدیل فروشگاه‌ها (Store Funnel)
            </h3>
            <div className="space-y-3">
              {[
                { label: '۱. ثبت‌نام فروشگاه', value: funnelData.storeFunnel?.registered || 0 },
                { label: '۲. خرید اشتراک پرو', value: funnelData.storeFunnel?.subscribed || 0 },
                { label: '۳. اولیــن واردسازی کالا به کاتالوگ', value: funnelData.storeFunnel?.importedProduct || 0 },
                { label: '۴. فعالسازی و همگام‌سازی کالا', value: funnelData.storeFunnel?.activatedProduct || 0 },
                { label: '۵. ثبت اولین سفارش', value: funnelData.storeFunnel?.firstOrder || 0 },
                { label: '۶. سفارشات تکرارشونده و موفق', value: funnelData.storeFunnel?.repeatOrder || 0 }
              ].map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{step.label}</span>
                    <span className="font-mono text-emerald-600">{step.value}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (step.value / Math.max(1, funnelData.storeFunnel?.registered || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT ANALYTICS TAB */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            تحلیل عملکرد محصولات و امتیاز فرصت (Opportunity Score)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">نام محصول</th>
                  <th className="p-3">تامین‌کننده</th>
                  <th className="p-3">بازدید (Impressions)</th>
                  <th className="p-3">کلیک</th>
                  <th className="p-3">واردسازی‌ها</th>
                  <th className="p-3">سفارشات</th>
                  <th className="p-3">نرخ تبدیل</th>
                  <th className="p-3">امتیاز فرصت</th>
                  <th className="p-3">وضعیت موجودی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {productData.map((prod: any) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{prod.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{prod.brandName}</td>
                    <td className="p-3 font-mono">{prod.impressions}</td>
                    <td className="p-3 font-mono">{prod.clicks}</td>
                    <td className="p-3 font-mono font-bold text-indigo-600">{prod.imports}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">{prod.orders}</td>
                    <td className="p-3 font-mono">{prod.conversionRate}٪</td>
                    <td className="p-3">
                      <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md font-mono">
                        {prod.opportunityScore}
                      </span>
                    </td>
                    <td className="p-3">
                      {prod.inventoryStatus === 'IN_STOCK' && <span className="text-emerald-600 font-bold">موجود ({prod.inventoryCount})</span>}
                      {prod.inventoryStatus === 'LOW_STOCK' && <span className="text-amber-600 font-bold">موجودی کم ({prod.inventoryCount})</span>}
                      {prod.inventoryStatus === 'OUT_OF_STOCK' && <span className="text-rose-600 font-bold">اتمام موجودی</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CONTRIBUTIONS TAB */}
      {activeTab === 'contributions' && contributionsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Contributions */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              بیشترین سودآوری برای زوپیت (فروشگاه‌های برتر)
            </h3>
            <div className="space-y-3">
              {contributionsData.storeContributions?.map((store: any, idx: number) => (
                <div key={store.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{idx + 1}. {store.name}</span>
                    <span className="text-[10px] text-slate-400">سفارشات: {store.ordersCount} | کالای فعال: {store.activeProductsCount}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono font-black text-emerald-600 block">{Number(store.profitContribution).toLocaleString()} ت</span>
                    <span className="text-[10px] text-slate-400">{store.repeatActivity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Contributions */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Factory className="w-5 h-5 text-indigo-600" />
              بیشترین گردش مالی (تامین‌کنندگان برتر)
            </h3>
            <div className="space-y-3">
              {contributionsData.supplierContributions?.map((supp: any, idx: number) => (
                <div key={supp.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{idx + 1}. {supp.brandName}</span>
                    <span className="text-[10px] text-slate-400">پوشش فروشگاه‌ها: {supp.storeReach} | امتیاز: {supp.supplierScore}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono font-black text-indigo-600 block">{Number(supp.salesTotal).toLocaleString()} ت</span>
                    <span className="text-[10px] text-slate-400">ارسال شده: {supp.shippedOrdersCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ACTIONABLE INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            تحلیل‌های هوشمند و توصیه‌های اجرایی قطعی (Deterministic Insights)
          </h3>

          <div className="space-y-3">
            {insightsData.map((ins, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
                  ins.type === 'WARNING'
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200'
                    : ins.type === 'OPPORTUNITY'
                    ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200'
                }`}
              >
                {ins.type === 'WARNING' ? <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" /> : <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />}
                <span>{ins.message}</span>
              </div>
            ))}
            {insightsData.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">هیچ هشدار یا مغایرتی ثبت نگردیده است.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
