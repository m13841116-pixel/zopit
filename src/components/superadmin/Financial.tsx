import React, { useState, useEffect, useMemo } from "react";
import { toast } from "../GlobalToast";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  AlertTriangle,
  RefreshCw,
  Truck,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  SlidersHorizontal,
} from "lucide-react";

export interface ExecutiveMetrics {
  todayTransactionProfit: number;
  monthlyTransactionProfit: number;
  transactionRevenue: number;
  subscriptionRevenue: number;
  featuredRevenue: number;
  totalGMV: number;
  totalPlatformRevenue: number;
  totalCreditedSupplierBalances: number;
  supplierAvailableBalances: number;
  supplierPayableBalance: number;
  pendingPayoutAmount: number;
  pendingPayoutCount: number;
  completedPayoutAmount: number;
  completedPayoutCount: number;
  outstandingSupplierLiability: number;
  refundAmount: number;
  refundCount: number;
  reversalAmount: number;
  reversalCount: number;
  shippedCreditMetrics: {
    title: string;
    shippedSupplierGroupsCount: number;
    supplierBalanceCreditsCount: number;
    totalCreditAmount: number;
  };
}

export interface FinancialAnomaly {
  id: string;
  code: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  referenceType: string;
  referenceId: string;
  supplierId?: number;
  supplierName?: string;
  storeId?: number;
  storeName?: string;
  amount: number;
  detectedAt: string;
  suggestedAction: string;
}

