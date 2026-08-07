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
    const list = Array.isArray(data) ? data : [];
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
      label: "تامین کنندگان فعال",
      value: stats?.suppliers || 0,
      icon: Users,
      color: "text-white",
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      tab: "all-users",
      roleFilter: "SUPPLIER",
    },
    {
      label: "فروشگاه‌های همکار",
      value: stats?.stores || 0,
      icon: Store,
      color: "text-white",
      bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      tab: "all-users",
      roleFilter: "STORE_MANAGER",
    },
    {
      label: "محصولات سامانه",
      value: stats?.activeProducts || 0,
      icon: Package,
      color: "text-white",
      bg: "bg-gradient-to-br from-orange-400 to-orange-500",
      tab: "products",
    },
    {
      label: "کل سفارشات ثبت‌شده",
      value: stats?.orders || 0,
      icon: ShoppingCart,
      color: "text-white",
      bg: "bg-gradient-to-br from-purple-500 to-purple-600",
      tab: "orders",
    },
    {
      label: "درآمد کل پلتفرم",
      value: (stats?.totalRevenue || 0).toLocaleString() + " تومان",
      icon: Wallet,
      color: "text-white",
      bg: "bg-gradient-to-br from-rose-500 to-rose-600",
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
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in" dir="rtl">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white !text-white">به مرکز فرماندهی خوش آمدید 👋</h2>
          <p className="text-slate-200 mt-1.5 text-sm lg:text-base font-medium !text-slate-200">نمای یکپارچه، ابزارهای کنترلی پیشرفته و مدیریت کل زنجیره تامین</p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10">
          <button
            onClick={() => setShowCustomizeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold backdrop-blur-sm border border-white/20 transition-all text-white cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            شخصی‌سازی پیشخوان
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-200" /> دسترسی: مدیر کل
          </div>
        </div>
      </div>

      {/* PROMPT 1 Item 3: Prominent Operational Priority Section */}
      {layoutSettings.operational && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              اقدامات فورس‌ماژور و فوریت‌های عملیاتی
            </h3>
            <span className="text-xs font-bold text-muted">اولویت بالایی مدیریت روزانه</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Support Tickets Status */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("tickets")}
              className="bg-card p-5 rounded-3xl border-2 border-amber-500/30 hover:border-amber-500 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-extrabold text-muted">تیکت‌های پشتیبانی در انتظار</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10 mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary font-mono">{ticketsCount}</span>
                  <span className="text-xs font-bold text-amber-600">تیکت نیازمند پاسخ</span>
                </div>
                <p className="text-[11px] text-muted mt-1 font-medium group-hover:text-primary transition-colors flex items-center gap-1">
                  مشاهده و پاسخ‌دهی سریع <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>

            {/* 2. Supplier Settlements Status */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("settlements")}
              className="bg-card p-5 rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-extrabold text-muted">درخواست‌های تسویه‌حساب</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10 mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary font-mono">{pendingSettlements.length}</span>
                  <span className="text-xs font-bold text-emerald-600">درخواست آماده واریز</span>
                </div>
                <p className="text-[11px] text-muted mt-1 font-medium group-hover:text-primary transition-colors flex items-center gap-1">
                  تایید و تسویه‌حساب کیف‌پول‌ها <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>

            {/* 3. Orders Overview */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("orders")}
              className="bg-card p-5 rounded-3xl border-2 border-blue-500/30 hover:border-blue-500 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-extrabold text-muted">نمای کلی سفارشات جدید</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10 mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary font-mono">{stats?.orders || 0}</span>
                  <span className="text-xs font-bold text-blue-600">سفارش ثبت‌شده</span>
                </div>
                <p className="text-[11px] text-muted mt-1 font-medium group-hover:text-primary transition-colors flex items-center gap-1">
                  مدیریت زنجیره سفارشات <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>

            {/* 4. Orders Needing Immediate Postal Label Printing */}
            <div
              onClick={() => onNavigateTab && onNavigateTab("orders")}
              className="bg-card p-5 rounded-3xl border-2 border-rose-500/30 hover:border-rose-500 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-extrabold text-muted">صدور فوری لیبل پستی</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10 mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-rose-600 font-mono">{shippingNeededCount}</span>
                  <span className="text-xs font-bold text-rose-600">سفارش اماده چاپ لیبل</span>
                </div>
                <p className="text-[11px] text-muted mt-1 font-medium group-hover:text-primary transition-colors flex items-center gap-1">
                  صدور و چاپ برچسب‌های پستی <ArrowRight className="w-3 h-3 rotate-180" />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT 1 Item 2: Clickable Stat Cards Row */}
      {layoutSettings.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {statCards.map((stat, i) => (
            <div
              key={i}
              onClick={() => {
                if (onNavigateTab && stat.tab) {
                  onNavigateTab(stat.tab, stat.roleFilter);
                }
              }}
              className="bg-card p-6 rounded-3xl shadow-sm border border-subtle flex items-center justify-between hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-1.5 relative z-10">
                <p className="text-xs text-muted font-extrabold tracking-wide block">{stat.label}</p>
                <p className="text-2xl font-black text-primary font-mono tracking-tight group-hover:text-emerald-600 transition-colors">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md relative z-10`}>
                <stat.icon className="w-5.5 h-5.5 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stuck Orders Alert Widget */}
      {layoutSettings.stuckOrders && stuckOrders.length > 0 && (
        <div className="bg-card rounded-3xl p-6 shadow-sm border border-subtle">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span>سفارشات نیازمند پیگیری و لیبل پستی ({stuckOrders.length})</span>
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("orders")}
                className="text-xs font-extrabold text-primary-default hover:text-primary-hover flex items-center gap-1.5 bg-primary-default/10 px-3.5 py-2 rounded-xl border border-primary-default/20 transition-all cursor-pointer"
              >
                <span>مشاهده تمام سفارشات پلتفرم</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-surface text-secondary">
                <tr>
                  <th className="p-3 font-bold rounded-r-xl">شماره سفارش</th>
                  <th className="p-3 font-bold">فروشگاه</th>
                  <th className="p-3 font-bold">تامین‌کننده</th>
                  <th className="p-3 font-bold">تماس</th>
                  <th className="p-3 font-bold">وضعیت فعلی</th>
                  <th className="p-3 font-bold rounded-l-xl">مدت زمان در انتظار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {stuckOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/50 cursor-pointer transition-colors" onClick={() => setSelectedOrderModal(order)}>
                    <td className="p-3 font-mono font-bold text-primary">{order.orderNumber}</td>
                    <td className="p-3 font-medium">{order.storeName}</td>
                    <td className="p-3 font-medium">{order.supplierName}</td>
                    <td className="p-3 font-mono text-xs dir-ltr text-right">{order.supplierPhone}</td>
                    <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.statusBg}`}>{order.statusTitle || "در انتظار تایید"}</span></td>
                    <td className="p-3 font-bold text-rose-600">{order.delay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Invoices & Settlements Section */}
      {layoutSettings.pendingActions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Invoices */}
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  پیش‌فاکتورها و فیش‌های در انتظار تایید
                </h3>
                <span className="text-xs font-bold text-muted bg-surface px-3 py-1 rounded-full">
                  {pendingInvoices.length} مورد
                </span>
              </div>
              {pendingInvoices.length === 0 ? (
                <p className="text-center text-muted font-bold py-8">هیچ فیشی در انتظار تایید نیست.</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvoices.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="p-4 bg-surface rounded-2xl border border-subtle flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary text-sm">{inv.storeManager?.storeName || 'فروشگاه'}</p>
                        <p className="text-xs font-mono text-emerald-600 font-bold mt-0.5">
                          {inv.amount ? inv.amount.toLocaleString() : 0} تومان
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInvoiceAction(inv.id, "approve")}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          تایید
                        </button>
                        <button
                          onClick={() => handleInvoiceAction(inv.id, "reject")}
                          className="px-3 py-1.5 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-colors"
                        >
                          رد
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab("manual-invoices")}
              className="mt-4 w-full py-2.5 bg-surface hover:bg-subtle text-primary rounded-xl font-bold text-xs transition-colors text-center"
            >
              مشاهده تمامی فیش‌ها
            </button>
          </div>

          {/* Pending Settlements */}
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  درخواست‌های تسویه‌حساب تامین‌کنندگان
                </h3>
                <span className="text-xs font-bold text-muted bg-surface px-3 py-1 rounded-full">
                  {pendingSettlements.length} درخواست
                </span>
              </div>
              {pendingSettlements.length === 0 ? (
                <p className="text-center text-muted font-bold py-8">درخواست تسویه معوقه‌ای وجود ندارد.</p>
              ) : (
                <div className="space-y-3">
                  {pendingSettlements.slice(0, 3).map((st) => (
                    <div key={st.id} className="p-4 bg-surface rounded-2xl border border-subtle flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary text-sm">{st.user?.firstName} {st.user?.lastName}</p>
                        <p className="text-xs font-mono text-emerald-600 font-bold mt-0.5">
                          {st.amount ? st.amount.toLocaleString() : 0} تومان
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSettlementAction(st.id, "approve")}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          واریز شد
                        </button>
                        <button
                          onClick={() => handleSettlementAction(st.id, "reject")}
                          className="px-3 py-1.5 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-500/20 transition-colors"
                        >
                          رد
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab("settlements")}
              className="mt-4 w-full py-2.5 bg-surface hover:bg-subtle text-primary rounded-xl font-bold text-xs transition-colors text-center"
            >
              مشاهده تمامی تسویه‌ها
            </button>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {layoutSettings.analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-subtle">
            <h3 className="text-lg font-bold text-primary mb-4">روند درآمد ماهانه پلتفرم</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="درآمد" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 shadow-sm border border-subtle">
            <h3 className="text-lg font-bold text-primary mb-4">تعداد سفارشات روزانه هفته</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="سفارشات" fill="#0242A6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Customize Dashboard Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-subtle shadow-2xl overflow-hidden p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-subtle pb-4">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                شخصی‌سازی چیدمان پیشخوان
              </h3>
              <button onClick={() => setShowCustomizeModal(false)} className="p-2 text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs text-muted font-bold">بخش‌های مورد نظر را جهت نمایش روشن یا خاموش کنید:</p>

              {[
                { key: "operational", label: "بخش فوریت‌های عملیاتی (تیکت، تسویه، سفارش)" },
                { key: "stats", label: "کارت‌های خلاصه آمار پلتفرم" },
                { key: "stuckOrders", label: "جدول هشدار سفارشات نیازمند لیبل پستی" },
                { key: "pendingActions", label: "فیش‌های در انتظار و تسویه‌حساب‌ها" },
                { key: "analytics", label: "نمودارهای تحلیل درآمد و فروش" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 bg-surface hover:bg-subtle rounded-2xl cursor-pointer border border-subtle transition-colors"
                >
                  <span className="font-bold text-primary">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(layoutSettings as any)[item.key]}
                    onChange={(e) =>
                      saveLayoutSettings({
                        ...layoutSettings,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-emerald-600 rounded border-subtle focus:ring-emerald-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-full py-2.5 bg-primary-default text-white font-bold rounded-xl text-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div
            className="bg-card w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-subtle p-6 text-right relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-subtle pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-primary-default/10 text-primary-default rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-primary">
                    جزئیات سریع سفارش #{selectedOrderModal.id || selectedOrderModal.orderNumber}
                  </h3>
                  <p className="text-[11px] text-muted font-mono mt-0.5">
                    تاریخ: {selectedOrderModal.createdAt ? new Date(selectedOrderModal.createdAt).toLocaleDateString("fa-IR") : "نامشخص"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-1.5 text-muted hover:bg-surface rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status and Payment Row */}
              <div className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-subtle">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-secondary">وضعیت سفارش:</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold ${selectedOrderModal.statusBg || 'bg-amber-500/10 text-amber-600'}`}>
                    {selectedOrderModal.statusTitle || selectedOrderModal.status}
                  </span>
                </div>
                <div>
                  {selectedOrderModal.status === "PAID" || selectedOrderModal.status === "PROCESSING" || selectedOrderModal.status === "SHIPPED" || selectedOrderModal.status === "COMPLETED" ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-full font-extrabold text-[11px]">
                      🟢 پرداخت شده
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full font-extrabold text-[11px]">
                      🔴 پرداخت نشده
                    </span>
                  )}
                </div>
              </div>

              {/* Logistics & Recipient info */}
              <div className="p-3.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 space-y-2">
                <h4 className="font-bold text-indigo-600 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> اطلاعات تحویل‌گیرنده و آدرس ارسال:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-primary pt-1">
                  <div>
                    <span className="text-muted block text-[10px]">تحویل‌گیرنده / فروشگاه:</span>
                    <span className="font-bold">{selectedOrderModal.storeName}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">شماره تماس:</span>
                    <span className="font-mono font-bold dir-ltr text-right">{selectedOrderModal.supplierPhone}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted block text-[10px]">نشانی پستی کامل:</span>
                    <span className="font-bold leading-relaxed text-secondary block mt-0.5">
                      {selectedOrderModal.shippingAddress || selectedOrderModal.customerAddress || selectedOrderModal.store?.address || "نشانی ثبت نشده است"}
                    </span>
                  </div>
                  {(selectedOrderModal.postalCode || selectedOrderModal.store?.postalCode) && (
                    <div>
                      <span className="text-muted block text-[10px]">کد پستی ۱۰ رقمی:</span>
                      <span className="font-mono font-bold">{selectedOrderModal.postalCode || selectedOrderModal.store?.postalCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total & Action */}
              <div className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-subtle">
                <div>
                  <span className="text-muted block text-[10px]">مبلغ کل سفارش:</span>
                  <span className="font-mono font-black text-primary text-sm">
                    {selectedOrderModal.totalAmount ? `${selectedOrderModal.totalAmount.toLocaleString()} تومان` : "۰ تومان"}
                  </span>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      setSelectedOrderModal(null);
                      onNavigateTab("orders");
                    }}
                    className="px-3.5 py-2 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    مدیریت کامل این سفارش در جدول سفارشات
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
