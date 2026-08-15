import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import OrderTimeline from "../OrderTimeline";
import {
  Download,
  Search,
  Upload,
  MapPin,
  Truck,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  FileText,
  Copy,
  DollarSign,
  Phone,
  Store as StoreIcon,
  User as UserIcon,
  Tag,
  Filter,
  ShieldCheck,
  TrendingUp,
  Save,
  Edit3,
  Sliders,
} from "lucide-react";
import { printOrderInvoice } from "../../utils/printLabel";

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "post" | "tipax" | "label_needed">("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Weekly limits & max product price state
  const [weeklyMaxLimit, setWeeklyMaxLimit] = useState<number>(2000000000);
  const [maxProductPrice, setMaxProductPrice] = useState<number>(500000000);
  const [editingWeeklyLimit, setEditingWeeklyLimit] = useState<string>("2000000000");
  const [editingMaxProductPrice, setEditingMaxProductPrice] = useState<string>("500000000");
  const [savingLimit, setSavingLimit] = useState(false);
  const [showLimitControl, setShowLimitControl] = useState(false);

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Shipping Cost Estimate Modal
  const [shippingEstimateModal, setShippingEstimateModal] = useState<any | null>(null);
  const [estimatedFee, setEstimatedFee] = useState("");
  const [submittingFee, setSubmittingFee] = useState(false);

  // Postal Label & Tracking Code Modal
  const [labelModalOrder, setLabelModalOrder] = useState<any | null>(null);
  const [labelValue, setLabelValue] = useState("");
  const [trackingCodeValue, setTrackingCodeValue] = useState("");
  const [submittingLabel, setSubmittingLabel] = useState(false);

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/admin/orders", {
      credentials: "include",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
        else setOrders([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    // Fetch weekly limit and max product price config
    fetch("/api/config", { credentials: "include" })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === "object") {
          if (data.WEEKLY_MAX_ORDER_AMOUNT) {
            const val = Number(data.WEEKLY_MAX_ORDER_AMOUNT);
            setWeeklyMaxLimit(val);
            setEditingWeeklyLimit(String(val));
          }
          if (data.MAX_PRODUCT_PRICE) {
            const val = Number(data.MAX_PRODUCT_PRICE);
            setMaxProductPrice(val);
            setEditingMaxProductPrice(String(val));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveWeeklyLimit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingLimit(true);
    try {
      const numWeekly = parseFloat(editingWeeklyLimit) || weeklyMaxLimit;
      const numMaxProd = parseFloat(editingMaxProductPrice) || maxProductPrice;

      await Promise.all([
        fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "WEEKLY_MAX_ORDER_AMOUNT", value: String(numWeekly) }),
        }),
        fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "MAX_PRODUCT_PRICE", value: String(numMaxProd) }),
        }),
      ]);

      setWeeklyMaxLimit(numWeekly);
      setMaxProductPrice(numMaxProd);
      toast("سقف مجاز سفارشات هفتگی و حداکثر مبلغ کالا با موفقیت بروزرسانی شد.", "success");
      setShowLimitControl(false);
    } catch {
      toast("خطا در ذخیره‌سازی سقف مجاز", "error");
    } finally {
      setSavingLimit(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast(`${fieldName} در حافظه کپی شد.`, "success");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveShippingFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingEstimateModal || !estimatedFee) return;
    setSubmittingFee(true);
    try {
      const res = await fetch(`/api/admin/orders/${shippingEstimateModal.id}/shipping-fee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ shippingFee: parseFloat(estimatedFee) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("برآورد هزینه ارسال با موفقیت ثبت شد و سفارش به حالت در انتظار پرداخت تغییر یافت.", "success");
        setShippingEstimateModal(null);
        setEstimatedFee("");
        fetchOrders();
      } else {
        toast(data.error || "خطا در ثبت هزینه ارسال", "error");
      }
    } catch {
      toast("خطای شبکه در ارتباط با سرور", "error");
    } finally {
      setSubmittingFee(false);
    }
  };

  const handleSavePostalLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelModalOrder) return;
    setSubmittingLabel(true);
    try {
      // 1. Update postal label
      if (labelValue) {
        await fetch(`/api/admin/orders/${labelModalOrder.id}/postal-label`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ postalLabel: labelValue }),
        });
      }

      // 2. Update tracking code & status to PENDING_POSTAL_LABEL or COMPLETED
      const res = await fetch(`/api/admin/orders/${labelModalOrder.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          trackingCode: trackingCodeValue,
          status: "PENDING_POSTAL_LABEL",
        }),
      });

      if (res.ok) {
        toast("لیبل پستی و کد رهگیری مرسوله با موفقیت ثبت گردید.", "success");
        setLabelModalOrder(null);
        setLabelValue("");
        setTrackingCodeValue("");
        fetchOrders();
      } else {
        toast("خطا در بروزرسانی اطلاعات مرسوله", "error");
      }
    } catch {
      toast("خطای شبکه", "error");
    } finally {
      setSubmittingLabel(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast("وضعیت سفارش بروزرسانی شد.", "success");
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch {
      toast("خطا در تغییر وضعیت سفارش", "error");
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast("هیچ سفارشی برای خروجی گرفتن وجود ندارد.", "error");
      return;
    }
    const headers = [
      "شناسه سفارش",
      "نام محصول",
      "فروشگاه",
      "تامین‌کننده",
      "روش ارسال",
      "مبلغ سفارش (تومان)",
      "هزینه ارسال (تومان)",
      "وضعیت",
      "کد پستی",
      "کد رهگیری",
      "آدرس کامل",
    ];
    const rows = orders.map((o) => {
      const item = o.items?.[0];
      const product = item?.product;
      const supplier = product?.supplier;
      return [
        o.id,
        product?.name || "محصول",
        o.store?.storeName || o.store?.username || "فروشگاه",
        supplier?.brandName || supplier?.username || "تامین‌کننده",
        o.shippingMethod === "TIPAX" ? "تیپاکس" : "پست",
        o.totalAmount || 0,
        o.shippingFee || 0,
        o.status,
        o.postalCode || o.store?.postalCode || "نامشخص",
        o.trackingCode || "-",
        o.shippingAddress || o.customerAddress || o.store?.address || "-",
      ];
    });
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سفارشات_مجموعه_بانک_کالا.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering Logic
  const filteredOrders = orders.filter((o) => {
    // Search query match
    const q = searchQuery.toLowerCase();
    const item = o.items?.[0];
    const prodName = item?.product?.name || "";
    const storeName = o.store?.storeName || o.store?.username || "";
    const supplierName = item?.product?.supplier?.brandName || item?.product?.supplier?.username || "";
    const matchesSearch =
      !q ||
      String(o.id).includes(q) ||
      prodName.toLowerCase().includes(q) ||
      storeName.toLowerCase().includes(q) ||
      supplierName.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.postalCode && o.postalCode.includes(q));

    // Filter Type match
    let matchesFilterType = true;
    if (filterType === "post") {
      matchesFilterType = o.shippingMethod === "POST" || !o.shippingMethod;
    } else if (filterType === "tipax") {
      matchesFilterType = o.shippingMethod === "TIPAX";
    } else if (filterType === "label_needed") {
      matchesFilterType = o.status === "PENDING_POSTAL_LABEL";
    }

    // Status filter match
    let matchesStatus = true;
    if (statusFilter !== "ALL") {
      matchesStatus = o.status === statusFilter;
    }

    return matchesSearch && matchesFilterType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
      case "WAITING_SUPPLIER_CONFIRMATION":
      case "PENDING":
        return <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-500/15 text-purple-700 border border-purple-500/30 inline-flex items-center gap-1">۱. در انتظار تایید تأمین‌کننده</span>;
      case "WAITING_STORE_ADDRESS":
        return <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-500/15 text-blue-700 border border-blue-500/30 inline-flex items-center gap-1">۲. در انتظار ثبت آدرس</span>;
      case "WAITING_SHIPPING_COST":
        return <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 text-white shadow-md shadow-rose-600/25 border border-rose-700 inline-flex items-center gap-1.5 animate-pulse"><AlertTriangle className="w-3.5 h-3.5 text-white" /> ۳. اقدام فوری: برآورد هزینه پستی</span>;
      case "PENDING_PAYMENT":
      case "WAITING_FOR_PAYMENT":
      case "WAITING_SHIPPING_PAYMENT":
        return <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/15 text-amber-700 border border-amber-500/30 inline-flex items-center gap-1">۴. در انتظار پرداخت فروشگاه</span>;
      case "PAID":
      case "PENDING_POSTAL_LABEL":
      case "READY_TO_SHIP":
      case "PREPARING":
        return <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 text-white shadow-md shadow-rose-600/25 border border-rose-700 inline-flex items-center gap-1.5 animate-pulse"><AlertCircle className="w-3.5 h-3.5 text-white" /> ۵. اقدام فوری: صدور لیبل پستی</span>;
      case "SHIPPED":
      case "PROCESSING":
      case "COMPLETED":
      case "DELIVERED":
        return <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 inline-flex items-center gap-1">۶. تکمیل شده / ارسال پستی</span>;
      default:
        return <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-500/15 text-slate-700 border border-slate-500/30">{status}</span>;
    }
  };

  // Weekly Stats calculation
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyOrders = orders.filter((o) => new Date(o.createdAt || o.orderDate || Date.now()) >= sevenDaysAgo);
  const weeklyOrdersTotal = weeklyOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const weeklyUsagePercent = weeklyMaxLimit > 0 ? Math.min(100, Math.round((weeklyOrdersTotal / weeklyMaxLimit) * 100)) : 0;

  return (
    <div className="space-y-6 animate-fade-in p-4 lg:p-6" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-400" />
            مدیر کالا و لجستیک سفارشات
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1">
            یکپارچه‌سازی کامل زنجیره ارسال، محاسبه هزینه پستی، ثبت فاکتور و صدور لیبل‌های پستی
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowLimitControl(!showLimitControl)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" /> مدیریت سقف‌های مالی
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> خروجی اکسل سفارشات
          </button>
        </div>
      </div>

      {/* Weekly Orders & Limits Management Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Weekly Orders Total */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-background to-background border border-indigo-500/20 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              مجموع سفارشات ۷ روز گذشته
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
              {weeklyOrders.length.toLocaleString('fa-IR')} سفارش
            </span>
          </div>
          <div className="text-xl lg:text-2xl font-black text-text-primary font-sans">
            {weeklyOrdersTotal.toLocaleString('fa-IR')} <span className="text-xs text-muted font-sans font-medium">تومان</span>
          </div>
          <p className="text-[11px] text-muted">
            مجموع مبلغ کل تمام سفارشات ثبت شده در هفته اخیر
          </p>
        </div>

        {/* Card 2: Weekly Ceiling Limit & Progress */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-background to-background border border-emerald-500/20 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              سقف مجاز کل سفارشات هفتگی
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${weeklyUsagePercent >= 90 ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {weeklyUsagePercent.toLocaleString('fa-IR')}% مصرف شده
            </span>
          </div>
          <div className="text-xl lg:text-2xl font-black text-text-primary font-sans">
            {weeklyMaxLimit.toLocaleString('fa-IR')} <span className="text-xs text-muted font-sans font-medium">تومان</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-subtle">
            <div
              className={`h-full transition-all duration-500 ${weeklyUsagePercent >= 90 ? 'bg-red-500' : weeklyUsagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${weeklyUsagePercent}%` }}
            />
          </div>
        </div>

        {/* Card 3: Max Product Price Ceiling */}
        <div className="bg-gradient-to-br from-amber-500/10 via-background to-background border border-amber-500/20 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" />
              حداکثر مبلغ مجاز هر کالا
            </span>
            <button
              onClick={() => setShowLimitControl(!showLimitControl)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" /> تغییر
            </button>
          </div>
          <div className="text-xl lg:text-2xl font-black text-text-primary font-sans">
            {maxProductPrice.toLocaleString('fa-IR')} <span className="text-xs text-muted font-sans font-medium">تومان</span>
          </div>
          <p className="text-[11px] text-muted">
            سقف مجاز قیمت تعیین‌شده توسط مدیرکل برای ثبت هر محصول
          </p>
        </div>
      </div>

      {/* Quick Limits Management Drawer/Panel */}
      {showLimitControl && (
        <form onSubmit={handleSaveWeeklyLimit} className="bg-card border-2 border-indigo-500/30 p-6 rounded-3xl shadow-lg space-y-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="text-sm font-black text-text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              مدیریت سقف سفارشات هفتگی و حداکثر قیمت محصولات
            </h3>
            <button
              type="button"
              onClick={() => setShowLimitControl(false)}
              className="text-xs text-muted hover:text-text-primary cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                سقف مجاز مجموع سفارشات در ۷ روز (تومان)
              </label>
              <input
                type="number"
                step="1000000"
                value={editingWeeklyLimit}
                onChange={(e) => setEditingWeeklyLimit(e.target.value)}
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-muted">
                مقدار کنونی: {Number(editingWeeklyLimit || 0).toLocaleString('fa-IR')} تومان
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                حداکثر مبلغ مجاز تک کالا (تومان)
              </label>
              <input
                type="number"
                step="1000"
                value={editingMaxProductPrice}
                onChange={(e) => setEditingMaxProductPrice(e.target.value)}
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-muted">
                مقدار کنونی: {Number(editingMaxProductPrice || 0).toLocaleString('fa-IR')} تومان
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowLimitControl(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface text-text-secondary hover:bg-border-subtle cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={savingLimit}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingLimit ? "در حال ذخیره..." : "ذخیره سقف‌های جدید"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-card p-4 rounded-3xl border border-border-subtle shadow-sm flex flex-col lg:flex-row justify-between gap-4 items-stretch lg:items-center">
        {/* Buttons Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                : "bg-surface text-text-secondary hover:bg-border-subtle"
            }`}
          >
            همه سفارشات ({orders.length})
          </button>
          <button
            onClick={() => setFilterType("post")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "post"
                ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                : "bg-surface text-text-secondary hover:bg-border-subtle"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            ارسال با پست ({orders.filter((o) => o.shippingMethod === "POST" || !o.shippingMethod).length})
          </button>
          <button
            onClick={() => setFilterType("tipax")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "tipax"
                ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                : "bg-surface text-text-secondary hover:bg-border-subtle"
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            ارسال با تیپاکس ({orders.filter((o) => o.shippingMethod === "TIPAX").length})
          </button>
          <button
            onClick={() => setFilterType("label_needed")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "label_needed"
                ? "bg-danger text-white shadow-md shadow-danger/20"
                : "bg-surface text-text-secondary hover:bg-border-subtle"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            نیازمند لیبل پستی ({orders.filter((o) => o.status === "PENDING_POSTAL_LABEL").length})
          </button>
        </div>

        {/* Status Dropdown Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 bg-surface px-3 py-2 rounded-xl border border-border-subtle w-full sm:w-auto">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">تمام وضعیت‌ها</option>
              <option value="REQUESTED">درخواست شده</option>
              <option value="REGISTERED">ثبت شده</option>
              <option value="WAITING_SHIPPING_COST">در انتظار برآورد هزینه</option>
              <option value="WAITING_FOR_PAYMENT">در انتظار پرداخت (محصول)</option><option value="WAITING_SHIPPING_PAYMENT">در انتظار پرداخت (پستی)</option>
              <option value="PAID">پرداخت شده</option>
              <option value="PENDING_POSTAL_LABEL">در انتظار لیبل پستی</option>
              <option value="COMPLETED">تکمیل شده</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو (کد، نام، تلفن)..."
              className="w-full pl-4 pr-9 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary"
            />
            <Search className="w-4 h-4 text-text-muted absolute right-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Unified Orders Table */}
      {loading ? (
        <div className="py-20 text-center bg-card rounded-3xl border border-border-subtle shadow-sm text-text-muted">
          <div className="w-8 h-8 border-4 border-primary-default border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold">در حال بارگذاری لیست کامل سفارشات...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-3xl border border-border-subtle shadow-sm text-text-muted space-y-2">
          <Truck className="w-12 h-12 mx-auto text-primary-default opacity-40" />
          <p className="text-base font-bold text-text-primary">هیچ سفارشی با این مشخصات ثبت نشده است.</p>
          <p className="text-xs">از فیلترهای بالا جهت تغییر معیارهای جستجو استفاده کنید.</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-surface border-b border-border-subtle text-text-secondary font-bold text-xs">
                <tr>
                  <th className="p-4">کد سفارش</th>
                  <th className="p-4">مدیر فروشگاه</th>
                  <th className="p-4">تامین‌کننده</th>
                  <th className="p-4">کالا / جزییات</th>
                  <th className="p-4">روش ارسال</th>
                  <th className="p-4">مبلغ + هزینه ارسال</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 text-xs font-medium">
                {filteredOrders.map((o) => {
                  const item = o.items?.[0];
                  const product = item?.product;
                  const supplier = product?.supplier;
                  const storeManager = o.store;

                  return (
                    <tr key={o.id} className="hover:bg-surface/50 transition-colors">
                      {/* Order ID */}
                      <td className="p-4">
                        <span className="font-sans font-black text-primary-default text-sm">
                          #{Number(o.id).toLocaleString('fa-IR')}
                        </span>
                        <p className="text-[10px] text-text-muted mt-0.5 font-sans">
                          {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                        </p>
                      </td>

                      {/* Store Manager */}
                      <td className="p-4">
                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                          <StoreIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {storeManager?.storeName || storeManager?.username || "فروشگاه"}
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5 font-sans text-right">
                          {storeManager?.mobile || o.customerPhone || "-"}
                        </p>
                      </td>

                      {/* Supplier */}
                      <td className="p-4">
                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {supplier?.brandName || supplier?.username || "تامین‌کننده"}
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5 font-sans text-right">
                          {supplier?.mobile || "-"}
                        </p>
                      </td>

                      {/* Product */}
                      <td className="p-4 max-w-[180px] truncate">
                        <span className="font-bold text-text-primary block truncate">
                          {product?.name || "محصول"}
                        </span>
                        <span className="text-[10px] text-text-muted font-sans">
                          تعداد: {(item?.quantity || 1).toLocaleString('fa-IR')} عدد
                        </span>
                      </td>

                      {/* Shipping Method */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 ${
                            o.shippingMethod === "TIPAX"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                        >
                          <Truck className="w-3 h-3" />
                          {o.shippingMethod === "TIPAX" ? "تیپاکس" : (o.shippingMethod === "POST_VIZHE" || o.shippingMethod === "POST_EXPRESS" ? "پست ویژه (اکسپرس)" : "پست پیشتاز")}
                        </span>
                      </td>

                      {/* Financials */}
                      <td className="p-4">
                        <div className="font-sans font-bold text-text-primary">
                          {Number(o.totalAmount || 0).toLocaleString('fa-IR')} تومان
                        </div>
                        <div className="text-[10px] text-text-muted font-bold mt-0.5 font-sans">
                          هزینه ارسال: {o.shippingFee ? `${Number(o.shippingFee).toLocaleString('fa-IR')} تومان` : "برآورد نشده"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">{getStatusBadge(o.status)}</td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-3 py-1.5 bg-surface hover:bg-border-subtle text-text-primary rounded-xl text-[11px] font-bold border border-border-subtle transition-all cursor-pointer"
                          >
                            جزئیات
                          </button>

                          {/* Calculate Shipping Fee */}
                          <button
                            onClick={() => {
                              setShippingEstimateModal(o);
                              setEstimatedFee(o.shippingFee ? String(o.shippingFee) : "");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              o.status === "WAITING_SHIPPING_COST"
                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 animate-pulse border border-rose-700"
                                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/20"
                            }`}
                            title="محاسبه و ثبت هزینه ارسال"
                          >
                            {o.status === "WAITING_SHIPPING_COST" ? <AlertTriangle className="w-3.5 h-3.5 text-white" /> : <DollarSign className="w-3.5 h-3.5" />}
                            هزینه ارسال
                          </button>

                          {/* Upload Label / Tracking Code */}
                          <button
                            onClick={() => {
                              setLabelModalOrder(o);
                              setLabelValue(o.postalLabel || "");
                              setTrackingCodeValue(o.trackingCode || "");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              o.status === "PENDING_POSTAL_LABEL" || o.status === "PAID"
                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 animate-pulse border border-rose-700"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                            }`}
                            title="ثبت یا صدور لیبل پستی"
                          >
                            {o.status === "PENDING_POSTAL_LABEL" || o.status === "PAID" ? <AlertCircle className="w-3.5 h-3.5 text-white" /> : <Upload className="w-3.5 h-3.5" />}
                            لیبل / کد رهگیری
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL (With Quick Copy Tooling) */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-border-subtle p-6 text-right relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-default/10 text-primary-default rounded-2xl">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-primary">
                    جزئیات کامل سفارش #{selectedOrder.id}
                  </h3>
                  <p className="text-xs text-text-muted">
                    تاریخ ثبت: {new Date(selectedOrder.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-text-muted hover:bg-surface rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-sm">
              {/* Order Status & Payment/Label Indicators */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-surface rounded-2xl border border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-secondary">وضعیت سفارش:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.status === "PAID" || selectedOrder.status === "PROCESSING" || selectedOrder.status === "SHIPPED" || selectedOrder.status === "COMPLETED" ? (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-full font-black text-xs">
                      🟢 پرداخت شده
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full font-black text-xs">
                      🔴 پرداخت نشده (در انتظار تسویه)
                    </span>
                  )}
                  {selectedOrder.postalLabel ? (
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 rounded-full font-black text-xs">
                      📄 لیبل پستی دارد
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full font-black text-xs">
                      ⚠️ فاقد لیبل پستی
                    </span>
                  )}
                </div>
              </div>

              {/* OUT OF STOCK / REFUND WARNING BANNER FOR SUPER ADMIN */}
              {(selectedOrder.status === "REJECTED" || selectedOrder.status === "CANCELLED" || selectedOrder.status === "OUT_OF_STOCK") && (
                <div className="p-4 bg-rose-500/10 rounded-2xl border-2 border-rose-500/40 text-rose-700 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
                    <span>⚠️ هشدار بسیار مهم لغو سفارش / اتمام موجودی: لزوم عودت وجه به مشتری</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    این سفارش به علت اعلام اتمام موجودی یا رد تامین‌کننده لغو گردیده است. مبلغ به میزان{" "}
                    <strong className="text-rose-600 font-mono underline text-sm">
                      {(selectedOrder.totalAmount || 0).toLocaleString()} تومان
                    </strong>{" "}
                    از کیف پول تامین‌کننده کسر شده و جهت رضایت خریدار، باید توسط مدیریت به شماره کارت/حساب خریدار عودت داده شود.
                  </p>
                </div>
              )}

              {/* FULL CUSTOMER DETAILS & QUICK COPY FIELDS BOX */}
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 space-y-3">
                <h4 className="font-extrabold text-xs text-indigo-600 flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4" /> مشخصات کامل خریدار و ابزارک کپی سریع (Customer Details & Quick Copy)
                </h4>

                {/* Customer Name */}
                <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border-subtle">
                  <div>
                    <span className="text-xs text-text-muted font-bold block">نام و نام خانوادگی خریدار:</span>
                    <span className="font-black text-text-primary text-sm">
                      {selectedOrder.customerName || selectedOrder.store?.storeName || selectedOrder.store?.username || "نامشخص"}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedOrder.customerName || selectedOrder.store?.storeName || "",
                        "نام خریدار"
                      )
                    }
                    className="p-2 bg-surface hover:bg-indigo-500 hover:text-white rounded-xl text-text-primary transition-all flex items-center gap-1 text-xs font-bold border border-border-subtle"
                  >
                    {copiedField === "نام خریدار" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>کپی</span>
                  </button>
                </div>

                {/* Destination Phone */}
                <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border-subtle">
                  <div>
                    <span className="text-xs text-text-muted font-bold block">شماره تماس خریدار:</span>
                    <span className="font-mono font-black text-text-primary text-sm dir-ltr">
                      {selectedOrder.customerPhone || selectedOrder.store?.mobile || "ثبت نشده"}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedOrder.customerPhone || selectedOrder.store?.mobile || "",
                        "شماره تماس"
                      )
                    }
                    className="p-2 bg-surface hover:bg-indigo-500 hover:text-white rounded-xl text-text-primary transition-all flex items-center gap-1 text-xs font-bold border border-border-subtle"
                  >
                    {copiedField === "شماره تماس" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>کپی</span>
                  </button>
                </div>

                {/* Full Address */}
                <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border-subtle gap-4">
                  <div className="flex-1">
                    <span className="text-xs text-text-muted font-bold block">آدرس کامل مقصد:</span>
                    <span className="font-bold text-text-primary text-xs leading-relaxed block">
                      {selectedOrder.shippingAddress ||
                        selectedOrder.customerAddress ||
                        selectedOrder.store?.address ||
                        "آدرس وارد نشده است"}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedOrder.shippingAddress ||
                          selectedOrder.customerAddress ||
                          selectedOrder.store?.address ||
                          "",
                        "آدرس کامل"
                      )
                    }
                    className="p-2 bg-surface hover:bg-indigo-500 hover:text-white rounded-xl text-text-primary transition-all flex items-center gap-1 text-xs font-bold border border-border-subtle shrink-0"
                  >
                    {copiedField === "آدرس کامل" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>کپی</span>
                  </button>
                </div>

                {/* Postal Code */}
                <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border-subtle">
                  <div>
                    <span className="text-xs text-text-muted font-bold block">کد پستی مقصد:</span>
                    <span className="font-mono font-black text-text-primary text-sm">
                      {selectedOrder.postalCode || selectedOrder.store?.postalCode || "ثبت نشده"}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedOrder.postalCode || selectedOrder.store?.postalCode || "",
                        "کد پستی"
                      )
                    }
                    className="p-2 bg-surface hover:bg-indigo-500 hover:text-white rounded-xl text-text-primary transition-all flex items-center gap-1 text-xs font-bold border border-border-subtle"
                  >
                    {copiedField === "کد پستی" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>کپی</span>
                  </button>
                </div>

                {/* Customer Card Number */}
                {selectedOrder.customerCardNumber && (
                  <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border-subtle">
                    <div>
                      <span className="text-xs text-text-muted font-bold block">شماره کارت ۱۶ رقمی خریدار:</span>
                      <span className="font-mono font-black text-text-primary text-sm dir-ltr">
                        {selectedOrder.customerCardNumber}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(selectedOrder.customerCardNumber, "شماره کارت خریدار")
                      }
                      className="p-2 bg-surface hover:bg-indigo-500 hover:text-white rounded-xl text-text-primary transition-all flex items-center gap-1 text-xs font-bold border border-border-subtle"
                    >
                      {copiedField === "شماره کارت خریدار" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>کپی</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Store & Supplier Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-surface rounded-2xl border border-border-subtle space-y-1">
                  <span className="text-xs font-bold text-text-muted block">فروشگاه خریدار:</span>
                  <span className="font-black text-text-primary block">
                    {selectedOrder.store?.storeName || selectedOrder.store?.username || "-"}
                  </span>
                  <span className="text-xs text-text-secondary block dir-ltr text-right">
                    تلفن: {selectedOrder.store?.mobile || "-"}
                  </span>
                </div>

                {/* Enhanced Supplier Postal Info */}
                {(() => {
                  const supplier = selectedOrder.items?.[0]?.product?.supplier;
                  const zopitSupplierName = supplier
                    ? `زوپیت تامین‌کننده ${supplier.id}${supplier.brandName ? ` (${supplier.brandName})` : ""}`
                    : "زوپیت تامین‌کننده نامشخص";
                  
                  const supplierAddr = supplier
                    ? [
                        supplier.province ? `استان ${supplier.province}` : null,
                        supplier.city ? `شهر ${supplier.city}` : null,
                        supplier.address,
                        supplier.postalCode ? `کدپستی: ${supplier.postalCode}` : null,
                        supplier.mobile ? `همراه: ${supplier.mobile}` : null
                      ].filter(Boolean).join(" - ")
                    : "آدرس انبار ثبت نشده است";

                  return (
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-2 col-span-1 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <StoreIcon className="w-4 h-4" /> فرستنده مرسوله (نام پستی و آدرس انبار زوپیت تامین‌کننده):
                        </span>
                        <button
                          onClick={() => handleCopy(zopitSupplierName, "نام زوپیت تامین‌کننده")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "نام زوپیت تامین‌کننده" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>کپی نام پستی</span>
                        </button>
                      </div>

                      <div className="bg-card p-3 rounded-xl border border-emerald-500/20 space-y-1">
                        <p className="font-black text-sm text-emerald-800 dark:text-emerald-200 font-mono">
                          {zopitSupplierName}
                        </p>
                        <div className="flex items-start justify-between gap-2 pt-1 border-t border-border-subtle/50 mt-1">
                          <p className="text-xs text-text-secondary leading-relaxed font-bold">
                            آدرس انبار فرستنده: {supplierAddr}
                          </p>
                          <button
                            onClick={() => handleCopy(supplierAddr, "آدرس انبار تامین‌کننده")}
                            className="p-1.5 bg-surface hover:bg-emerald-500 hover:text-white rounded-lg text-text-primary transition-all flex items-center gap-1 text-[11px] font-bold border border-border-subtle shrink-0"
                            title="کپی آدرس انبار فرستنده"
                          >
                            {copiedField === "آدرس انبار تامین‌کننده" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>کپی آدرس</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Status Change Buttons */}
              <div className="pt-2">
                <span className="text-xs font-extrabold text-text-secondary block mb-2">
                  تغییر مستقیم وضعیت سفارش:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "REQUESTED", label: "درخواست شده" },
                    { key: "REGISTERED", label: "ثبت شده" },
                    { key: "WAITING_SHIPPING_COST", label: "منتظر برآورد هزینه" },
                    { key: "WAITING_FOR_PAYMENT", label: "در انتظار پرداخت (محصول)" },
                    { key: "WAITING_SHIPPING_PAYMENT", label: "در انتظار پرداخت (پستی)" },
                    { key: "PAID", label: "پرداخت شده" },
                    { key: "PENDING_POSTAL_LABEL", label: "در انتظار لیبل" },
                    { key: "COMPLETED", label: "تکمیل شده" },
                  ].map((st) => (
                    <button
                      key={st.key}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, st.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                        selectedOrder.status === st.key
                          ? "bg-primary-default text-white border-primary-default"
                          : "bg-surface hover:bg-border-subtle text-text-primary border-border-subtle"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-border-subtle pt-4">
              <button
                onClick={() => printOrderInvoice(selectedOrder)}
                className="px-4 py-2 bg-surface hover:bg-border-subtle text-text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 border border-border-subtle"
              >
                <FileText className="w-4 h-4" /> چاپ فاکتور سفارش
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-primary-default text-white rounded-xl text-xs font-bold hover:bg-primary-hover"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIPPING COST ESTIMATE MODAL */}
      {shippingEstimateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setShippingEstimateModal(null)}
        >
          <div
            className="bg-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border-subtle p-6 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
              <h3 className="font-extrabold text-base text-text-primary">
                محاسبه و درج هزینه ارسال پستی
              </h3>
              <button
                onClick={() => setShippingEstimateModal(null)}
                className="p-2 text-text-muted hover:bg-surface rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShippingFee} className="space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed font-medium">
                پس از استعلام هزینه ارسال در پنل پستی، مبلغ را وارد کنید. مبلغ ارسال به فاکتور سفارش
                #{shippingEstimateModal.id} اضافه شده و وضعیت به «در انتظار پرداخت» تغییر خواهد کرد تا مدیر
                فروشگاه آن را از طریق زیبال پرداخت کند.
              </p>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  هزینه محاسبه‌شده ارسال (تومان):
                </label>
                <input
                  type="number"
                  required
                  value={estimatedFee}
                  onChange={(e) => setEstimatedFee(e.target.value)}
                  placeholder="مثال: 45000"
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingFee}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {submittingFee ? "در حال ثبت..." : "ثبت هزینه و ارسال به فاکتور فروشگاه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POSTAL LABEL & TRACKING CODE MODAL */}
      {labelModalOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setLabelModalOrder(null)}
        >
          <div
            className="bg-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border-subtle p-6 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
              <h3 className="font-extrabold text-base text-text-primary">
                الصاق کد رهگیری و فایل لیبل پستی
              </h3>
              <button
                onClick={() => setLabelModalOrder(null)}
                className="p-2 text-text-muted hover:bg-surface rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePostalLabel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  کد رهگیری مرسوله (متن):
                </label>
                <input
                  type="text"
                  value={trackingCodeValue}
                  onChange={(e) => setTrackingCodeValue(e.target.value)}
                  placeholder="مثال: 123456789012345678"
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  فایل لیبل پستی (تصویر یا PDF):
                </label>
                
                <div className="relative border-2 border-dashed border-primary-default/40 hover:border-primary-default rounded-2xl p-4 bg-surface text-center transition-all group">
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        toast("حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.", "error");
                        return;
                      }
                      toast("در حال بارگذاری فایل لیبل...", "info");
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64Data = reader.result as string;
                        setLabelValue(base64Data);
                        toast(`فایل ${file.name} آماده بارگذاری گردید.`, "success");
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-primary-default/10 text-primary-default flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-extrabold text-text-primary">
                      کلیک کنید یا فایل لیبل (PDF / عکس) را به اینجا بکشید
                    </p>
                    <p className="text-[10px] text-text-muted font-bold">
                      پشتیبانی از فرمت‌های PDF، PNG، JPG و WEBP (حداکثر ۱۰ مگابایت)
                    </p>
                  </div>
                </div>

                {labelValue && (
                  <div className="mt-3 p-3 bg-surface/80 rounded-xl border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary-default shrink-0" />
                      <span className="text-xs font-mono font-bold truncate text-text-primary">
                        {labelValue.startsWith("data:application/pdf")
                          ? "📄 فایل PDF آماده ارسال"
                          : labelValue.startsWith("data:image/")
                          ? "🖼️ تصویر لیبل آماده ارسال"
                          : labelValue.startsWith("http") || labelValue.startsWith("/")
                          ? `🔗 ${labelValue}`
                          : "فایل الصاق شده"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLabelValue("")}
                      className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0 p-1"
                      title="پاک کردن فایل"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  یا ورود مستقیم لینک / آدرس لیبل:
                </label>
                <input
                  type="text"
                  value={labelValue.startsWith("data:") ? "" : labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  placeholder="https://... یا آدرس آنلاین فایل لیبل پستی"
                  className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingLabel}
                  className="flex-1 py-3 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold transition-colors disabled:opacity-50 shadow-md shadow-primary-default/20"
                >
                  {submittingLabel ? "در حال ثبت..." : "ذخیره و ارسال اطلاع برای فروشگاه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