export default function Financial() {
  const [activeTab, setActiveTab] = useState<"overview" | "reconciliation" | "stream">("overview");
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [reconciliation, setReconciliation] = useState<{
    summary: { totalAnomalies: number; criticalCount: number; warningCount: number; healthyCount: number };
    anomalies: FinancialAnomaly[];
  } | null>(null);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingStream, setLoadingStream] = useState(true);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{ suppliers: any[]; stores: any[] }>({ suppliers: [], stores: [] });

  // Filter States
  const [datePreset, setDatePreset] = useState<"all" | "today" | "7days" | "30days" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [financialType, setFinancialType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Quick Date Preset handler
  const handleDatePreset = (preset: "all" | "today" | "7days" | "30days") => {
    setDatePreset(preset);
    setPage(1);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7days") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "30days") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  // Fetch Filter Dropdown Options
  useEffect(() => {
    fetch("/api/admin/financial-control/filter-options", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFilterOptions({
            suppliers: data.suppliers || [],
            stores: data.stores || [],
          });
        }
      })
      .catch((err) => console.error("Error loading filter options:", err));
  }, []);

  // Fetch Executive Metrics
  const fetchMetrics = () => {
    setLoadingMetrics(true);
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (selectedSupplier) params.append("supplierId", selectedSupplier);
    if (selectedStore) params.append("storeId", selectedStore);

    fetch(`/api/admin/financial-control/metrics?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data.metrics);
        } else {
          toast(data.error || "خطا در دریافت شاخص‌های مالی", "error");
        }
        setLoadingMetrics(false);
      })
      .catch((err) => {
        console.error("Metrics fetch error:", err);
        setLoadingMetrics(false);
      });
  };

  // Fetch Financial Stream
  const fetchStream = () => {
    setLoadingStream(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "15",
    });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (selectedSupplier) params.append("supplierId", selectedSupplier);
    if (selectedStore) params.append("storeId", selectedStore);
    if (financialType !== "ALL") params.append("financialType", financialType);
    if (statusFilter !== "ALL") params.append("status", statusFilter);
    if (searchQuery.trim()) params.append("search", searchQuery.trim());

    fetch(`/api/admin/financial-control/stream?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStreamData(data);
        }
        setLoadingStream(false);
      })
      .catch((err) => {
        console.error("Stream fetch error:", err);
        setLoadingStream(false);
      });
  };

  // Fetch Reconciliation Audit
  const fetchReconciliation = () => {
    setLoadingReconciliation(true);
    fetch("/api/admin/financial-control/reconciliation", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReconciliation({
            summary: data.summary,
            anomalies: data.anomalies,
          });
        }
        setLoadingReconciliation(false);
      })
      .catch((err) => {
        console.error("Reconciliation fetch error:", err);
        setLoadingReconciliation(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
    fetchStream();
  }, [startDate, endDate, selectedSupplier, selectedStore]);

  useEffect(() => {
    fetchStream();
  }, [page, financialType, statusFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === "reconciliation" && !reconciliation) {
      fetchReconciliation();
    }
  }, [activeTab]);

  const refreshAll = () => {
    fetchMetrics();
    fetchStream();
    if (activeTab === "reconciliation") {
      fetchReconciliation();
    }
    toast("اطلاعات مرکز کنترل مالی به‌روزرسانی شد", "success");
  };

  // Calculation of Revenue Breakdown Percentages
  const revenueBreakdown = useMemo(() => {
    if (!metrics) return { txPct: 0, subPct: 0, featPct: 0 };
    const total = metrics.totalPlatformRevenue || 1;
    return {
      txPct: Math.round((metrics.transactionRevenue / total) * 100) || 0,
      subPct: Math.round((metrics.subscriptionRevenue / total) * 100) || 0,
      featPct: Math.round((metrics.featuredRevenue / total) * 100) || 0,
    };
  }, [metrics]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in text-secondary" dir="rtl">
      {/* ------------------------------------------------------------- */}
      {/* Header & Controls */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-primary">
                مرکز کنترل و نظارت مالی زوپیت (Financial Control Center)
              </h1>
              <p className="text-xs text-muted">
                تفکیک درآمدها، پایش تعهدات تامین‌کنندگان، تطبیق خودکار دفاتر مالی و رهگیری اعتبار پس از ارسال
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-subtle text-primary border border-subtle rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            id="financial-refresh-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
            به‌روزرسانی لحظه‌ای
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Tab Navigation */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-subtle">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
              : "border-transparent text-muted hover:text-primary hover:border-slate-300"
          }`}
          id="tab-financial-overview"
        >
          <Layers className="w-4 h-4" />
          داشبورد شاخص‌ها و تفکیک درآمد
        </button>

        <button
          onClick={() => setActiveTab("reconciliation")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "reconciliation"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
              : "border-transparent text-muted hover:text-primary hover:border-slate-300"
          }`}
          id="tab-financial-reconciliation"
        >
          <ShieldCheck className="w-4 h-4" />
          تطبیق دفاتر و رفع مغایرت (Reconciliation)
          {reconciliation?.summary?.criticalCount ? (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
              {reconciliation.summary.criticalCount}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab("stream")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "stream"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
              : "border-transparent text-muted hover:text-primary hover:border-slate-300"
          }`}
          id="tab-financial-stream"
        >
          <FileText className="w-4 h-4" />
          دفتر کل تراکنش‌ها و ریز اسناد (Stream)
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Global Filter Bar */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            <span className="text-xs font-bold text-muted uppercase tracking-wider">فیلترهای زمانی و مدیریتی</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleDatePreset("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                datePreset === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-subtle text-muted hover:text-primary"
              }`}
            >
              کل دوره
            </button>
            <button
              onClick={() => handleDatePreset("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                datePreset === "today"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-subtle text-muted hover:text-primary"
              }`}
            >
              امروز
            </button>
            <button
              onClick={() => handleDatePreset("7days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                datePreset === "7days"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-subtle text-muted hover:text-primary"
              }`}
            >
              ۷ روز اخیر
            </button>
            <button
              onClick={() => handleDatePreset("30days")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                datePreset === "30days"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-subtle text-muted hover:text-primary"
              }`}
            >
              ۳۰ روز اخیر
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">از تاریخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
              className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2 text-xs text-primary font-mono outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">تا تاریخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
              className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2 text-xs text-primary font-mono outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">تامین‌کننده</label>
            <select
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                setPage(1);
              }}
              className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2 text-xs text-primary outline-none focus:border-indigo-500 transition-all"
            >
              <option value="">همه تامین‌کنندگان</option>
              {filterOptions.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (شناسه: {s.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">فروشگاه همکار</label>
            <select
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value);
                setPage(1);
              }}
              className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2 text-xs text-primary outline-none focus:border-indigo-500 transition-all"
            >
              <option value="">همه فروشگاه‌ها</option>
              {filterOptions.stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} (شناسه: {st.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: EXECUTIVE METRICS & REVENUE SEPARATION */}
      {/* ============================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          {/* 1. Executive Top Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Today Profit */}
            <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">سود معاملات امروز زوپیت</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary font-mono">
                  {(metrics?.todayTransactionProfit || 0).toLocaleString("fa-IR")}
                  <span className="text-xs font-normal text-muted mr-1.5">تومان</span>
                </div>
                <div className="text-[11px] text-muted mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  مارژین خالص پلتفرم از سفارشات ثبت‌شده امروز
                </div>
              </div>
            </div>

            {/* Monthly Profit */}
            <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">سود معاملات ماه جاری</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary font-mono">
                  {(metrics?.monthlyTransactionProfit || 0).toLocaleString("fa-IR")}
                  <span className="text-xs font-normal text-muted mr-1.5">تومان</span>
                </div>
                <div className="text-[11px] text-muted mt-2">
                  سود تجمیعی حاصل از فروش کالا در دوره جاری
                </div>
              </div>
            </div>

            {/* Total GMV */}
            <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">ارزش ناخالص کل کالا (GMV)</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-primary font-mono">
                  {(metrics?.totalGMV || 0).toLocaleString("fa-IR")}
                  <span className="text-xs font-normal text-muted mr-1.5">تومان</span>
                </div>
                <div className="text-[11px] text-muted mt-2">
                  ارزش کل سفارشات پردازش‌شده در مارکت‌پلیس
                </div>
              </div>
            </div>

            {/* Total Platform Revenue */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-200">کل درآمد تجمیعی پلتفرم</span>
                <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">
                  {(metrics?.totalPlatformRevenue || 0).toLocaleString("fa-IR")}
                  <span className="text-xs font-normal text-indigo-200 mr-1.5">تومان</span>
                </div>
                <div className="text-[11px] text-indigo-200 mt-2">
                  معاملات + اشتراک‌های Pro + ویترین ویژه
                </div>
              </div>
            </div>
          </div>

          {/* 2. REVENUE SEPARATION SECTION */}
          <div className="bg-card border border-subtle rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-subtle pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                  <h3 className="text-lg font-black text-primary">
                    تفکیک و شفافیت جریان‌های درآمدی زوپیت (Revenue Separation)
                  </h3>
                </div>
                <p className="text-xs text-muted mt-1">
                  طبق اصول معماری مالی، هر جریان درآمدی به صورت کاملاً تفکیک‌شده و مجزا از منابع حسابداری گزارش می‌شود.
                </p>
              </div>

              {/* Progress Bar of Shares */}
              <div className="min-w-[240px]">
                <div className="flex justify-between text-[11px] font-mono text-muted mb-1.5">
                  <span>معاملات: {revenueBreakdown.txPct}%</span>
                  <span>اشتراک: {revenueBreakdown.subPct}%</span>
                  <span>ویترین: {revenueBreakdown.featPct}%</span>
                </div>
                <div className="h-2.5 w-full bg-subtle rounded-full overflow-hidden flex">
                  <div style={{ width: `${revenueBreakdown.txPct}%` }} className="bg-indigo-600 h-full" title="معاملات"></div>
                  <div style={{ width: `${revenueBreakdown.subPct}%` }} className="bg-emerald-500 h-full" title="اشتراک‌ها"></div>
                  <div style={{ width: `${revenueBreakdown.featPct}%` }} className="bg-amber-500 h-full" title="ویترین و تبلیغات"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stream 1: Transaction Revenue */}
              <div className="bg-background border border-subtle rounded-2xl p-6 relative flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600">
                      TRANSACTION REVENUE
                    </span>
                    <span className="text-xs font-mono font-bold text-muted">{revenueBreakdown.txPct}% از کل</span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">درآمد کارمزد و مارژین معاملات</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    مابه‌التفاوت قیمت فروش به فروشگاه و بهای پایه تامین‌کننده در سفارشات ارسال‌شده.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-subtle">
                  <div className="text-xl font-black text-primary font-mono">
                    {(metrics?.transactionRevenue || 0).toLocaleString("fa-IR")}
                    <span className="text-xs font-normal text-muted mr-1.5">تومان</span>
                  </div>
                </div>
              </div>

              {/* Stream 2: Subscription Revenue */}
              <div className="bg-background border border-subtle rounded-2xl p-6 relative flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600">
                      SUBSCRIPTION REVENUE
                    </span>
                    <span className="text-xs font-mono font-bold text-muted">{revenueBreakdown.subPct}% از کل</span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">درآمد اشتراک پلن‌های ویژه (Pro)</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    حق عضویت ماهیانه و سالیانه حساب‌های کاربری ویژه فروشگاه‌ها و تامین‌کنندگان.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-subtle">
                  <div className="text-xl font-black text-primary font-mono">
                    {(metrics?.subscriptionRevenue || 0).toLocaleString("fa-IR")}
                    <span className="text-xs font-normal text-muted mr-1.5">تومان</span>
                  </div>
                </div>
              </div>

              {/* Stream 3: Featured Placement Revenue */}
              <div className="bg-background border border-subtle rounded-2xl p-6 relative flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600">
                      FEATURED REVENUE
                    </span>
                    <span className="text-xs font-mono font-bold text-muted">{revenueBreakdown.featPct}% از کل</span>
                  </div>
                  <h4 className="text-sm font-bold text-primary mb-1">درآمد ویترین و تبلیغات کالا</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    هزینه پرداختی تامین‌کنندگان بابت ارتقا و قرارگیری کالا در جایگاه‌های ویژه ویترین.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-subtle">
                  <div className="text-xl font-black text-primary font-mono">
                    {(metrics?.featuredRevenue || 0).toLocaleString("fa-IR")}
                    <span className="text-xs font-normal text-muted mr-1.5">تومان</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SHIPPED CREDIT METRIC SECTION ("اعتبار ثبت‌شده پس از ارسال") */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  <Truck className="w-3.5 h-3.5" />
                  قاعده مالی قطعی پلتفرم
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white">
                  اعتبار ثبت‌شده پس از ارسال (Shipped Credit Metric)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تضمین عدم شارژ زودهنگام کیف پول: ثبت بستانکاری تامین‌کننده صرفاً پس از تغییر وضعیت بسته به «ارسال‌شده»
                  در قالب سند حسابداری معتبر (Ledger Event) صورت می‌پذیرد.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-300 mb-1">بسته‌های ارسال‌شده</div>
                  <div className="text-2xl font-black text-white font-mono">
                    {(metrics?.shippedCreditMetrics?.shippedSupplierGroupsCount || 0).toLocaleString("fa-IR")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">بسته سفارش تفکیکی</div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-300 mb-1">اسناد بستانکاری ثبت‌شده</div>
                  <div className="text-2xl font-black text-white font-mono">
                    {(metrics?.shippedCreditMetrics?.supplierBalanceCreditsCount || 0).toLocaleString("fa-IR")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">سند معتبر در دفتر کل</div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-300 mb-1">مبلغ کل اعتبار واریز شده</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {(metrics?.shippedCreditMetrics?.totalCreditAmount || 0).toLocaleString("fa-IR")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">تومان افزوده به کیف پول‌ها</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. SUPPLIER LIABILITY & PAYOUT METRICS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Liability Breakdown */}
            <div className="bg-card border border-subtle rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-subtle pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary text-base">تعهدات مالی پلتفرم به تامین‌کنندگان</h3>
                    <p className="text-xs text-muted">مانده کیف‌پول‌ها و بدهی قابل پرداخت</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-subtle">
                  <span className="text-xs font-medium text-muted">موجودی در دسترس و قابل برداشت فعلی</span>
                  <span className="font-bold font-mono text-primary text-sm">
                    {(metrics?.supplierAvailableBalances || 0).toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-subtle">
                  <span className="text-xs font-medium text-muted">تسویه‌های در حال بررسی و پردازش (Pending Payouts)</span>
                  <span className="font-bold font-mono text-amber-600 text-sm">
                    {(metrics?.pendingPayoutAmount || 0).toLocaleString("fa-IR")} تومان
                    <span className="text-[10px] text-muted mr-1">({metrics?.pendingPayoutCount || 0} درخواست)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
                  <span className="text-xs font-bold text-indigo-900">کل تعهد جاری پرداخت (Outstanding Liability)</span>
                  <span className="font-black font-mono text-indigo-600 text-base">
                    {(metrics?.outstandingSupplierLiability || 0).toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-subtle">
                  <span className="text-xs font-medium text-muted">کل بستانکاری ایجاد شده در طول تاریخ پلتفرم</span>
                  <span className="font-bold font-mono text-primary text-sm">
                    {(metrics?.totalCreditedSupplierBalances || 0).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              </div>
            </div>

            {/* Payouts, Refunds & Reversals Summary */}
            <div className="bg-card border border-subtle rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-subtle pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary text-base">تسویه‌های انجام‌شده و برگشت‌ها</h3>
                    <p className="text-xs text-muted">آمار تسویه‌های موفق پایا و مبالغ عودت</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">تسویه‌های واریزشده موفق (Completed Payouts)</span>
                  </div>
                  <span className="font-black font-mono text-emerald-600 text-sm">
                    {(metrics?.completedPayoutAmount || 0).toLocaleString("fa-IR")} تومان
                    <span className="text-[10px] text-muted mr-1">({metrics?.completedPayoutCount || 0} واریزی)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-subtle">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-medium text-muted">بازپرداخت به مشتریان و عودت وجه (Refunds)</span>
                  </div>
                  <span className="font-bold font-mono text-rose-600 text-sm">
                    {(metrics?.refundAmount || 0).toLocaleString("fa-IR")} تومان
                    <span className="text-[10px] text-muted mr-1">({metrics?.refundCount || 0} مورد)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-subtle">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-medium text-muted">سند‌های تعدیل و معکوس‌سازی حسابداری (Reversals)</span>
                  </div>
                  <span className="font-bold font-mono text-primary text-sm">
                    {(metrics?.reversalAmount || 0).toLocaleString("fa-IR")} تومان
                    <span className="text-[10px] text-muted mr-1">({metrics?.reversalCount || 0} سند)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: FINANCIAL RECONCILIATION & ANOMALY SCANNER */}
      {/* ============================================================= */}
      {activeTab === "reconciliation" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Audit Status Banner */}
          <div className="bg-card border border-subtle rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      (reconciliation?.summary?.criticalCount || 0) > 0
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary">
                      پایش و تطبیق پنج‌گانه مالی زوپیت (5-Way Reconciliation Engine)
                    </h3>
                    <p className="text-xs text-muted">
                      رهگیری پیوسته جریان زنجیره ارزش: سفارشات ← پرداخت‌ها ← انبار ← اعتبارات تامین‌کننده ← تسویه‌ها
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchReconciliation}
                  disabled={loadingReconciliation}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  id="reconcile-scan-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingReconciliation ? "animate-spin" : ""}`} />
                  اسکن و ممیزی مجدد دفاتر
                </button>
              </div>
            </div>

            {/* Reconciliation Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-subtle">
              <div className="p-4 bg-background rounded-2xl border border-subtle">
                <div className="text-xs text-muted mb-1">کل مغایرت‌های یافت‌شده</div>
                <div className="text-2xl font-black text-primary font-mono">
                  {reconciliation?.summary?.totalAnomalies ?? 0}
                </div>
              </div>

              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200">
                <div className="text-xs font-bold text-rose-900 mb-1">مغایرت بحرانی (Critical)</div>
                <div className="text-2xl font-black text-rose-600 font-mono">
                  {reconciliation?.summary?.criticalCount ?? 0}
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200">
                <div className="text-xs font-bold text-amber-900 mb-1">هشدار و تذکر (Warning)</div>
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {reconciliation?.summary?.warningCount ?? 0}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <div className="text-xs font-bold text-emerald-900 mb-1">سلامت تراز مالی</div>
                <div className="text-sm font-black text-emerald-600 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {(reconciliation?.summary?.criticalCount || 0) === 0 ? "تراز کامل و تأییدشده" : "نیازمند رسیدگی"}
                </div>
              </div>
            </div>
          </div>

          {/* Anomaly Records List */}
          <div className="bg-card border border-subtle rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-primary text-base mb-2">گزارش ریز موارد تطبیق مالی</h4>

            {loadingReconciliation ? (
              <div className="py-16 text-center text-muted flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-xs font-medium">در حال اسکن و ممیزی دفاتر مالی و زنجیره تامین...</p>
              </div>
            ) : reconciliation?.anomalies?.length === 0 ? (
              <div className="py-16 text-center text-muted space-y-3 bg-background rounded-2xl border border-subtle">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-primary text-sm">هیچ مغایرتی در دفاتر مالی یافت نشد</h5>
                <p className="text-xs text-muted max-w-md mx-auto">
                  تمامی سفارشات، تغییرات انبار، اعتبارات ارسال و تسویه‌های ثبت‌شده در هماهنگی کامل قرار دارند.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reconciliation?.anomalies?.map((anom) => (
                  <div
                    key={anom.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      anom.severity === "CRITICAL"
                        ? "bg-rose-50/30 border-rose-200"
                        : "bg-amber-50/30 border-amber-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              anom.severity === "CRITICAL"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {anom.severity}
                          </span>
                          <span className="font-mono text-xs text-muted">کد خطا: {anom.code}</span>
                          <span className="text-xs text-muted">
                            مرجع: {anom.referenceType} #{anom.referenceId}
                          </span>
                        </div>
                        <h5 className="font-bold text-primary text-sm">{anom.title}</h5>
                        <p className="text-xs text-muted leading-relaxed">{anom.description}</p>
                      </div>

                      <div className="flex flex-col md:items-end gap-2 shrink-0">
                        {anom.amount > 0 && (
                          <div className="text-sm font-bold font-mono text-primary">
                            مبلغ: {anom.amount.toLocaleString("fa-IR")} تومان
                          </div>
                        )}
                        <div className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                          اقدام پیشنهادی: {anom.suggestedAction}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: UNIFIED FINANCIAL STREAM & LEDGER RECORDS */}
      {/* ============================================================= */}
      {activeTab === "stream" && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub Filters for Stream */}
          <div className="bg-card border border-subtle rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute right-3 top-3 text-muted" />
                <input
                  type="text"
                  placeholder="جستجو در شناسه مرجع، طرف حساب یا شرح سند..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-background border border-subtle rounded-xl pr-9 pl-3 py-2 text-xs text-primary outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <select
                value={financialType}
                onChange={(e) => {
                  setFinancialType(e.target.value);
                  setPage(1);
                }}
                className="bg-background border border-subtle rounded-xl px-3 py-2 text-xs text-primary outline-none focus:border-indigo-500 transition-all"
              >
                <option value="ALL">همه انواع اسناد</option>
                <option value="CREDIT">اعتبار پس از ارسال (Credit)</option>
                <option value="PAYOUT">تسویه حساب (Payout)</option>
                <option value="SUBSCRIPTION">اشتراک Pro</option>
                <option value="FEATURED">ویترین ویژه (Featured)</option>
                <option value="REFUND">بازپرداخت / استرداد</option>
                <option value="ADJUSTMENT">تعدیلات حسابداری</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-background border border-subtle rounded-xl px-3 py-2 text-xs text-primary outline-none focus:border-indigo-500 transition-all"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="COMPLETED">موفق / نهایی (COMPLETED)</option>
                <option value="PENDING">در انتظار (PENDING)</option>
                <option value="FAILED">ناموفق / لغو شده (FAILED)</option>
              </select>
            </div>

            {streamData?.pagination && (
              <span className="text-xs font-mono font-bold text-muted bg-subtle px-3 py-1.5 rounded-lg">
                تعداد کل: {streamData.pagination.total} سند
              </span>
            )}
          </div>

          {/* Table of Ledger Entries */}
          <div className="bg-card border border-subtle rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right min-w-[850px]">
                <thead className="bg-subtle/50 text-muted border-b border-subtle font-bold uppercase">
                  <tr>
                    <th className="px-5 py-4">شناسه / تاریخ</th>
                    <th className="px-5 py-4">دسته‌بندی و نوع سند</th>
                    <th className="px-5 py-4">طرف حساب</th>
                    <th className="px-5 py-4">مرجع سیستم</th>
                    <th className="px-5 py-4">مبلغ (تومان)</th>
                    <th className="px-5 py-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {loadingStream ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
                        در حال بارگذاری ریز اسناد دفتر کل...
                      </td>
                    </tr>
                  ) : streamData?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted">
                        سند مالی با این مشخصات یافت نشد
                      </td>
                    </tr>
                  ) : (
                    streamData?.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-background/80 transition-colors">
                        <td className="px-5 py-4 font-mono text-[11px]">
                          <div className="font-bold text-primary">{item.id}</div>
                          <div className="text-muted text-[10px] mt-0.5">
                            {new Date(item.date).toLocaleString("fa-IR")}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              item.category === "CREDIT"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : item.category === "PAYOUT"
                                ? "bg-indigo-500/10 text-indigo-700"
                                : item.category === "SUBSCRIPTION"
                                ? "bg-purple-500/10 text-purple-700"
                                : item.category === "FEATURED"
                                ? "bg-amber-500/10 text-amber-700"
                                : item.category === "REFUND"
                                ? "bg-rose-500/10 text-rose-700"
                                : "bg-slate-500/10 text-slate-700"
                            }`}
                          >
                            {item.typeLabel}
                          </span>
                          <div className="text-[11px] text-muted mt-1 truncate max-w-[220px]" title={item.description}>
                            {item.description}
                          </div>
                        </td>

                        <td className="px-5 py-4 font-medium text-primary">
                          {item.supplierName && (
                            <div>
                              <span className="text-[10px] text-muted ml-1">تامین‌کننده:</span>
                              {item.supplierName}
                            </div>
                          )}
                          {item.storeName && (
                            <div>
                              <span className="text-[10px] text-muted ml-1">فروشگاه:</span>
                              {item.storeName}
                            </div>
                          )}
                          {!item.supplierName && !item.storeName && <span className="text-muted">-</span>}
                        </td>

                        <td className="px-5 py-4 font-mono text-muted text-[11px]">
                          {item.referenceId || "-"}
                        </td>

                        <td className="px-5 py-4 font-bold font-mono text-primary text-sm">
                          {Math.abs(item.amount).toLocaleString("fa-IR")}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              item.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : item.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {item.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                            {item.status === "PENDING" && <Clock className="w-3 h-3" />}
                            {item.status === "FAILED" && <XCircle className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {streamData?.pagination && streamData.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-subtle flex items-center justify-between bg-subtle/30 mt-auto">
                <div className="text-xs text-muted">
                  نمایش صفحه {page} از {streamData.pagination.totalPages}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 bg-card border border-subtle rounded-xl text-muted hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= streamData.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 bg-card border border-subtle rounded-xl text-muted hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
