import { toast } from "../GlobalToast";
import React, { useState } from "react";
import Announcements from "../Announcements";
import NotificationBell from "../NotificationBell";
import OrderTimeline from "../OrderTimeline";
import { useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Wallet,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  PlusCircle,
  MessageSquare,
  User,
  Settings,
  FileText,
  XCircle,
  ShoppingBag,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Scale,
  Truck,
  Users,
  HelpCircle,
  Sliders,
  Bell,
  BellRing,
  Megaphone,
  Activity,
  ShieldCheck,
  Folder,
  Globe,
  CreditCard,
  Phone,
  CheckSquare,
  Sparkles,
  Link,
  Tag,
  Share2,
  Box,
  List,
  Grid,
  Info,
  Layers,
  Store,
  GraduationCap,
  Ticket
} from "lucide-react";
import { EducationModal } from "../EducationModal";
import { ZopitLogo } from "../ZopitLogo";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  User,
  Users,
  Settings,
  MessageSquare,
  HelpCircle,
  FileText,
  Scale,
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  Plus,
  PlusCircle,
  Search,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Sliders,
  Bell,
  Megaphone,
  Activity,
  ShieldCheck,
  Folder,
  Globe,
  CreditCard,
  Phone,
  CheckSquare,
  Sparkles,
  Link,
  Tag,
  Share2,
  Box,
  List,
  Grid,
  Info,
  Layers,
  Store
};

