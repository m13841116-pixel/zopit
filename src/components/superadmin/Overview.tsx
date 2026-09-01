import React, { useState, useEffect } from "react";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  Wallet,
  FileText,
  Activity,
  ShieldCheck,
  Check,
  X,
  Store as StoreIcon,
  AlertTriangle,
  Phone,
  MessageSquare,
  Printer,
  Sliders,
  DollarSign,
  Truck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface OverviewProps {
  onNavigateTab?: (tab: string, roleFilter?: string) => void;
}

export default function Overview({ onNavigateTab }: OverviewProps): React.ReactElement {
  const [stats, setStats] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
  const [storePerformances, setStorePerformances] = useState<any[]>([]);
  const [stuckOrders, setStuckOrders] = useState<any[]>([]);
  const [ticketsCount, setTicketsCount] = useState<number>(0);
  const [shippingNeededCount, setShippingNeededCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Layout customization state
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState({
    operational: true,
    stats: true,
    stuckOrders: true,
    pendingActions: true,
    storePerformance: true,
    analytics: true,
  });

  // Pro-forma form state
  const [selectedStore, setSelectedStore] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [showProformaModal, setShowProformaModal] = useState<boolean>(false);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

  useEffect(() => {
    const savedLayout = localStorage.getItem("superadmin_dashboard_layout");
    if (savedLayout) {
      try {
        setLayoutSettings(JSON.parse(savedLayout));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveLayoutSettings = (newSettings: typeof layoutSettings) => {
    setLayoutSettings(newSettings);
    localStorage.setItem("superadmin_dashboard_layout", JSON.stringify(newSettings));
  };

  const safeFetchJson = async (url: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(url, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  const fetchStats = async () => {
    const data = await safeFetchJson("/api/admin/stats");
    if (data) {
      setStats(data);
      if (data.ticketsCount !== undefined) setTicketsCount(data.ticketsCount);
      else setTicketsCount(3);
      if (data.shippingNeededCount !== undefined) setShippingNeededCount(data.shippingNeededCount);
      else setShippingNeededCount(5);
    }
  };

  const fetchStores = async () => {
    const data = await safeFetchJson("/api/admin/stores");
    if (data && Array.isArray(data)) {
      setStores(data);
    } else {
      setStores([]);
    }
  };

  const fetchPendingInvoices = async () => {
    const data = await safeFetchJson("/api/admin/manual-invoices");
    const list = Array.isArray(data) ? data : [];
    setPendingInvoices(
      list.filter((inv: any) => inv.receiptStatus === "PENDING" && inv.status !== "PAID")
    );
  };

  const fetchPendingSettlements = async () => {
    const data = await safeFetchJson("/api/admin/settlements");
    const list = data?.settlements || (Array.isArray(data) ? data : []);
    setPendingSettlements(list.filter((s: any) => s.status === "PENDING"));
  };

  const fetchStorePerformances = async () => {
    const data = await safeFetchJson("/api/admin/stores/performance");
    if (Array.isArray(data) && data.length > 0) {
      setStorePerformances(data);
    } else {
      setStorePerformances([
        { id: 1, name: "فروشگاه نمونه آلفا", orders: 145, revenue: 450000000, status: "ACTIVE", lastActive: "۲ ساعت پیش" },
        { id: 2, name: "فروشگاه مرکزی پارس", orders: 89, revenue: 120000000, status: "ACTIVE", lastActive: "۵ ساعت پیش" },
        { id: 3, name: "کالای دیجیتال نوین", orders: 34, revenue: 56000000, status: "INACTIVE", lastActive: "۳ روز پیش" },
      ]);
    }
  };

  const fetchStuckOrders = async () => {
    const data = await safeFetchJson("/api/admin/orders");
    if (!Array.isArray(data)) return;

    const needingAttention = data.filter((o: any) =>
      ["PENDING_POSTAL_LABEL", "WAITING_SHIPPING_COST", "REQUESTED", "REGISTERED", "PENDING_PAYMENT", "WAITING_FOR_PAYMENT", "PAID", "NEW", "PROCESSING"].includes(o.status)
    );

    const listToDisplay = needingAttention.length > 0 ? needingAttention : data;

    const formatted = listToDisplay.map((o: any) => {
      const supplier = o.items?.[0]?.product?.supplier;
      const supplierName = supplier?.brandName || (supplier?.firstName ? `${supplier.firstName} ${supplier.lastName}` : "نامشخص");
      const supplierPhone = supplier?.mobile || o.store?.mobile || "ثبت نشده";
      const storeName = o.store?.storeName || o.store?.username || o.customerName || "فروشگاه نامشخص";

      let delayText = "تازه‌ثبت";
      if (o.createdAt) {
        const diffMs = Date.now() - new Date(o.createdAt).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) {
          delayText = `${diffDays} روز در انتظار`;
        } else if (diffHours > 0) {
          delayText = `${diffHours} ساعت در انتظار`;
        } else {
          delayText = "کمتر از ۱ ساعت";
        }
      }

      let statusTitle = "در انتظار تایید";
      let statusBg = "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      if (o.status === "PENDING_POSTAL_LABEL") {
        statusTitle = "در انتظار صدور لیبل";
        statusBg = "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-bold";
      } else if (o.status === "WAITING_SHIPPING_COST") {
        statusTitle = "در انتظار برآورد کرایه";
        statusBg = "bg-amber-500/10 text-amber-700 border border-amber-500/20";
      } else if (o.status === "PENDING_PAYMENT" || o.status === "WAITING_FOR_PAYMENT") {
        statusTitle = "در انتظار پرداخت خریدار";
        statusBg = "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      } else if (o.status === "PAID") {
        statusTitle = "پرداخت شده (نیازمند لیبل)";
        statusBg = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20";
      }

      return {
        ...o,
        orderNumber: `ORD-${o.id}`,
        storeName,
        supplierName,
        supplierPhone,
        delay: delayText,
        statusTitle,
        statusBg,
      };
    });

    setStuckOrders(formatted);
  };

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchStores(),
      fetchPendingInvoices(),
      fetchPendingSettlements(),
      fetchStorePerformances(),
      fetchStuckOrders()
    ])
      .catch((err) => console.error("Error fetching admin overview data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateProforma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !invoiceAmount) {
      setFormError("لطفاً فروشگاه و مبلغ پیش‌فاکتور را مشخص کنید.");
      return;
    }
    setFormSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      const res = await fetch("/api/admin/create-proforma", { credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeManagerId: selectedStore,
          totalAmount: parseFloat(invoiceAmount),
          notes: invoiceNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess("پیش‌فاکتور با موفقیت صادر و در بخش تایید فیش‌ها ثبت شد.");
        setInvoiceAmount("");
        setInvoiceNotes("");
        setSelectedStore("");
        fetchStats();
        fetchPendingInvoices();
      } else {
        setFormError(data.error || "خطا در صدور پیش‌فاکتور");
      }
    } catch (err) {
      setFormError("خطای شبکه در ارتباط با سرور");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleInvoiceAction = async (invoiceId: number, action: "approve" | "reject") => {
    setActioningId(`invoice-${invoiceId}`);
    try {
      const res = await fetch(`/api/admin/manual-invoices/${invoiceId}/${action}`, { credentials: "include", method: "POST", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } });
      if (res.ok) {
        fetchPendingInvoices();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleSettlementAction = async (settlementId: number, action: "approve" | "reject") => {
    setActioningId(`settlement-${settlementId}`);
    try {
      const res = await fetch(`/api/admin/settlements/${settlementId}/${action}`, { credentials: "include", method: "POST", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } });
      if (res.ok) {
        fetchPendingSettlements();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const statCards = [
    {
      label: "تامین‌کنندگان فعال",
      value: stats?.suppliers || 0,
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-500/10 border border-blue-500/20",
      tab: "all-users",
      roleFilter: "SUPPLIER",
    },
    {
      label: "فروشگاه‌های همکار",
      value: stats?.stores || 0,
      icon: Store,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-500/10 border border-emerald-500/20",
      tab: "all-users",
      roleFilter: "STORE_MANAGER",
    },
    {
      label: "محصولات سامانه",
      value: stats?.activeProducts || 0,
      icon: Package,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-500/10 border border-amber-500/20",
      tab: "products",
    },
    {
      label: "سفارشات ثبت‌شده",
      value: stats?.orders || 0,
      icon: ShoppingCart,
      iconColor: "text-primary-default",
      iconBg: "bg-primary-default/10 border border-primary-default/20",
      tab: "orders",
    },
    {
      label: "درآمد کل پلتفرم",
      value: (stats?.totalRevenue || 0).toLocaleString() + " تومان",
      icon: Wallet,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-500/10 border border-purple-500/20",
      tab: "financial",
    },
  ];

  const revenueData = [
    { name: "فروردین", درآمد: 4000000 },
    { name: "اردیبهشت", درآمد: 3000000 },
    { name: "خرداد", درآمد: 5000000 },
    { name: "تیر", درآمد: 2780000 },
    { name: "مرداد", درآمد: 8900000 },
    { name: "شهریور", درآمد: 4390000 },
  ];

  const salesData = [
    { name: "شنبه", سفارشات: 120 },
    { name: "یکشنبه", سفارشات: 200 },
    { name: "دوشنبه", سفارشات: 150 },
    { name: "سه شنبه", سفارشات: 280 },
    { name: "چهارشنبه", سفارشات: 210 },
    { name: "پنجشنبه", سفارشات: 390 },
    { name: "جمعه", سفارشات: 450 },
  ];

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-text-muted">
        <div className="w-8 h-8 border-2 border-primary-default border-t-transparent rounded-full animate-spin ml-3"></div>
        در حال بارگذاری اطلاعات پیشخوان...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-black">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>مرکز فرماندهی و نظارت سراسری پلتفرم زوپیت</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 drop-shadow-sm">
              به مرکز فرماندهی خوش آمدید 👋
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed font-medium">
              نمای یکپارچه، ابزارهای کنترلی پیشرفته و پایش لحظه‌ای زنجیره تامین، سفارشات و درخواست‌های فیش و پیش‌فاکتور.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCustomizeModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl text-xs font-bold border border-teal-500/30 transition-all cursor-pointer shadow-sm backdrop-blur-md"
            >
              <Sliders className="w-4 h-4 text-teal-400" />
              شخصی‌سازی پیشخوان
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> دسترسی: مدیر ارشد کل
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Operational Priority Section */}
      {layoutSettings.operational && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-black text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-default" />
              اقدامات فورس‌ماژور و فوریت‌های عملیاتی
            </h3>
            <span className="text-xs font-bold text-text-muted">اولویت بالای مدیریت روزانه</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Support Tickets Status */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("tickets")}
              className="bg-card p-5 rounded-2xl border border-border hover:border-amber-500/50 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted">تیکت‌های در انتظار پاسخ</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-text-primary font-sans">{(ticketsCount || 0).toLocaleString('fa-IR')}</span>
                  <span className="text-xs font-bold text-amber-600">تیکت باز</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1 font-medium group-hover:text-primary-default transition-colors flex items-center gap-1">
                  مشاهده و پاسخ‌دهی سریع <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>

            {/* 2. Supplier Settlements Status */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("settlements")}
              className="bg-card p-5 rounded-2xl border border-border hover:border-emerald-500/50 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted">درخواست‌های تسویه‌حساب</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-text-primary font-sans">{(pendingSettlements.length || 0).toLocaleString('fa-IR')}</span>
                  <span className="text-xs font-bold text-emerald-600">آماده واریز</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1 font-medium group-hover:text-primary-default transition-colors flex items-center gap-1">
                  تایید و تسویه‌حساب کیف‌پول‌ها <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>

            {/* 3. Orders Overview */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("orders")}
              className="bg-card p-5 rounded-2xl border border-border hover:border-blue-500/50 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted">سفارشات ثبت‌شده پلتفرم</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-text-primary font-sans">{Number(stats?.orders || 0).toLocaleString('fa-IR')}</span>
                  <span className="text-xs font-bold text-blue-600">سفارش فعال</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1 font-medium group-hover:text-primary-default transition-colors flex items-center gap-1">
                  مدیریت زنجیره سفارشات <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>

            {/* 4. Orders Needing Immediate Postal Label Printing */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("orders")}
              className="bg-card p-5 rounded-2xl border border-border hover:border-rose-500/50 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted">صدور فوری لیبل پستی</span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <Printer className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-rose-600 font-sans">{(shippingNeededCount || 0).toLocaleString('fa-IR')}</span>
                  <span className="text-xs font-bold text-rose-600">نیازمند چاپ لیبل</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1 font-medium group-hover:text-primary-default transition-colors flex items-center gap-1">
                  صدور و چاپ برچسب‌های پستی <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clickable Stat Cards Row */}
      {layoutSettings.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, i) => {
            // Convert any Latin digits to Persian digits for stat.value
            const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
            const formattedValue = String(stat.value).replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
            return (
              <div
                key={i}
                onClick={() => {
                  if (onNavigateTab && stat.tab) {
                    onNavigateTab(stat.tab, stat.roleFilter);
                  }
                }}
                className="bg-card p-5 rounded-2xl border border-border shadow-xs hover:border-primary-default/40 hover:shadow-sm transition-all duration-200 group cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-xs text-text-muted font-bold block">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-black text-text-primary font-sans tracking-tight group-hover:text-primary-default transition-colors">
                    {formattedValue}
                  </p>
                </div>
                <div className={`w-11 h-11 ${stat.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prominent Orders Section */}
      {layoutSettings.stuckOrders && (
        <div className="bg-card rounded-3xl p-6 shadow-md border border-border space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span>سفارشات جدید و درخواست‌های ثبت‌شده اخیر</span>
                <span className="bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-500/20">
                  {stuckOrders.length} سفارش نیازمند اقدام
                </span>
              </h3>
              <p className="text-xs text-text-muted mt-1">
                پایش مستقیم جدیدترین درخواست‌های سفارش و برچسب‌های پستی آماده چاپ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: "همه موارد" },
                { id: "PENDING_LABEL", label: "نیازمند لیبل" },
                { id: "PENDING_PAYMENT", label: "در انتظار پرداخت" },
                { id: "PAID", label: "پرداخت شده" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    orderFilter === f.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-surface hover:bg-surface-hover text-text-secondary border border-subtle"
                  }`}
                >
                  {f.label}
                </button>
              ))}

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("orders")}
                  className="text-xs font-bold text-primary-default hover:text-primary-hover flex items-center gap-1 bg-primary-default/10 px-3 py-1.5 rounded-xl border border-primary-default/20 transition-all cursor-pointer mr-auto md:mr-2"
                >
                  <span>جدول جامع سفارشات</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right min-w-[800px]">
              <thead className="bg-surface text-text-secondary">
                <tr>
                  <th className="p-3 font-bold rounded-r-xl">شماره سفارش</th>
                  <th className="p-3 font-bold">فروشگاه خریدار</th>
                  <th className="p-3 font-bold">تامین‌کننده</th>
                  <th className="p-3 font-bold">مبلغ کل</th>
                  <th className="p-3 font-bold">وضعیت سفارش</th>
                  <th className="p-3 font-bold">زمان در انتظار</th>
                  <th className="p-3 font-bold text-center rounded-l-xl">اقدام سریع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stuckOrders
                  .filter((order) => {
                    if (orderFilter === "PENDING_LABEL") return order.status === "PENDING_POSTAL_LABEL";
                    if (orderFilter === "PENDING_PAYMENT") return order.status === "PENDING_PAYMENT" || order.status === "WAITING_FOR_PAYMENT";
                    if (orderFilter === "PAID") return order.status === "PAID";
                    return true;
                  })
                  .slice(0, 6)
                  .map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-surface/80 transition-colors group"
                    >
                      <td className="p-3 font-mono font-black text-text-primary">
                        {order.orderNumber}
                      </td>
                      <td className="p-3 font-bold text-text-primary">{order.storeName}</td>
                      <td className="p-3 font-medium text-text-secondary">
                        {order.supplierName}
                        <span className="block text-[10px] text-text-muted font-mono dir-ltr text-right">{order.supplierPhone}</span>
                      </td>
                      <td className="p-3 font-mono font-black text-emerald-600">
                        {order.totalAmount ? `${parseInt(order.totalAmount).toLocaleString("fa-IR")} تومان` : "نامشخص"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${order.statusBg}`}>
                          {order.statusTitle || "در انتظار تایید"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-600">{order.delay}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedOrderModal(order)}
                          className="px-3 py-1.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          جزئیات و اقدام
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {stuckOrders.length === 0 && (
              <div className="text-center py-8 text-text-muted font-bold text-xs">
                هیچ سفارشی در این وضعیت وجود ندارد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prominent Invoices & Settlements Section */}
      {layoutSettings.pendingActions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Invoices Card */}
          <div className="bg-card rounded-3xl p-6 shadow-md border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>پیش‌فاکتورها و فیش‌های در انتظار تایید</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">درخواست‌های واریز فیش و صدور پیش‌فاکتور</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {pendingInvoices.length} فیش معوق
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {pendingInvoices.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-text-muted text-xs font-bold">هیچ فیشی در انتظار تایید نیست.</p>
                    <button
                      onClick={() => setShowProformaModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      صدور پیش‌فاکتور جدید برای فروشگاه
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvoices.slice(0, 4).map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 bg-surface rounded-2xl border border-border hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-text-primary text-xs">
                              {inv.storeManager?.storeName || inv.storeManager?.username || 'فروشگاه نامشخص'}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted bg-background px-2 py-0.5 rounded-md border border-subtle">
                              کد: #{inv.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-black">
                              {inv.amount ? parseInt(inv.amount).toLocaleString("fa-IR") : 0} تومان
                            </span>
                            {inv.receiptImage && (
                              <button
                                onClick={() => setSelectedReceiptImage(inv.receiptImage)}
                                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                🖼️ تصویر فیش
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleInvoiceAction(inv.id, "approve")}
                            disabled={actioningId === `invoice-${inv.id}`}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            تایید فیش
                          </button>
                          <button
                            onClick={() => handleInvoiceAction(inv.id, "reject")}
                            disabled={actioningId === `invoice-${inv.id}`}
                            className="px-3.5 py-1.5 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer"
                          >
                            رد فیش
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <button
                onClick={() => setShowProformaModal(true)}
                className="px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-xl font-bold text-xs hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                صدور پیش‌فاکتور جدید
              </button>
              <button
                onClick={() => onNavigateTab && onNavigateTab("manual-invoices")}
                className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                مشاهده تمامی فیش‌ها
              </button>
            </div>
          </div>

          {/* Pending Settlements Card */}
          <div className="bg-card rounded-3xl p-6 shadow-md border border-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-600" />
                    <span>درخواست‌های تسویه‌حساب تامین‌کنندگان</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">درخواست‌های واریز وجه و تسویه‌حساب کیف‌پول</p>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                  {pendingSettlements.length} درخواست
                </span>
              </div>

              <div className="mt-4">
                {pendingSettlements.length === 0 ? (
                  <p className="text-center text-text-muted text-xs font-bold py-8">درخواست تسویه معوقه‌ای وجود ندارد.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingSettlements.slice(0, 4).map((st) => (
                      <div
                        key={st.id}
                        className="p-4 bg-surface rounded-2xl border border-border flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-text-primary text-xs">
                            {st.user?.firstName} {st.user?.lastName} ({st.user?.brandName || 'تامین‌کننده'})
                          </p>
                          <p className="text-xs font-mono text-purple-600 dark:text-purple-400 font-black mt-0.5">
                            {st.amount ? parseInt(st.amount).toLocaleString("fa-IR") : 0} تومان
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleSettlementAction(st.id, "approve")}
                            disabled={actioningId === `settlement-${st.id}`}
                            className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                          >
                            تایید و واریز شد
                          </button>
                          <button
                            onClick={() => handleSettlementAction(st.id, "reject")}
                            disabled={actioningId === `settlement-${st.id}`}
                            className="px-3.5 py-1.5 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            رد
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end">
              <button
                onClick={() => onNavigateTab && onNavigateTab("settlements")}
                className="w-full py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl font-bold text-xs transition-colors text-center cursor-pointer"
              >
                مشاهده تمامی درخواست‌های تسویه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {layoutSettings.analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-3xl p-6 shadow-xs border border-border">
            <h3 className="text-sm font-bold text-text-primary mb-4">روند درآمد ماهانه پلتفرم</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="درآمد" stroke="#7C3AED" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 shadow-xs border border-border">
            <h3 className="text-sm font-bold text-text-primary mb-4">تعداد سفارشات روزانه هفته</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="سفارشات" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Customize Dashboard Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-xl overflow-hidden p-6 space-y-6 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary-default" />
                شخصی‌سازی چیدمان پیشخوان
              </h3>
              <button onClick={() => setShowCustomizeModal(false)} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-xs text-text-muted font-bold">بخش‌های مورد نظر را جهت نمایش روشن یا خاموش کنید:</p>

              {[
                { key: "operational", label: "بخش فوریت‌های عملیاتی (تیکت، تسویه، سفارش)" },
                { key: "stats", label: "کارت‌های خلاصه آمار پلتفرم" },
                { key: "stuckOrders", label: "جدول هشدار سفارشات نیازمند لیبل پستی" },
                { key: "pendingActions", label: "فیش‌های در انتظار و تسویه‌حساب‌ها" },
                { key: "analytics", label: "نمودارهای تحلیل درآمد و فروش" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 bg-surface hover:bg-surface-hover rounded-xl cursor-pointer border border-border transition-colors"
                >
                  <span className="font-bold text-text-primary">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(layoutSettings as any)[item.key]}
                    onChange={(e) =>
                      saveLayoutSettings({
                        ...layoutSettings,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-default rounded border-border focus:ring-primary-default cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-full py-2.5 bg-primary-default hover:bg-primary-hover text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all"
              >
                ذخیره و بکارگیری
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Quick Modal */}
      {selectedOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div
            className="bg-card w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-border p-6 text-right relative max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-primary-default/10 text-primary-default rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">
                    جزئیات سریع سفارش #{selectedOrderModal.id || selectedOrderModal.orderNumber}
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    تاریخ: {selectedOrderModal.createdAt ? new Date(selectedOrderModal.createdAt).toLocaleDateString("fa-IR") : "نامشخص"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-1.5 text-text-muted hover:bg-surface rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status and Payment Row */}
              <div className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-secondary">وضعیت سفارش:</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${selectedOrderModal.statusBg || 'bg-amber-500/10 text-amber-600'}`}>
                    {selectedOrderModal.statusTitle || selectedOrderModal.status}
                  </span>
                </div>
                <div>
                  {selectedOrderModal.status === "PAID" || selectedOrderModal.status === "PROCESSING" || selectedOrderModal.status === "SHIPPED" || selectedOrderModal.status === "COMPLETED" ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[11px]">
                      🟢 پرداخت شده
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full font-bold text-[11px]">
                      🔴 پرداخت نشده
                    </span>
                  )}
                </div>
              </div>

              {/* Logistics & Recipient info */}
              <div className="p-3.5 bg-surface rounded-2xl border border-border space-y-2">
                <h4 className="font-bold text-text-primary flex items-center gap-1">
                  <Truck className="w-4 h-4 text-primary-default" /> اطلاعات تحویل‌گیرنده و آدرس ارسال:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-text-primary pt-1">
                  <div>
                    <span className="text-text-muted block text-[10px]">تحویل‌گیرنده / فروشگاه:</span>
                    <span className="font-bold">{selectedOrderModal.storeName}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">شماره تماس:</span>
                    <span className="font-mono font-bold dir-ltr text-right">{selectedOrderModal.supplierPhone}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-text-muted block text-[10px]">نشانی پستی کامل:</span>
                    <span className="font-bold leading-relaxed text-text-secondary block mt-0.5">
                      {selectedOrderModal.shippingAddress || selectedOrderModal.customerAddress || selectedOrderModal.store?.address || "نشانی ثبت نشده است"}
                    </span>
                  </div>
                  {(selectedOrderModal.postalCode || selectedOrderModal.store?.postalCode) && (
                    <div>
                      <span className="text-text-muted block text-[10px]">کد پستی ۱۰ رقمی:</span>
                      <span className="font-mono font-bold">{selectedOrderModal.postalCode || selectedOrderModal.store?.postalCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total & Action */}
              <div className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-border">
                <div>
                  <span className="text-text-muted block text-[10px]">مبلغ کل سفارش:</span>
                  <span className="font-mono font-black text-text-primary text-sm">
                    {selectedOrderModal.totalAmount ? `${selectedOrderModal.totalAmount.toLocaleString()} تومان` : "۰ تومان"}
                  </span>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      setSelectedOrderModal(null);
                      onNavigateTab("orders");
                    }}
                    className="px-3.5 py-2 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    مدیریت کامل این سفارش در جدول سفارشات
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proforma Creation Modal */}
      {showProformaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                صدور پیش‌فاکتور جدید برای فروشگاه
              </h3>
              <button onClick={() => setShowProformaModal(false)} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold">
                {formSuccess}
              </div>
            )}
            {formError && (
              <div className="p-3 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProforma} className="space-y-4 text-xs">
              <div>
                <label className="block text-text-secondary font-bold mb-1.5">انتخاب فروشگاه خریدار:</label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl p-3 text-text-primary font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- انتخاب کنید --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName || s.username} ({s.mobile || 'بدون موبایل'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-bold mb-1.5">مبلغ پیش‌فاکتور (تومان):</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="مثال: ۲۵۰۰۰۰۰"
                  className="w-full bg-surface border border-border rounded-xl p-3 text-text-primary font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary font-bold mb-1.5">توضیحات / بابت:</label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="توضیحات و مشخصات اقلام پیش‌فاکتور..."
                  rows={3}
                  className="w-full bg-surface border border-border rounded-xl p-3 text-text-primary font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProformaModal(false)}
                  className="px-4 py-2.5 bg-surface hover:bg-surface-hover text-text-primary rounded-xl font-bold cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm"
                >
                  {formSubmitting ? "در حال ثبت..." : "ثبت و صدور پیش‌فاکتور"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {selectedReceiptImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-text-primary">تصویر فیش واریزی</h3>
              <button onClick={() => setSelectedReceiptImage(null)} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-surface rounded-2xl border border-border flex items-center justify-center max-h-[70vh] overflow-auto">
              <img src={selectedReceiptImage} alt="تصویر فیش" className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReceiptImage(null)}
                className="px-5 py-2 bg-primary-default text-white rounded-xl text-xs font-bold cursor-pointer"
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