const getIconComponent = (iconName: any) => {
  if (typeof iconName === "string" && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return LayoutDashboard;
};
import UserDashboardWidgets from "../UserDashboardWidgets";
import LatestAnnouncementsWidget from "../LatestAnnouncementsWidget";
import { SupplierAddProduct } from "./SupplierAddProduct";
import { SupplierTickets } from "./SupplierTickets";
import { SupplierProfile } from "./SupplierProfile";
import SupplierPerformancePanel from "./SupplierPerformancePanel";
import {
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification
} from "../../utils/browserNotifications";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
export function SupplierDashboard({
  user,
  onLogout,
  showNotification,
  onUpdateUser,
}: any) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [sysConfig, setSysConfig] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customMenu, setCustomMenu] = useState<any[]>([]);
  
  // Supplier Push Notification States
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [prevPendingIds, setPrevPendingIds] = useState<number[]>([]);

  useEffect(() => {
    if (isBrowserNotificationSupported()) {
      setPushPermission(getNotificationPermission());
    } else {
      setPushPermission("unsupported");
    }
  }, []);

  const handleRequestPushPermission = async () => {
    if (!isBrowserNotificationSupported()) {
      if (showNotification) {
        showNotification("مرورگر شما از اعلان‌های سیستمی پشتیبانی نمی‌کند.", "error");
      }
      return;
    }
    const perm = await requestBrowserNotificationPermission();
    setPushPermission(perm);
    if (perm === "granted") {
      if (showNotification) {
        showNotification("اعلان‌های مرورگر فعال شدند. در زمان ثبت سفارشات منتظر تایید مطلع خواهید شد.", "success");
      }
      showBrowserNotification({
        title: "اعلان‌های تامین‌کننده زوپیت فعال شد! 🎉",
        body: "سیستم اطلاع‌رسانی سفارشات جدید آماده به کار است.",
        sound: false,
      });
    } else if (perm === "denied") {
      if (showNotification) {
        showNotification("دسترسی به اعلان‌ها توسط مرورگر رد شد. لطفاً از تنظیمات مرورگر دسترسی را آزاد کنید.", "error");
      }
    }
  };

  const checkNewSupplierOrders = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };
      const ordRes = await fetch("/api/supplier/orders", { credentials: "include", headers });
      if (ordRes.ok) {
        const orderData = await ordRes.json();
        setOrders(orderData);
        
        const pendingItems = orderData.filter((o: any) => o.status === "REQUESTED" || o.status === "PENDING");
        const pendingIds = pendingItems.map((o: any) => o.id);
        
        if (prevPendingIds.length > 0) {
          const newIds = pendingIds.filter((id: number) => !prevPendingIds.includes(id));
          if (newIds.length > 0) {
            const newItem = pendingItems.find((o: any) => o.id === newIds[0]);
            if (newItem) {
              showBrowserNotification({
                title: "سفارش جدید برای تایید شما 🛒",
                body: `سفارش جدید به شماره ${newItem.orderId} منتظر تایید موجودی توسط شماست.`,
                sound: false,
              });
              if (showNotification) {
                showNotification(`سفارش جدید شماره ${newItem.orderId} برای تایید دریافت شد`, "success");
              }
            }
          }
        }
        setPrevPendingIds(pendingIds);
      }
    } catch (err) {
      console.error("Error checking new supplier orders:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkNewSupplierOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [prevPendingIds]);
  const [walletInfo, setWalletInfo] = useState<any>({
    balance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    history: [],
    payouts: [],
  });
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [productSearch, setProductSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [changingOrder, setChangingOrder] = useState<any>(null);
  const [changeStatus, setChangeStatus] = useState<string>("");
  const [changeTracking, setChangeTracking] = useState<string>("");
  const [inventoryIssueOrder, setInventoryIssueOrder] = useState<any>(null);
  const [issueMessage, setIssueMessage] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  /* Clipboard copy state */
  const [copiedShaba, setCopiedShaba] = useState(false);
  const handleCopyShaba = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShaba(true);
      setTimeout(() => setCopiedShaba(false), 2000);
      if (showNotification) {
        showNotification("شماره شبا با موفقیت در حافظه موقت کپی شد", "success");
      }
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };
  const handleExportCSV = () => {
    if (orders.length === 0) {
      if (showNotification)
        showNotification("هیچ سفارشی برای خروجی گرفتن وجود ندارد.", "error");
      return;
    }
    /* Headers: ID, Product, Quantity, Total Amount, Status, Date */
    const headers = [
      "شناسه سفارش",
      "نام محصول",
      "تعداد",
      "مبلغ کل (تومان)",
      "وضعیت",
      "تاریخ ثبت",
    ];
    const rows = orders.map((o) => [
      o.id,
      o.product?.name || "محصول حذف شده",
      o.quantity,
      o.totalAmount || 0,
      o.status === "REQUESTED"
        ? "در انتظار تایید"
        : o.status === "SUPPLIER_APPROVED"
          ? "تایید شده"
          : o.status === "PAID"
            ? "پرداخت شده"
            : o.status,
      new Date(o.order?.createdAt || o.createdAt).toLocaleDateString("fa-IR"),
    ]);
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
    link.setAttribute(
      "download",
      `سفارشات_تامین_کننده_${user?.brandName || "من"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showNotification) {
      showNotification("فایل اکسل سفارشات با موفقیت دانلود شد", "success");
    }
  };
  /* Withdrawal States */
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [walletSubTab, setWalletSubTab] = useState<"ledger" | "payouts">(
    "ledger",
  );
  /* Settlement Details Modal */
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const fetchSettlementDetails = async (id: string) => {
    setLoadingSettlement(true);
    setIsSettlementModalOpen(true);
    try {
      const res = await fetch(`/api/supplier/settlements/${id}`, { credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedSettlement(data);
      } else {
        showNotification(data.error || "خطا در دریافت اطلاعات تسویه", "error");
        setIsSettlementModalOpen(false);
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
      setIsSettlementModalOpen(false);
    } finally {
      setLoadingSettlement(false);
    }
  };
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawalAmount);
    if (!amount || amount <= 0) {
      showNotification("لطفاً مبلغ معتبری وارد کنید", "error");
      return;
    }
    if (amount > Number(walletInfo.balance || 0)) {
      showNotification("مبلغ درخواستی بیشتر از موجودی قابل تسویه است", "error");
      return;
    }
    setIsSubmittingWithdrawal(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/payout/request", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("درخواست تسویه حساب شما با موفقیت ثبت شد", "success");
        setIsWithdrawalModalOpen(false);
        setWithdrawalAmount("");
        fetchData(); /* Refresh wallet state */
      } else {
        showNotification(
          data.error || "خطا در ثبت درخواست تسویه حساب",
          "error",
        );
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };
  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) < 1000)
      return toast("مبلغ نامعتبر است (حداقل ۱۰۰۰ تومان)", "error");
    try {
      const res = await fetch(`/api/wallet/deposit`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify({ amount: Number(depositAmount) }),
      });
      const data = await res.json();
      if (res.ok && data.payLink) {
        window.location.href = data.payLink;
      } else {
        toast(data.error || "خطا در ارتباط با درگاه پرداخت", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, ordRes, walRes] = await Promise.all([
        fetch("/api/supplier/products", { credentials: "include", headers }),
        fetch("/api/supplier/orders", { credentials: "include", headers }),
        fetch("/api/supplier/reports", { credentials: "include", headers }),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (ordRes.ok) {
        const orderData = await ordRes.json();
        setOrders(orderData);
        
        // Initialize pending order item IDs so we don't spam notifications on initial load
        const pendingItems = orderData.filter((o: any) => o.status === "REQUESTED" || o.status === "PENDING");
        setPrevPendingIds(pendingItems.map((o: any) => o.id));

        const hasNewDirect = orderData.some((o: any) => o.order?.orderSource === "direct" && o.status === "PAID");
        if (hasNewDirect && showNotification) {
          showNotification("شما سفارش پرداخت‌شده و مستقیم جدید از زوپیت دارید!", "success");
        }
      }
      if (walRes.ok) setWalletInfo(await walRes.json());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch("/api/config")
      .then((r) => {
        if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) return {};
        return r.json();
      })
      .then(setSysConfig)
      .catch((err) => console.error("Error fetching config:", err));
    fetch("/api/menus/SUPPLIER")
      .then((r) => {
        if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) return [];
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomMenu(data.filter((item: any) => !item.hidden));
        }
      })
      .catch(console.error);
    fetchData();
  }, []);
  const updateOrderStatus = async (itemId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const url = `/api/supplier/orders/${itemId}`;
      const method = "PATCH";
      const body = { status: newStatus };
      const res = await fetch(url, { credentials: "include",
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === itemId ? { ...o, status: newStatus } : o,
          ),
        );
        showNotification("وضعیت سفارش بروز شد.", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showNotification(errorData.error || "خطا در بروزرسانی سفارش", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    }
  };
  const handleChangeOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingOrder) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/supplier/orders/${changingOrder.id}`, { credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: changeStatus,
          trackingCode: changeTracking,
        }),
      });
      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === changingOrder.id
              ? { ...o, status: changeStatus, trackingCode: changeTracking }
              : o,
          ),
        );
        showNotification("اطلاعات سفارش با موفقیت بروزرسانی شد.", "success");
        setChangingOrder(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showNotification(errorData.error || "خطا در بروزرسانی سفارش", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    }
  };

  const handleInventoryIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryIssueOrder || !issueMessage.trim()) return;
    setSubmittingIssue(true);
    try {
      const token = localStorage.getItem("token") || "";
      const orderItemId = inventoryIssueOrder.items?.[0]?.id || inventoryIssueOrder.itemId || inventoryIssueOrder.id;

      // 1. Submit rejection status to server to trigger automatic wallet debit and admin alerts
      const statusRes = await fetch(`/api/supplier/orders/${orderItemId}`, {
        credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "REJECTED",
          notes: issueMessage
        }),
      });

      // 2. Also submit support ticket for documentation
      await fetch("/api/supplier/tickets", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: `گزارش عدم موجودی سفارش #${inventoryIssueOrder.id}`,
          department: "پشتیبانی فنی",
          priority: "فوری",
          message: issueMessage
        }),
      });

      if (statusRes.ok) {
        if (showNotification) {
          showNotification("گزارش عدم موجودی ثبت شد. سفارش لغو، کیف پول اصلاح و هشدار برای مدیر ارشد ارسال شد.", "success");
        }
        setInventoryIssueOrder(null);
        setIssueMessage("");
        fetchData();
      } else {
        const errData = await statusRes.json().catch(() => ({}));
        if (showNotification) showNotification(errData.error || "خطا در ثبت گزارش عدم موجودی", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const approveBatchOrders = async () => {
    if (selectedItems.length === 0) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/orders/approve-batch", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemIds: selectedItems }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(
          data.message || "سفارشات با موفقیت تایید شدند.",
          "success",
        );
        setOrders(
          orders.map((o) =>
            selectedItems.includes(o.id)
              ? { ...o, status: "SUPPLIER_APPROVED" }
              : o,
          ),
        );
        setSelectedItems([]);
      } else {
        showNotification(data.error || "خطا در تایید گروهی سفارشات", "error");
      }
    } catch (err) {
      showNotification("خطا در تایید گروهی سفارشات", "error");
    }
  };
  const navItems = [
    {
      id: "overview",
      label: "پیشخوان",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "products",
      label: "محصولات من",
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: "add-product",
      label: "افزودن محصول",
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      id: "orders",
      label: "سفارشات",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      id: "wallet",
      label: "کیف پول و تسویه",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      id: "performance",
      label: "امتیاز عملکرد",
      icon: <Scale className="w-5 h-5" />,
    },
    {
      id: "tickets",
      label: "تیکت‌ها",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: "announcements",
      label: "اطلاعیه‌ها و پیام‌ها",
      icon: <Bell className="w-5 h-5" />,
    },
    { id: "profile", label: "پروفایل من", icon: <User className="w-5 h-5" /> },
  ];
  const getDynamicNavItems = () => {
    if (!customMenu || !Array.isArray(customMenu) || customMenu.length === 0) {
      return navItems;
    }
    return customMenu
      .filter((item: any) => item && !item.disabled && !item.hidden)
      .map((item: any) => {
        if (item && React.isValidElement(item.icon)) {
          return item;
        }
        const IconComponent = getIconComponent(item.icon);
        return {
          id: item.id || `menu_${Math.random()}`,
          label: item.label || "منو",
          icon: <IconComponent className="w-5 h-5" />,
        };
      });
  };
  const renderMaintenance = (title: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in w-full">
      <div className="w-20 h-20 bg-warning/20 text-warning rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl">🚧</span>
      </div>
      <h3 className="text-2xl font-black text-primary mb-2">
        در حال بروزرسانی
      </h3>
      <p className="text-muted max-w-md mx-auto leading-relaxed">
        بخش «{title}» در حال حاضر جهت ارتقاء امکانات غیرفعال می‌باشد. از صبوری
        شما سپاسگزاریم.
      </p>
    </div>
  );
  return (
    <div
      id="view-dashboard-supplier"
      className="flex h-screen bg-background w-full"
      dir="rtl"
    >
      
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-card border-l border-border-subtle text-text-primary flex flex-col h-screen sticky top-0 shadow-xl z-20">
        
        <div className="p-6 border-b border-border-subtle bg-surface/30 shrink-0">
          <div className="mb-3">
            <ZopitLogo size="md" />
          </div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Package className="text-primary-default w-5 h-5" /> پنل تامین‌کننده
          </h2>
          <p className="text-text-muted text-xs mt-1 truncate max-w-[200px]">
            {user?.firstName} {user?.lastName} ({user?.brandName})
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          
          {getDynamicNavItems().map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? "bg-primary-default text-white shadow-lg shadow-primary-default/20" : "text-text-secondary hover:bg-surface hover:text-text-primary"}`}
              aria-label={item.label}
            >
              
              <span className={activeTab === item.id ? "text-white" : "text-text-muted"}>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border-subtle space-y-4 shrink-0 bg-card">
          
          <div className="bg-surface/50 p-4 rounded-xl text-center border border-border-default">
            
            <p className="text-xs text-text-primary font-medium mb-2">
              نیاز به راهنمایی دارید؟
            </p>
            <p className="text-[10px] text-text-muted mb-2 leading-relaxed">
              برای هرگونه سوال، ابهام یا مشکل، لطفاً تیکت پشتیبانی ثبت کنید:
            </p>
            <button
              onClick={() => setActiveTab("tickets")}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-default text-inverse rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>ارسال تیکت به مدیر کل</span>
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            aria-label="خروج از حساب کاربری"
          >
            
            <LogOut className="w-5 h-5" /> خروج از حساب
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="bg-card px-8 py-5 flex items-center justify-between border-b border-subtle shadow-sm relative z-40">
          <h1 className="text-2xl font-bold text-primary">
            {getDynamicNavItems().find((i) => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <div className="bg-surface text-muted text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" /> حساب فعال
            </div>
            <button
              onClick={() => setShowEducationModal(true)}
              className="p-2 bg-surface hover:bg-emerald-500/10 text-muted hover:text-emerald-600 rounded-xl transition-all duration-200 border border-subtle hover:border-emerald-200 cursor-pointer flex items-center justify-center gap-1.5"
              title="مرکز آموزش و ویدیوهای راهنما"
            >
              <GraduationCap className="w-5 h-5 text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 hidden md:inline-block">آموزش</span>
            </button>
            <NotificationBell
              userRole="SUPPLIER"
              onNavigateTab={(tabId) => setActiveTab(tabId)}
            />
          </div>
        </header>

        <EducationModal
          isOpen={showEducationModal}
          onClose={() => setShowEducationModal(false)}
        />
        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default"></div>
            </div>
          ) : (
            <>
              
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Supplier Order / Request Announcement Alert */}
                  {orders.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/40 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md animate-pulse">
                          <Bell className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-primary flex items-center gap-2">
                            <span>اطلاعیه ثبت درخواست جدید برای تامین‌کننده</span>
                            <span className="bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                              {orders.filter(o => o.status === "REQUESTED" || o.status === "PAID" || o.status === "PENDING").length} درخواست جدید
                            </span>
                          </h3>
                          <p className="text-xs text-secondary mt-1 leading-relaxed">
                            همکار گرامی، درخواست‌ها و سفارش‌های جدیدی از طرف فروشگاه‌ها و معرفی‌کنندگان زوپیت برای مجموعه شما ثبت شده است. جهت پردازش و ارسال، لیست سفارشات را بررسی نمایید.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        {pushPermission !== "granted" && (
                          <button
                            type="button"
                            onClick={handleRequestPushPermission}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <BellRing className="w-4 h-4 animate-bounce" />
                            <span>فعال‌سازی اعلان مرورگر</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab("orders")}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>مشاهده و بررسی سفارشات</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Welcome Banner */}
                  <div className="bg-gradient-to-r from-primary-default via-indigo-600 to-primary-hover rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="relative z-10">
                      <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-white">
                        سلام، {user?.firstName || "همکار"} عزیز! 👋
                      </h2>
                      <p className="text-white/90 text-sm md:text-base max-w-lg mb-6 leading-relaxed">
                        به پنل تامین‌کنندگان خوش آمدید. در اینجا می‌توانید
                        محصولات خود را مدیریت کنید و وضعیت سفارشات و
                        تسویه‌حساب‌ها را پیگیری نمایید.
                      </p>
                      <button
                        onClick={() => setActiveTab("add-product")}
                        className="bg-white text-primary-default hover:bg-slate-100 px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        افزودن محصول جدید
                      </button>
                    </div>
                  </div>

                  {/* Highly Visible Label Printing Box for Supplier */}
                  {(() => {
                    const pendingLabelOrders = orders.filter(
                      (o) => (o.status === "PENDING_POSTAL_LABEL" || o.order?.status === "PENDING_POSTAL_LABEL" || o.status === "PAID" || o.status === "PREPARING") && o.order?.postalLabel
                    );
                    if (pendingLabelOrders.length === 0) return null;
                    return (
                      <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/10 border-2 border-rose-500/30 p-6 rounded-3xl shadow-lg space-y-4">
                        <div className="flex items-center justify-between border-b border-rose-200/50 dark:border-rose-800/30 pb-3">
                          <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-400">
                            <Printer className="w-6 h-6 animate-pulse" />
                            <h3 className="text-base font-extrabold">
                              📥 صدور فوری لیبل‌های پستی جدید (آماده چاپ)
                            </h3>
                          </div>
                          <span className="bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md shadow-rose-600/20 animate-bounce">
                            {pendingLabelOrders.length.toLocaleString('fa-IR')} سفارش نیازمند چاپ فوری
                          </span>
                        </div>
                        <p className="text-xs text-rose-900/85 dark:text-rose-300/80 leading-relaxed font-bold">
                          همکار گرامی، هزینه ارسال سفارشات زیر پرداخت شده و لیبل پستی آن‌ها توسط مدیریت بارگذاری گردیده است. طبق قوانین پلتفرم، جهت جلوگیری از جریمه دیرکرد، لطفاً سریعاً نسبت به دانلود، چاپ و الصاق برچسب پستی روی کارتن مرسوله اقدام کرده و بسته را تحویل پست/تیپاکس دهید:
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pendingLabelOrders.map((o) => (
                            <div key={o.id} className="bg-white/80 dark:bg-card/80 p-4 rounded-2xl border border-rose-500/20 flex flex-col justify-between gap-3 shadow-xs">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-rose-800 dark:text-rose-400">
                                    سفارش شماره #{o.id.toLocaleString('fa-IR')}
                                  </span>
                                  <span className="text-[10px] bg-slate-100 dark:bg-surface text-secondary px-2 py-0.5 rounded-lg font-bold">
                                    {o.order?.shippingMethod === "TIPAX" ? "ارسال با تیپاکس" : "ارسال با پست"}
                                  </span>
                                </div>
                                <h4 className="text-xs font-extrabold text-primary pt-1">
                                  {o.product?.name} <span className="text-muted">({o.quantity || 1} عدد)</span>
                                </h4>
                                <p className="text-[10px] text-muted font-medium">
                                  خریدار: {o.order?.shippingRecipientName || "مشتری زوپیت"}
                                </p>
                              </div>
                              
                              <a
                                href={o.order?.postalLabel}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white hover:text-white py-2.5 rounded-xl font-black text-xs text-center transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10 active:scale-95"
                              >
                                <Printer className="w-4 h-4" />
                                چاپ لیبل پستی پلتفرم
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div
                      className="bg-gradient-to-br from-card to-background p-7 rounded-3xl shadow-sm border border-subtle flex items-center gap-5 hover:shadow-lg hover:border-primary-default/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
                      onClick={() => setActiveTab("products")}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-default/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      
                      <div className="w-16 h-16 rounded-2xl bg-primary-default/10 text-primary-default flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-default group-hover:text-inverse group-hover:shadow-md relative z-10">
                        
                        <Package className="w-8 h-8" />
                      </div>
                      <div className="relative z-10">
                        
                        <p className="text-sm text-muted font-bold mb-1 block">
                          تعداد محصولات
                        </p>
                        <h3 className="text-3xl font-black text-primary group-hover:text-primary-hover transition-colors">
                          {products.length}
                        </h3>
                      </div>
                    </div>
                    <div
                      className="bg-gradient-to-br from-card to-background p-7 rounded-3xl shadow-sm border border-subtle flex items-center gap-5 hover:shadow-lg hover:border-success/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
                      onClick={() => setActiveTab("orders")}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-success/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      
                      <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-success group-hover:text-inverse group-hover:shadow-md relative z-10">
                        
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                      <div className="relative z-10">
                        
                        <p className="text-sm text-muted font-bold mb-1 block">
                          سفارشات در جریان
                        </p>
                        <h3 className="text-3xl font-black text-primary group-hover:text-primary-hover transition-colors">
                          
                          {
                            orders.filter((o) => o.status !== "DELIVERED")
                              .length
                          }
                        </h3>
                      </div>
                    </div>
                    <div
                      className="bg-gradient-to-br from-card to-background p-7 rounded-3xl shadow-sm border border-subtle flex items-center gap-5 hover:shadow-lg hover:border-warning/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
                      onClick={() => setActiveTab("wallet")}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-warning/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      
                      <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-warning group-hover:text-inverse group-hover:shadow-md relative z-10">
                        
                        <Wallet className="w-8 h-8" />
                      </div>
                      <div className="relative z-10">
                        
                        <p className="text-sm text-muted font-bold mb-1 block">
                          موجودی کیف پول (تومان)
                        </p>
                        <h3 className="text-2xl font-black text-primary group-hover:text-primary-hover transition-colors">
                          
                          {(
                            walletInfo.wallet?.balance || 0
                          ).toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Recent Orders */}
                    <div className="lg:col-span-2 bg-card p-6 rounded-3xl shadow-sm border border-subtle">
                      
                      <div className="flex justify-between items-center mb-6">
                        
                        <h3 className="text-lg font-bold text-primary">
                          آخرین سفارشات
                        </h3>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="text-primary-default text-sm font-semibold hover:text-primary-hover"
                        >
                          مشاهده همه
                        </button>
                      </div>
                      {orders.length > 0 ? (
                        <div className="space-y-3">
                          
                          {orders.slice(0, 4).map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-4 bg-background hover:bg-surface transition-colors rounded-2xl border border-subtle"
                            >
                              
                              <div className="flex items-center gap-4">
                                
                                <div
                                  className={`p-3 rounded-xl ${order.status === "REQUESTED" ? "bg-warning/20 text-warning animate-pulse" : order.status === "SUPPLIER_APPROVED" ? "bg-blue-100 text-blue-600" : order.status === "PAID" ? "bg-success/20 text-success" : "bg-surface text-muted"}`}
                                >
                                  
                                  <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                  
                                  <p className="font-bold text-primary">
                                    سفارش #{order.id}
                                  </p>
                                  <p className="text-xs text-muted mt-1">
                                    
                                    {order.product?.name}
                                  </p>
                                  {order.status === "REQUESTED" && (
                                    <p className="text-xs text-warning font-medium mt-1 bg-warning/10 p-2 rounded-lg border border-amber-200/40">
                                      
                                      انتظار درخواست برای محصول
                                      <span className="font-bold">
                                        {order.product?.name}
                                      </span>
                                      را داریم.
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-left flex flex-col items-end">
                                
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold inline-block mb-1 ${order.status === "REQUESTED" ? "bg-warning/20 text-warning" : order.status === "SUPPLIER_APPROVED" ? "bg-blue-100 text-blue-700" : order.status === "PAID" ? "bg-success/20 text-success" : "bg-surface text-secondary"}`}
                                >
                                  
                                  {order.status === "REQUESTED"
                                    ? "در انتظار تایید شما"
                                    : order.status === "SUPPLIER_APPROVED"
                                      ? "تایید شده"
                                      : order.status === "PAID"
                                        ? "پرداخت شده"
                                        : order.status}
                                </span>
                                <p className="text-xs text-muted font-mono mt-1">
                                  
                                  {order.order?.createdAt
                                    ? new Date(
                                        order.order.createdAt,
                                      ).toLocaleDateString("fa-IR")
                                    : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          
                          <Package className="w-12 h-12 text-inverse mx-auto mb-3" />
                          <p className="text-muted font-medium">
                            سفارشی ثبت نشده است
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Quick Actions */}
                    <div className="space-y-6">
                      
                      <div className="bg-card rounded-3xl p-6 text-primary border border-subtle shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[340px]">
                        
                        <div className="relative z-10">
                          
                          <h3 className="text-lg font-bold mb-6 text-primary">
                            دسترسی سریع
                          </h3>
                          <div className="space-y-3">
                            
                            <button
                              onClick={() => setActiveTab("add-product")}
                              className="w-full flex items-center justify-between p-4 bg-surface hover:bg-subtle/40 rounded-2xl transition-colors border border-subtle text-primary font-bold cursor-pointer"
                            >
                              
                              <span className="font-semibold text-primary">
                                ثبت محصول جدید
                              </span>
                              <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </button>
                            <button
                              onClick={() => setActiveTab("tickets")}
                              className="w-full flex items-center justify-between p-4 bg-surface hover:bg-subtle/40 rounded-2xl transition-colors border border-subtle text-primary font-bold cursor-pointer"
                            >
                              
                              <span className="font-semibold text-primary">
                                پشتیبانی و تیکت‌ها
                              </span>
                              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </button>
                            <button
                              onClick={() => setActiveTab("profile")}
                              className="w-full flex items-center justify-between p-4 bg-surface hover:bg-subtle/40 rounded-2xl transition-colors border border-subtle text-primary font-bold cursor-pointer"
                            >
                              
                              <span className="font-semibold text-primary">
                                ویرایش پروفایل
                              </span>
                              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </button>
                          </div>
                        </div>
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
                      </div>
                      <UserDashboardWidgets role="SUPPLIER" />
                    </div>
                  </div>
                  {/* Business Performance & Insights Section */}
                  <div className="bg-card p-6 rounded-3xl shadow-sm border border-subtle">
                    
                    <div className="flex items-center gap-3 mb-6">
                      
                      <div className="p-2.5 bg-primary-default/10 text-primary-default rounded-xl">
                        
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        
                        <h3 className="text-lg font-bold text-primary">
                          تحلیل عملکرد و بینش‌های کسب‌وکار
                        </h3>
                        <p className="text-xs text-muted">
                          نمودارهای هوشمند از حجم فروش ماهیانه و برترین
                          دسته‌بندی‌های محصولات شما
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* Monthly Sales Volume */}
                      <div className="bg-background/50 p-5 rounded-2xl border border-subtle/80">
                        
                        <h4 className="text-sm font-bold text-secondary mb-4">
                          نمودار حجم فروش ماهیانه (۶ ماه اخیر)
                        </h4>
                        <div className="w-full h-64">
                          
                          <ResponsiveContainer width="100%" height="100%">
                            
                            <LineChart
                              data={[
                                { month: "فروردین", "حجم فروش": 12000000 },
                                { month: "اردیبهشت", "حجم فروش": 18000000 },
                                { month: "خرداد", "حجم فروش": 15000000 },
                                { month: "تیر", "حجم فروش": 22000000 },
                                { month: "مرداد", "حجم فروش": 31000000 },
                                { month: "شهریور", "حجم فروش": 28000000 },
                              ]}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              
                              <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                tickFormatter={(value) =>
                                  `${(value / 1000000).toFixed(1)}M`
                                }
                              />
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                formatter={(value: any) => [
                                  (value !== null && value !== undefined && typeof value.toLocaleString === "function" ? value.toLocaleString() : String(value || 0)) + " تومان",
                                  "حجم فروش",
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="حجم فروش"
                                stroke="#4f46e5"
                                strokeWidth={3.5}
                                dot={{
                                  r: 5,
                                  stroke: "#4f46e5",
                                  strokeWidth: 2,
                                  fill: "#fff",
                                }}
                                activeDot={{ r: 7 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      {/* Top Selling Categories */}
                      <div className="bg-background/50 p-5 rounded-2xl border border-subtle/80">
                        
                        <h4 className="text-sm font-bold text-secondary mb-4">
                          مقایسه فروش دسته‌بندی‌های محصولات شما
                        </h4>
                        <div className="w-full h-64">
                          
                          <ResponsiveContainer width="100%" height="100%">
                            
                            <BarChart
                              data={[
                                { name: "آرایشی و بهداشتی", فروش: 45 },
                                { name: "پوشاک و مد", فروش: 32 },
                                { name: "الکترونیک", فروش: 18 },
                                { name: "لوازم خانگی", فروش: 12 },
                                { name: "کتاب و هنر", فروش: 25 },
                              ]}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                              }}
                              barSize={24}
                            >
                              
                              <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 10 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                              />
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                              />
                              <Bar
                                dataKey="فروش"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* PRODUCTS TAB */}
              {activeTab === "products" &&
                (sysConfig["SUPPLIER_CATALOG_ENABLED"] === false ? (
                  renderMaintenance("محصولات من")
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    
                    <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-subtle">
                      
                      <div className="relative w-64">
                        
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="جستجوی محصول..."
                          className="w-full pl-10 pr-4 py-2 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default"
                        />
                        <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                      </div>
                      <button
                        onClick={() => setActiveTab("add-product")}
                        className="bg-primary-default text-inverse px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                      >
                        
                        <Plus className="w-4 h-4" /> افزودن محصول جدید
                      </button>
                    </div>
                    <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
                      
                      {products.filter((p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase())) ||
                        String(p.id).includes(productSearch)
                      ).length > 0 ? (
                        <table className="w-full text-right text-sm">
                          
                          <thead className="bg-background border-b border-subtle text-muted font-medium">
                            
                            <tr>
                              
                              <th className="px-6 py-4">شناسه</th>
                              <th className="px-6 py-4">نام محصول</th>
                              <th className="px-6 py-4">برند</th>
                              <th className="px-6 py-4">موجودی</th>
                              <th className="px-6 py-4">قیمت پایه (تومان)</th>
                              <th className="px-6 py-4">وضعیت</th>
                              <th className="px-6 py-4">عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            
                            {products.filter((p) =>
                              p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                              (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase())) ||
                              String(p.id).includes(productSearch)
                            ).map((product) => (
                              <tr
                                key={product.id}
                                className="hover:bg-background transition-colors"
                              >
                                
                                <td className="px-6 py-4 font-mono text-muted">
                                  #{product.id}
                                </td>
                                <td className="px-6 py-4 font-semibold text-primary">
                                  {product.name}
                                </td>
                                <td className="px-6 py-4 text-muted">
                                  {product.brand || "-"}
                                </td>
                                <td className="px-6 py-4 text-muted">
                                  {product.variants?.[0]?.stock || 0}
                                </td>
                                <td className="px-6 py-4 font-bold text-primary">
                                  
                                  {product.supplierBasePrice.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                  
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      product.status === "ACTIVE" || product.status === "PUBLISHED"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : product.status === "PENDING_APPROVAL" || product.status === "SUSPENDED"
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        : product.status === "REJECTED"
                                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {product.status === "ACTIVE" || product.status === "PUBLISHED"
                                      ? "فعال"
                                      : product.status === "REJECTED"
                                      ? "رد شده"
                                      : "در انتظار تایید"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  
                                  <button
                                    onClick={() => {
                                      setProductToEdit(product);
                                      setActiveTab("edit-product");
                                    }}
                                    className="text-primary-default hover:text-primary-hover bg-primary-default/10 hover:bg-primary-default/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    
                                    ویرایش
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-16 text-muted">
                          
                          <Package className="w-16 h-16 mx-auto text-inverse mb-4" />
                          <p className="text-lg font-medium text-secondary mb-1">
                            محصولی یافت نشد
                          </p>
                          <p className="text-sm">
                            شما هنوز محصولی در فروشگاه خود ثبت نکرده‌اید.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {/* ORDERS TAB */}
              {activeTab === "orders" &&
                (() => {
                  if (sysConfig["SUPPLIER_ORDERS_ENABLED"] === false) {
                    return renderMaintenance("سفارشات");
                  }
                  const approvableOrders = orders.filter(
                    (o) => o.status === "REQUESTED" || o.status === "PENDING",
                  );
                  return (
                    <div className="space-y-6 animate-fade-in">
                      
                      <div className="flex items-center justify-between">
                        
                        <h2 className="text-xl font-bold text-primary">
                          مدیریت سفارشات دریافتی
                        </h2>
                        <button
                          onClick={handleExportCSV}
                          className="bg-success/10 text-success hover:bg-success/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-emerald-200 cursor-pointer shadow-sm shadow-emerald-50"
                        >
                          
                          <FileText className="w-5 h-5" /> خروجی اکسل (CSV)
                        </button>
                      </div>
                      {selectedItems.length > 0 && (
                        <div className="bg-surface border border-blue-200/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
                          
                          <div className="flex items-center gap-3">
                            
                            <div className="p-3 bg-primary-default text-inverse rounded-xl">
                              
                              <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                              
                              <p className="font-bold text-primary-hover text-sm">
                                
                                تعداد {selectedItems.length} سفارش برای تایید
                                گروهی انتخاب شده است.
                              </p>
                              <p className="text-xs text-primary-hover mt-0.5">
                                
                                می‌توانید تمام این سفارشات را با یک کلیک تایید
                                کنید.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={approveBatchOrders}
                            className="w-full md:w-auto bg-primary-default text-inverse px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                          >
                            
                            تایید گروهی سفارشات ({selectedItems.length})
                          </button>
                        </div>
                      )}
                      <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
                        
                        {orders.length > 0 ? (
                          <div className="overflow-x-auto">
                            
                            <table className="w-full text-right text-sm">
                              
                              <thead className="bg-background border-b border-subtle text-muted font-medium">
                                
                                <tr>
                                  
                                  <th className="px-6 py-4 w-12 text-center">
                                    
                                    <input
                                      type="checkbox"
                                      className="rounded border-default text-primary-default focus:ring-primary-default w-4 h-4 cursor-pointer"
                                      checked={
                                        approvableOrders.length > 0 &&
                                        selectedItems.length ===
                                          approvableOrders.length
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedItems(
                                            approvableOrders.map((o) => o.id),
                                          );
                                        } else {
                                          setSelectedItems([]);
                                        }
                                      }}
                                    />
                                  </th>
                                  <th className="px-6 py-4">سفارش</th>
                                  <th className="px-6 py-4">محصول / SKU</th>
                                  <th className="px-6 py-4">تعداد</th>
                                  <th className="px-6 py-4">موجودی فعلی</th>
                                  <th className="px-6 py-4">یادداشت</th>
                                  <th className="px-6 py-4">وضعیت</th>
                                  <th className="px-6 py-4">عملیات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                
                                {orders.map((order) => {
                                  const isApprovable =
                                    order.status === "REQUESTED" ||
                                    order.status === "PENDING";
                                  const isSelected = selectedItems.includes(
                                    order.id,
                                  );
                                  return (
                                    <tr
                                      key={order.id}
                                      className={`hover:bg-background transition-colors ${isSelected ? "bg-primary-default/10/30" : ""}`}
                                    >
                                      
                                      <td className="px-6 py-4 text-center">
                                        
                                        {isApprovable ? (
                                          <input
                                            type="checkbox"
                                            className="rounded border-default text-primary-default focus:ring-primary-default w-4 h-4 cursor-pointer"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedItems([
                                                  ...selectedItems,
                                                  order.id,
                                                ]);
                                              } else {
                                                setSelectedItems(
                                                  selectedItems.filter(
                                                    (id) => id !== order.id,
                                                  ),
                                                );
                                              }
                                            }}
                                          />
                                        ) : (
                                          <span className="text-inverse text-xs">
                                            -
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        
                                        <div className="font-mono font-medium text-primary-default">
                                          #{order.id}
                                        </div>
                                        {order.order?.createdAt && (
                                          <div className="text-xs text-muted mt-1">
                                            
                                            {new Date(
                                              order.order.createdAt,
                                            ).toLocaleDateString("fa-IR")}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        
                                        <div className="text-primary font-medium">
                                          {order.product?.name}
                                        </div>
                                        <div className="text-xs text-muted mt-1">
                                          {order.product?.sku || "بدون SKU"}
                                        </div>
                                        {/* Streamlined Store & Shipping Details */}
                                        <div className="mt-2 space-y-1.5 text-xs bg-surface p-2.5 rounded-xl border border-subtle max-w-[300px]">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-secondary font-bold text-xs truncate">
                                              فروشگاه: {order.order?.store?.storeName || order.order?.store?.username || "نامشخص"}
                                            </span>
                                            {order.order?.status === "PAID" || order.order?.status === "PROCESSING" || order.order?.status === "SHIPPED" || order.order?.status === "COMPLETED" ? (
                                              <span className="text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-500/20 shrink-0">
                                                پرداخت شده
                                              </span>
                                            ) : (
                                              <span className="text-rose-700 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px] font-black border border-rose-500/20 shrink-0">
                                                در انتظار پرداخت
                                              </span>
                                            )}
                                          </div>

                                          {order.order?.postalLabel ? (
                                            <div className="pt-1.5 border-t border-subtle">
                                              <a
                                                href={order.order.postalLabel}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/20"
                                              >
                                                <Printer className="w-4 h-4" />
                                                چاپ لیبل پستی مرسوله
                                              </a>
                                            </div>
                                          ) : (
                                            <div className="pt-1 border-t border-subtle">
                                              {order.order?.status === "PAID" || order.order?.status === "PENDING_POSTAL_LABEL" ? (
                                                <span className="text-indigo-600 font-bold text-[11px] flex items-center gap-1">
                                                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                                  در انتظار صدور لیبل توسط مدیریت
                                                </span>
                                              ) : (
                                                <span className="text-muted font-medium text-[10px] block">
                                                  صدور لیبل پس از پرداخت نهایی فروشگاه
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        {order.status === "REQUESTED" && (
                                          <div className="mt-2 p-2 bg-warning/10 rounded-lg border border-amber-200/50 text-xs text-amber-800 max-w-[280px]">
                                            
                                            <div className="font-bold flex items-center gap-1 mb-1">
                                              
                                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                                              درخواست تأیید کالا
                                            </div>
                                            انتظار درخواست برای محصول
                                            <span className="font-semibold text-primary-hover">
                                              {order.product?.name}
                                            </span>
                                            را داریم.
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-primary font-bold">
                                        
                                        {order.quantity || 1}
                                      </td>
                                      <td className="px-6 py-4">
                                        
                                        <span
                                          className={`font-bold ${order.product?.inventory >= order.quantity ? "text-success" : "text-danger"}`}
                                        >
                                          
                                          {order.product?.inventory}
                                        </span>
                                      </td>
                                      <td
                                        className="px-6 py-4 text-xs text-muted max-w-[150px] truncate"
                                        title={order.notes}
                                      >
                                        
                                        {order.notes || "-"}
                                      </td>
                                      <td className="px-6 py-4">
                                        
                                        <span
                                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${order.status === "REQUESTED" ? "bg-warning/20 text-warning" : order.status === "SUPPLIER_APPROVED" ? "bg-blue-100 text-blue-700" : order.status === "WAITING_FOR_PAYMENT" ? "bg-purple-100 text-purple-700" : order.status === "PAID" ? "bg-success/20 text-success" : order.status === "PREPARING" ? "bg-primary-default/20 text-primary-hover" : order.status === "COMPLETED" ? "bg-success/20 text-success" : order.status === "REJECTED" ? "bg-danger/20 text-danger" : order.status === "CANCELLED" ? "bg-surface text-secondary" : "bg-surface text-secondary"}`}
                                        >
                                          
                                          {order.status === "REQUESTED"
                                            ? "در انتظار تایید شما"
                                            : order.status ===
                                                "SUPPLIER_APPROVED"
                                              ? "تایید شده"
                                              : order.status ===
                                                  "WAITING_FOR_PAYMENT"
                                                ? "در انتظار پرداخت"
                                                : order.status === "PAID"
                                                  ? "پرداخت شده"
                                                  : order.status === "PREPARING"
                                                    ? "در حال آماده‌سازی"
                                                    : order.status ===
                                                        "COMPLETED"
                                                      ? "تکمیل شده"
                                                      : order.status ===
                                                          "REJECTED"
                                                        ? "رد شده"
                                                        : order.status ===
                                                            "CANCELLED"
                                                          ? "لغو شده"
                                                          : order.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 flex flex-col gap-2 min-w-[170px]">
                                        {order.order?.orderSource === "direct" ? (
                                          <>
                                            <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs space-y-1 font-bold text-center">
                                              <div className="flex items-center justify-center gap-1.5 text-emerald-700">
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                سفارش قطعی زوپیت
                                              </div>
                                              <p className="text-[10px] font-medium text-slate-500 mt-1 leading-relaxed">
                                                این سفارش مستقیم و پرداخت‌شده است.
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setInventoryIssueOrder(order);
                                                setIssueMessage("");
                                              }}
                                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-black rounded-xl border border-danger/20 transition-all cursor-pointer"
                                            >
                                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                              گزارش مشکل موجودی
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {(order.status === "REQUESTED" ||
                                              order.status === "PENDING") && (
                                              <>
                                                
                                                <button
                                                  onClick={() =>
                                                    updateOrderStatus(
                                                      order.id,
                                                      "SUPPLIER_APPROVED",
                                                    )
                                                  }
                                                  className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-success hover:bg-emerald-700 active:scale-95 text-inverse text-xs font-bold rounded-xl transition-all duration-300 shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/25 hover:shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-success"
                                                  aria-label={`تایید سفارش شماره ${order.id}`}
                                                >
                                                  
                                                  <CheckCircle className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                                  تایید سفارش
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    updateOrderStatus(
                                                      order.id,
                                                      "REJECTED",
                                                    )
                                                  }
                                                  className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-danger hover:bg-rose-700 active:scale-95 text-inverse text-xs font-bold rounded-xl transition-all duration-300 shadow-sm shadow-rose-600/10 hover:shadow-rose-600/25 hover:shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500"
                                                  aria-label={`رد سفارش شماره ${order.id}`}
                                                >
                                                  
                                                  <XCircle className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                                  رد سفارش
                                                </button>
                                              </>
                                            )}
                                            {/* Change Order details button with RefreshCw */}
                                            {["PAID", "PREPARING", "SHIPPED"].includes(order.status) ? (
                                              <button
                                                onClick={() => {
                                                  setChangingOrder(order);
                                                  setChangeStatus(order.status);
                                                  setChangeTracking(
                                                    order.trackingCode || "",
                                                  );
                                                }}
                                                className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-warning hover:bg-amber-600 active:scale-95 text-inverse text-xs font-bold rounded-xl transition-all duration-300 shadow-sm shadow-amber-500/10 hover:shadow-amber-500/25 hover:shadow-md cursor-pointer outline-none"
                                                aria-label={`درج اطلاعات ارسال برای سفارش شماره ${order.id}`}
                                              >
                                                <Truck className="w-4 h-4 shrink-0" />
                                                درج اطلاعات ارسال
                                              </button>
                                            ) : (
                                              !["REQUESTED", "PENDING", "REJECTED"].includes(order.status) && (
                                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1.5 rounded-xl border border-zinc-200/50">در انتظار پرداخت فروشگاه</span>
                                              )
                                            )}
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-16 text-muted">
                            
                            <ShoppingCart className="w-16 h-16 mx-auto text-muted mb-4" />
                            <p className="text-lg font-medium text-secondary mb-1">
                              سفارشی ندارید
                            </p>
                            <p className="text-sm">
                              هنوز سفارشی برای محصولات شما ثبت نشده است.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              {/* WALLET TAB */}
              {activeTab === "wallet" &&
                (sysConfig["SUPPLIER_FINANCIAL_ENABLED"] === false ? (
                  renderMaintenance("کیف پول و تسویه")
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden md:col-span-2 flex flex-col justify-between min-h-[220px]">
                        
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary-default rounded-full blur-3xl opacity-30"></div>
                        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full w-full">
                          
                          <div>
                            
                            <p className="text-indigo-200 font-medium mb-1">
                              موجودی قابل تسویه (تومان)
                            </p>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                              
                              {Number(
                                walletInfo.balance || 0,
                              ).toLocaleString()}
                            </h2>
                            <div className="flex flex-col gap-1.5 mt-4 text-xs text-indigo-200">
                              
                              <div className="flex items-center gap-2">
                                
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span>شماره شبا ثبت شده:</span>
                                <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded text-xs">
                                  {user?.shaba || "ثبت نشده"}
                                </span>
                              </div>
                              {user?.bankName && (
                                <div className="flex items-center gap-2">
                                  
                                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">
                                    🏦
                                  </span>
                                  <span>نام بانک:</span>
                                  <span className="text-white font-medium">
                                    {user.bankName}
                                  </span>
                                </div>
                              )}
                              {user?.accountHolderName && (
                                <div className="flex items-center gap-2">
                                  
                                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">
                                    👤
                                  </span>
                                  <span>صاحب حساب:</span>
                                  <span className="text-white font-medium">
                                    {user.accountHolderName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 w-full md:w-auto">
                            
                            <button
                              onClick={() => setIsWithdrawalModalOpen(true)}
                              className="bg-white text-indigo-950 px-6 py-3.5 rounded-2xl font-extrabold shadow-lg hover:bg-indigo-50 active:scale-95 transition-all whitespace-nowrap self-stretch md:self-auto text-center cursor-pointer"
                            >
                              
                              درخواست تسویه حساب
                            </button>
                            <div className="flex gap-2">
                              
                              <input
                                type="number"
                                placeholder="مبلغ شارژ"
                                value={depositAmount}
                                onChange={(e) =>
                                  setDepositAmount(e.target.value)
                                }
                                className="bg-white/15 border border-white/20 text-white placeholder:text-white/60 rounded-xl px-3 py-2 outline-none focus:bg-white/25 focus:border-white/40 transition-all w-28 text-sm"
                              />
                              <button
                                onClick={handleDeposit}
                                className="bg-primary-default text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-hover active:scale-95 transition-all whitespace-nowrap cursor-pointer shadow-md shadow-primary-default/20"
                              >
                                
                                شارژ حساب
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        
                        <div className="bg-warning/10 rounded-3xl p-5 border border-amber-100 shadow-sm flex flex-col justify-center">
                          
                          <p className="text-amber-800 font-medium mb-1 text-sm">
                            موجودی در انتظار تسویه (تومان)
                          </p>
                          <h3 className="text-2xl font-bold text-amber-900">
                            
                            {Number(
                              walletInfo.pendingBalance || 0,
                            ).toLocaleString()}
                          </h3>
                          <div className="mt-2 text-xs font-medium text-warning flex items-center gap-1">
                            
                            <Clock className="w-3 h-3 text-warning" /> سفارش‌های
                            در جریان (تسویه‌نشده)
                          </div>
                        </div>
                        <div className="bg-card rounded-3xl p-5 border border-subtle shadow-sm flex flex-col justify-center">
                          
                          <p className="text-muted font-medium mb-1 text-sm">
                            کل درآمدهای شما (تومان)
                          </p>
                          <h3 className="text-2xl font-bold text-primary">
                            
                            {Number(
                              walletInfo.totalEarnings || 0,
                            ).toLocaleString()}
                          </h3>
                          <div className="mt-2 text-xs font-medium text-success flex items-center gap-1">
                            
                            <TrendingUp className="w-3 h-3" /> درآمد کل کسب
                            شده
                          </div>
                        </div>
                        <div className="bg-card rounded-3xl p-5 border border-subtle shadow-sm flex flex-col justify-center">
                          
                          <p className="text-muted font-medium mb-1 text-sm">
                            کل تسویه شده (تومان)
                          </p>
                          <h3 className="text-2xl font-bold text-primary">
                            
                            {Number(
                              walletInfo.totalWithdrawn || 0,
                            ).toLocaleString()}
                          </h3>
                          <div className="mt-2 text-xs font-medium text-primary-default flex items-center gap-1">
                            
                            <Wallet className="w-3 h-3" /> مبالغ واریز شده به
                            حساب
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
                      
                      <div className="p-6 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="flex gap-6 border-b border-subtle pb-0">
                          
                          <button
                            onClick={() => setWalletSubTab("ledger")}
                            className={`pb-3 font-bold text-base transition-colors relative ${walletSubTab === "ledger" ? "text-primary-default border-b-2 border-primary-default" : "text-muted hover:text-muted"}`}
                          >
                            
                            دفتر معین مالی (تراکنش‌ها)
                          </button>
                          <button
                            onClick={() => setWalletSubTab("payouts")}
                            className={`pb-3 font-bold text-base transition-colors relative ${walletSubTab === "payouts" ? "text-primary-default border-b-2 border-primary-default" : "text-muted hover:text-muted"}`}
                          >
                            
                            تاریخچه درخواست‌های تسویه حساب
                          </button>
                        </div>
                        {walletSubTab === "ledger" && (
                          <div className="flex gap-2">
                            
                            <select className="bg-background border border-subtle text-secondary text-sm rounded-lg focus:ring-primary-default focus:border-primary-default block p-2">
                              
                              <option value="">همه وضعیت‌ها</option>
                              <option value="COMPLETED">موفق</option>
                              <option value="PENDING">در حال انجام</option>
                              <option value="FAILED">ناموفق</option>
                            </select>
                            <select className="bg-background border border-subtle text-secondary text-sm rounded-lg focus:ring-primary-default focus:border-primary-default block p-2">
                              
                              <option value="">همه انواع</option>
                              <option value="ORDER_REVENUE">درآمد فروش</option>
                              <option value="WITHDRAWAL">
                                برداشت/تسویه
                              </option>
                            </select>
                          </div>
                        )}
                      </div>
                      {walletSubTab === "ledger" ? (
                        walletInfo.history && walletInfo.history.length > 0 ? (
                          <div className="divide-y divide-slate-100">
                            
                            {walletInfo.history.map((tx: any) => (
                              <div
                                key={tx.id}
                                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-background transition-colors gap-4"
                              >
                                
                                <div className="flex items-center gap-4">
                                  
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tx.type === "ORDER_REVENUE" || tx.type === "CREDIT" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}
                                  >
                                    
                                    {tx.type === "ORDER_REVENUE" ||
                                    tx.type === "CREDIT" ? (
                                      <TrendingUp className="w-6 h-6" />
                                    ) : (
                                      <TrendingUp className="w-6 h-6 transform rotate-180" />
                                    )}
                                  </div>
                                  <div>
                                    
                                    <p className="font-bold text-primary text-base">
                                      
                                      {tx.type === "ORDER_REVENUE" ||
                                      tx.type === "CREDIT"
                                        ? "درآمد حاصل از فروش"
                                        : "درخواست تسویه حساب"}
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                      
                                      {tx.description}
                                    </p>
                                    <div className="flex gap-3 mt-2 text-xs">
                                      
                                      <span className="font-mono text-muted">
                                        
                                        {new Date(
                                          tx.createdAt,
                                        ).toLocaleDateString("fa-IR")}
                                        -
                                        {new Date(
                                          tx.createdAt,
                                        ).toLocaleTimeString("fa-IR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full font-medium ${tx.status === "COMPLETED" ? "bg-success/20 text-success" : tx.status === "PENDING" ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"}`}
                                      >
                                        
                                        {tx.status === "COMPLETED"
                                          ? "موفق"
                                          : tx.status === "PENDING"
                                            ? "در حال پردازش"
                                            : "ناموفق"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  
                                  <span
                                    className={`text-lg font-bold ${tx.type === "ORDER_REVENUE" || tx.type === "CREDIT" ? "text-success" : "text-danger"}`}
                                  >
                                    
                                    {tx.type === "ORDER_REVENUE" ||
                                    tx.type === "CREDIT"
                                      ? "+"
                                      : "-"}
                                    {Number(tx.amount).toLocaleString()}
                                    تومان
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center text-muted">
                            
                            <Wallet className="w-16 h-16 mx-auto text-inverse mb-4" />
                            <p className="text-lg font-medium text-secondary mb-1">
                              هیچ تراکنشی یافت نشد
                            </p>
                            <p className="text-sm text-muted">
                              تا کنون فعالیتی در کیف پول شما ثبت نشده است.
                            </p>
                          </div>
                        )
                      ) : walletInfo.payouts &&
                        walletInfo.payouts.length > 0 ? (
                        <div className="overflow-x-auto">
                          
                          <table className="w-full text-right border-collapse">
                            
                            <thead>
                              
                              <tr className="bg-background border-b border-subtle text-muted text-sm">
                                
                                <th className="p-4 font-semibold">
                                  کد پیگیری
                                </th>
                                <th className="p-4 font-semibold">
                                  تاریخ درخواست
                                </th>
                                <th className="p-4 font-semibold">
                                  مبلغ درخواستی
                                </th>
                                <th className="p-4 font-semibold">
                                  باقی‌مانده حدودی
                                </th>
                                <th className="p-4 font-semibold">
                                  شماره شبا مقصد
                                </th>
                                <th className="p-4 font-semibold">وضعیت</th>
                                <th className="p-4 font-semibold text-center">
                                  رسید
                                </th>
                                <th className="p-4 font-semibold text-center">
                                  عملیات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              
                              {walletInfo.payouts.map((po: any) => {
                                const remBalance = Number(
                                  walletInfo.balance || 0,
                                );
                                /* Estimate */ return (
                                  <tr
                                    key={po.id}
                                    className="hover:bg-background transition-colors text-sm text-secondary"
                                  >
                                    
                                    <td className="p-4 font-mono text-xs">
                                      {po.id.substring(0, 8).toUpperCase()}...
                                    </td>
                                    <td className="p-4">
                                      
                                      {new Date(
                                        po.createdAt,
                                      ).toLocaleDateString("fa-IR")}
                                    </td>
                                    <td className="p-4 font-bold text-primary">
                                      
                                      {Number(po.amount).toLocaleString()}
                                      تومان
                                    </td>
                                    <td className="p-4 text-muted">
                                      
                                      {po.status === "PENDING" ||
                                      po.status === "PROCESSING"
                                        ? `${remBalance.toLocaleString()} تومان`
                                        : "محاسبه شده"}
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                      {po.shaba}
                                    </td>
                                    <td className="p-4">
                                      
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${po.status === "SUCCESS" ? "bg-success/10 text-success border border-emerald-100" : po.status === "PROCESSING" ? "bg-surface text-blue-700 border border-blue-100" : po.status === "PENDING" ? "bg-warning/10 text-warning border border-amber-100" : "bg-danger/10 text-danger border border-rose-100"}`}
                                      >
                                        
                                        {po.status === "SUCCESS"
                                          ? "واریز شده"
                                          : po.status === "PROCESSING"
                                            ? "در حال پرداخت"
                                            : po.status === "PENDING"
                                              ? "در انتظار تایید"
                                              : "رد شده"}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center">
                                      
                                      {po.receiptUrl ? (
                                        <a
                                          href={po.receiptUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover rounded-lg text-xs font-bold transition-colors"
                                        >
                                          
                                          مشاهده رسید
                                        </a>
                                      ) : po.status === "SUCCESS" ? (
                                        <span className="text-xs text-muted font-bold">
                                          بدون رسید
                                        </span>
                                      ) : (
                                        <span className="text-xs text-inverse">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 text-center">
                                      
                                      <button
                                        onClick={() =>
                                          fetchSettlementDetails(po.id)
                                        }
                                        className="text-xs font-bold text-muted hover:text-primary-hover px-3 py-1.5 rounded-lg border border-subtle hover:border-primary-default/30 hover:bg-primary-default/10 transition-colors"
                                      >
                                        
                                        جزئیات
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-12 text-center text-muted">
                          
                          <Wallet className="w-16 h-16 mx-auto text-inverse mb-4" />
                          <p className="text-lg font-medium text-secondary mb-1">
                            هیچ درخواست تسویه‌ای یافت نشد
                          </p>
                          <p className="text-sm text-muted">
                            تا کنون درخواست تسویه‌ای ثبت نکرده‌اید.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {/* WITHDRAWAL MODAL */}
              {isWithdrawalModalOpen && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  
                  <div className="bg-card rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-subtle animate-scale-up text-right">
                    
                    <div className="flex items-center justify-between mb-6">
                      
                      <h3 className="font-bold text-xl text-primary">
                        درخواست تسویه حساب
                      </h3>
                      <button
                        onClick={() => {
                          setIsWithdrawalModalOpen(false);
                          setWithdrawalAmount("");
                        }}
                        className="text-muted hover:text-muted p-1"
                      >
                        
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    {/* Bank details check */}
                    {!user?.shaba ||
                    !user?.bankName ||
                    !user?.accountHolderName ? (
                      <div className="space-y-4">
                        
                        <div className="bg-danger/10 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-right">
                          
                          <AlertCircle className="w-5 h-5 shrink-0 text-danger mt-0.5" />
                          <div>
                            
                            <p className="font-bold">
                              اطلاعات حساب بانکی ناقص است
                            </p>
                            <p className="text-sm mt-1">
                              جهت ثبت درخواست تسویه حساب، ثبت تمامی اطلاعات زیر
                              در پروفایل الزامی است:
                            </p>
                            <ul className="list-disc list-inside text-xs mt-2 space-y-1 pr-2">
                              
                              <li>شماره شبا معتبر (IR)</li> <li>نام بانک</li>
                              <li>نام و نام خانوادگی صاحب حساب</li>
                            </ul>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsWithdrawalModalOpen(false);
                            setActiveTab("profile");
                          }}
                          className="w-full bg-primary-default hover:bg-primary-hover text-inverse font-bold py-3 rounded-xl transition-colors text-center"
                        >
                          
                          تکمیل اطلاعات در پروفایل
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleWithdrawalSubmit}
                        className="space-y-4"
                      >
                        
                        {/* Quick Balance Status */}
                        <div className="bg-background p-4 rounded-2xl space-y-2 text-sm text-muted text-right">
                          
                          <div className="flex justify-between">
                            
                            <span>موجودی قابل تسویه:</span>
                            <span className="font-bold text-primary-default">
                              {Number(walletInfo.balance || 0).toLocaleString()}
                              تومان
                            </span>
                          </div>
                          <div className="flex justify-between">
                            
                            <span>نام بانک:</span>
                            <span className="font-medium text-primary">
                              {user.bankName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            
                            <span>صاحب حساب:</span>
                            <span className="font-medium text-primary">
                              {user.accountHolderName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            
                            <span>شماره شبا:</span>
                            <div className="flex items-center gap-2">
                              
                              <span className="font-mono text-primary">
                                {user.shaba}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyShaba(user.shaba)}
                                className="p-1 hover:bg-surface rounded text-muted hover:text-primary transition-colors cursor-pointer"
                                title="کپی شماره شبا"
                              >
                                
                                {copiedShaba ? (
                                  <Check className="w-4 h-4 text-success" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Input for Amount */}
                        <div className="text-right">
                          
                          <label className="block text-sm font-semibold text-secondary mb-1.5">
                            مبلغ درخواستی (تومان)
                          </label>
                          <div className="relative">
                            
                            <input
                              type="number"
                              value={withdrawalAmount}
                              onChange={(e) =>
                                setWithdrawalAmount(e.target.value)
                              }
                              placeholder="مبلغ مورد نظر را وارد کنید..."
                              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left"
                              dir="ltr"
                              required
                            />
                            <span className="absolute right-4 top-3 text-sm text-muted font-semibold">
                              تومان
                            </span>
                          </div>
                          {/* Quick helper buttons */}
                          <div className="flex gap-2 mt-2">
                            
                            <button
                              type="button"
                              onClick={() =>
                                setWithdrawalAmount(
                                  String(
                                    Math.floor(Number(walletInfo.balance || 0)),
                                  ),
                                )
                              }
                              className="text-xs bg-primary-default/10 hover:bg-primary-default/20 text-primary-default px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              
                              تسویه کل موجودی
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWithdrawalAmount(
                                  String(
                                    Math.floor(
                                      Number(walletInfo.balance || 0) / 2,
                                    ),
                                  ),
                                )
                              }
                              className="text-xs bg-primary-default/10 hover:bg-primary-default/20 text-primary-default px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              
                              ۵۰٪ موجودی
                            </button>
                          </div>
                        </div>
                        {/* Live Calculation */}
                        {withdrawalAmount && Number(withdrawalAmount) > 0 && (
                          <div className="border-t border-subtle pt-3 space-y-1.5 text-sm text-right">
                            
                            <div className="flex justify-between text-muted">
                              
                              <span>مبلغ درخواستی:</span>
                              <span className="font-bold text-secondary">
                                {Number(withdrawalAmount).toLocaleString()}
                                تومان
                              </span>
                            </div>
                            <div className="flex justify-between text-muted">
                              
                              <span>موجودی باقی‌مانده پس از تسویه:</span>
                              <span
                                className={`font-bold ${Number(walletInfo.balance || 0) - Number(withdrawalAmount) < 0 ? "text-danger" : "text-success"}`}
                              >
                                
                                {(
                                  Number(walletInfo.balance || 0) -
                                  Number(withdrawalAmount)
                                ).toLocaleString()}
                                تومان
                              </span>
                            </div>
                            {Number(withdrawalAmount) >
                              Number(walletInfo.balance || 0) && (
                              <p className="text-xs text-danger font-medium mt-1">
                                خطا: مبلغ درخواستی نمی‌تواند بیشتر از موجودی
                                قابل تسویه باشد.
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={
                            isSubmittingWithdrawal ||
                            !withdrawalAmount ||
                            Number(withdrawalAmount) <= 0 ||
                            Number(withdrawalAmount) >
                              Number(walletInfo.balance || 0)
                          }
                          className="w-full bg-primary-default hover:bg-primary-hover disabled:opacity-50 text-inverse font-bold py-3 rounded-xl transition-colors text-center mt-4"
                        >
                          
                          {isSubmittingWithdrawal
                            ? "در حال ثبت درخواست..."
                            : "ثبت نهایی درخواست"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
              {/* ADD PRODUCT TAB */}
              {activeTab === "add-product" &&
                (sysConfig["SUPPLIER_CATALOG_ENABLED"] === false ? (
                  renderMaintenance("افزودن محصول")
                ) : (
                  <SupplierAddProduct
                    onSuccess={() => {
                      fetchData();
                      setActiveTab("products");
                    }}
                    onCancel={() => setActiveTab("products")}
                    showNotification={showNotification}
                  />
                ))}
              {/* EDIT PRODUCT TAB */}
              {activeTab === "edit-product" && productToEdit && (
                <SupplierAddProduct
                  initialData={productToEdit}
                  onSuccess={() => {
                    fetchData();
                    setActiveTab("products");
                    setProductToEdit(null);
                  }}
                  onCancel={() => {
                    setActiveTab("products");
                    setProductToEdit(null);
                  }}
                  showNotification={showNotification}
                />
              )}
              {/* TICKETS TAB */}
              {activeTab === "tickets" && (
                <SupplierTickets showNotification={showNotification} />
              )}
              {/* PERFORMANCE TAB */}
              {activeTab === "performance" && (
                <SupplierPerformancePanel />
              )}
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <SupplierProfile
                  user={user}
                  showNotification={showNotification}
                  onUpdateUser={onUpdateUser}
                />
              )}
              {/* ANNOUNCEMENTS TAB */}
              {activeTab === "announcements" && (
                <Announcements role="SUPPLIER" />
              )}
            </>
          )}
        </div>
      </main>
      {/* Settlement Details Modal */}
      {isSettlementModalOpen && selectedSettlement && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-subtle transform transition-all animate-scale-up font-sans">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md z-10">
              
              <h3 className="text-xl font-extrabold text-primary flex items-center gap-2">
                
                <FileText className="w-6 h-6 text-primary-default" /> جزئیات
                درخواست تسویه حساب
              </h3>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="w-10 h-10 rounded-full bg-surface hover:bg-surface text-muted flex items-center justify-center transition-colors"
              >
                
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-8 text-right">
              
              {/* Payment Details if locked */}
              {(selectedSettlement.settlement.status === "SUCCESS" ||
                selectedSettlement.settlement.financiallyLocked) && (
                <div className="bg-success/10/50 p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
                  
                  <h4 className="font-extrabold text-emerald-800 text-sm border-b border-emerald-100 pb-2 flex justify-between items-center">
                    
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> اطلاعات پرداخت و رسید
                    </span>
                    <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-0.5 rounded-full">
                      قفل مالی شده (Financially Locked)
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    <div className="space-y-1">
                      
                      <span className="text-success/70 font-bold block">
                        تاریخ پرداخت:
                      </span>
                      <span
                        className="font-mono font-bold text-emerald-900 block"
                        dir="ltr"
                      >
                        
                        {selectedSettlement.settlement.paymentDate
                          ? new Date(
                              selectedSettlement.settlement.paymentDate,
                            ).toLocaleDateString("fa-IR")
                          : "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      
                      <span className="text-success/70 font-bold block">
                        کد پیگیری (Reference):
                      </span>
                      <span className="font-mono font-bold text-emerald-900 block">
                        {selectedSettlement.settlement.transactionRef || "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      
                      <span className="text-success/70 font-bold block">
                        رسید آپلود شده:
                      </span>
                      {selectedSettlement.settlement.receiptUrl ? (
                        <a
                          href={selectedSettlement.settlement.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-success hover:text-emerald-900 underline font-mono inline-flex items-center gap-1"
                        >
                          
                          مشاهده فایل رسید
                        </a>
                      ) : (
                        <span className="text-emerald-900">بدون فایل</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Complete Order List & Wallet Credit Breakdown */}
              <div className="space-y-3">
                
                <h4 className="font-extrabold text-primary text-sm flex items-center gap-2">
                  
                  <ShoppingBag className="w-4 h-4 text-primary-default" />
                  سفارشات محاسبه شده در این تسویه
                </h4>
                <div className="border border-subtle rounded-xl overflow-hidden bg-card shadow-sm">
                  
                  <div className="overflow-x-auto">
                    
                    <table className="w-full text-right text-xs">
                      
                      <thead className="bg-background border-b border-subtle">
                        
                        <tr>
                          
                          <th className="p-3 font-bold text-muted">
                            سفارش
                          </th>
                          <th className="p-3 font-bold text-muted">
                            محصول (SKU)
                          </th>
                          <th className="p-3 font-bold text-muted text-center">
                            تعداد
                          </th>
                          <th className="p-3 font-bold text-muted">
                            درآمد تأمین‌کننده
                          </th>
                          <th className="p-3 font-bold text-muted">
                            اعتبار به کیف پول
                          </th>
                          <th className="p-3 font-bold text-muted text-center">
                            وضعیت سفارش
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        
                        {selectedSettlement.breakdown.length > 0 ? (
                          selectedSettlement.breakdown.map(
                            (item: any, idx: number) => (
                              <tr
                                key={idx}
                                className="hover:bg-background/50 transition-colors"
                              >
                                
                                <td className="p-3">
                                  
                                  <span className="font-mono text-secondary block">
                                    {item.orderNumber
                                      .substring(0, 8)
                                      .toUpperCase()}
                                    ...
                                  </span>
                                  <span className="text-[10px] text-muted block">
                                    {new Date(
                                      item.orderDate,
                                    ).toLocaleDateString("fa-IR")}
                                  </span>
                                </td>
                                <td className="p-3">
                                  
                                  <span className="font-bold text-secondary block">
                                    {item.productName}
                                  </span>
                                  <span className="font-mono text-muted text-[10px] block">
                                    SKU: {item.sku}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-bold text-secondary">
                                  {item.quantity}
                                </td>
                                <td className="p-3 font-mono font-bold text-primary-default">
                                  {item.supplierRevenue.toLocaleString()} تومان
                                </td>
                                <td className="p-3 font-mono font-bold text-success">
                                  +{item.walletCreditAmount.toLocaleString()}
                                  تومان
                                </td>
                                <td className="p-3 text-center">
                                  
                                  <span className="px-2 py-0.5 rounded-full bg-surface text-muted text-[10px] font-bold">
                                    
                                    {item.currentOrderStatus}
                                  </span>
                                </td>
                              </tr>
                            ),
                          )
                        ) : (
                          <tr>
                            
                            <td
                              colSpan={6}
                              className="p-4 text-center text-muted font-bold"
                            >
                              جزئیاتی یافت نشد
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Change Order Status & Details Modal */}
      {changingOrder && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          
          <div className="bg-card rounded-3xl max-w-4xl w-full shadow-2xl border border-subtle transform transition-all animate-scale-up font-sans">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md z-10 rounded-t-3xl">
              
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                
                <RefreshCw className="w-5 h-5 text-warning animate-spin-slow" />
                تغییر وضعیت و اطلاعات سفارش
              </h3>
              <button
                onClick={() => setChangingOrder(null)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface text-muted flex items-center justify-center transition-all cursor-pointer"
                aria-label="بستن پنجره"
              >
                
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-subtle">
              {/* Form Column */}
              <form
                onSubmit={handleChangeOrderSubmit}
                className="p-6 space-y-5 text-right"
              >
                
                <div>
                  
                  <p className="text-xs text-muted mb-1">
                    محصول سفارش داده شده:
                  </p>
                  <p className="font-bold text-sm text-primary">
                    {changingOrder.product?.name}
                  </p>
                  <p className="text-xs text-primary-default font-mono mt-0.5">
                    شناسه سفارش: #{changingOrder.id}
                  </p>
                </div>
                 <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted">
                    وضعیت سفارش
                  </label>
                  {["PAID", "PREPARING", "SHIPPED", "COMPLETED"].includes(changingOrder.status) ? (
                    <>
                      <select
                        value={changeStatus}
                        onChange={(e) => setChangeStatus(e.target.value)}
                        className="w-full bg-background text-primary border border-subtle rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                      >
                        <option value="PAID">پرداخت شده (در انتظار بسته‌بندی)</option>
                        <option value="PREPARING">در حال آماده‌سازی مرسوله</option>
                        <option value="SHIPPED">ارسال شده (ثبت کد رهگیری)</option>
                        <option value="COMPLETED">تحویل داده شده و تکمیل شده</option>
                      </select>
                      
                      <div className="space-y-1.5 mt-3 pt-3 border-t border-subtle/50">
                        <label className="block text-xs font-bold text-muted">
                          کد رهگیری پستی مرسوله
                        </label>
                        <input
                          type="text"
                          value={changeTracking}
                          onChange={(e) => setChangeTracking(e.target.value)}
                          placeholder="مثال: 309218475293..."
                          className="w-full bg-background text-primary border border-subtle rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <select
                      value={changeStatus}
                      onChange={(e) => setChangeStatus(e.target.value)}
                      className="w-full bg-background text-primary border border-subtle rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                    >
                      <option value="SUPPLIER_APPROVED">
                        تایید موجودی کالا (آماده پرداخت)
                      </option>
                      <option value="REJECTED">عدم موجودی کالا (رد سفارش)</option>
                    </select>
                  )}
                </div>
                <div className="pt-3 border-t border-subtle flex gap-3">
                  
                  <button
                    type="submit"
                    className="flex-1 bg-warning hover:bg-warning active:scale-95 text-inverse font-bold py-2.5 rounded-xl transition-all text-xs md:text-sm shadow-md shadow-amber-500/20 hover:shadow-lg cursor-pointer"
                  >
                    
                    ثبت تغییرات سفارش
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangingOrder(null)}
                    className="flex-1 bg-surface hover:bg-surface text-secondary font-bold py-2.5 rounded-xl transition-all text-xs md:text-sm cursor-pointer"
                  >
                    
                    انصراف
                  </button>
                </div>
              </form>

              {/* Timeline Column */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h4 className="text-xs font-bold text-muted mb-4">تاریخچه و رهگیری کامل سفارش:</h4>
                <OrderTimeline orderId={changingOrder.orderId} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT INVENTORY ISSUE MODAL */}
      {inventoryIssueOrder && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-subtle animate-scale-up text-right">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <h3 className="font-bold text-lg text-danger flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger" />
                گزارش مشکل موجودی کالا
              </h3>
              <button
                onClick={() => setInventoryIssueOrder(null)}
                className="text-muted hover:text-primary p-1 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleInventoryIssueSubmit} className="space-y-4">
              <div className="bg-danger/5 border border-danger/10 p-3 rounded-2xl text-xs space-y-1 text-slate-600 leading-relaxed">
                <p className="font-bold text-danger">توضیحات مهم:</p>
                <p>
                  شما در حال ثبت گزارش مشکل در تامین یا موجودی کالا برای سفارش مستقیم به شماره 
                  <span className="font-mono text-danger font-bold"> #{inventoryIssueOrder.id} </span> هستید.
                </p>
                <p>
                  کالای سفارش داده شده: <strong>{inventoryIssueOrder.product?.name || "نامشخص"}</strong> به تعداد <strong>{inventoryIssueOrder.quantity || 1}</strong> عدد.
                </p>
                <p>
                  با تایید این فرم، یک تیکت پشتیبانی فوری با بخش پشتیبانی فنی ثبت خواهد شد تا کارشناسان موضوع را با خریدار بررسی کنند.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted">
                  توضیح دقیق مشکل و راهکار پیشنهادی شما
                </label>
                <textarea
                  required
                  rows={4}
                  value={issueMessage}
                  onChange={(e) => setIssueMessage(e.target.value)}
                  placeholder="توضیح دهید که آیا کالا به طور کامل ناموجود است، کسری دارد، یا مایل به ارسال کالای جایگزین هستید..."
                  className="w-full bg-background text-primary border border-subtle rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-danger-default transition-all"
                />
              </div>

              <div className="pt-3 border-t border-subtle flex gap-3">
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="flex-1 bg-danger hover:bg-rose-700 disabled:opacity-50 text-inverse font-bold py-2.5 rounded-xl transition-all text-xs md:text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingIssue ? "در حال ثبت گزارش..." : "ارسال گزارش فوری"}
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryIssueOrder(null)}
                  className="flex-1 bg-surface hover:bg-surface text-secondary font-bold py-2.5 rounded-xl transition-all text-xs md:text-sm cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
